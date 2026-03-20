import { db } from "./db";
import {
  products,
  sales,
  saleItems,
  type InsertProduct,
  type UpdateProductRequest,
  type ProductResponse,
  type SaleResponse,
  type CreateSaleRequest,
  type DashboardStatsResponse,
} from "@shared/schema";
import { eq, desc, sql, gte } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<ProductResponse[]>;
  getProduct(id: number): Promise<ProductResponse | undefined>;
  createProduct(product: InsertProduct): Promise<ProductResponse>;
  updateProduct(
    id: number,
    updates: UpdateProductRequest,
  ): Promise<ProductResponse>;
  deleteProduct(id: number): Promise<void>;

  // Sales
  getSales(): Promise<SaleResponse[]>;
  getSale(id: number): Promise<SaleResponse | undefined>;
  createSale(sale: CreateSaleRequest): Promise<SaleResponse>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStatsResponse>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<ProductResponse[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<ProductResponse | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<ProductResponse> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: number,
    updates: UpdateProductRequest,
  ): Promise<ProductResponse> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return {
      ...updatedProduct,
      createdAt: new Date(updatedProduct.createdAt ?? new Date()),
      updatedAt: new Date(updatedProduct.updatedAt ?? new Date()),
    };
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getSales(): Promise<SaleResponse[]> {
    const salesRecords = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.date));

    const result: SaleResponse[] = [];
    for (const sale of salesRecords) {
      const items = await db
        .select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          subtotal: saleItems.subtotal,
          product: products,
        })
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, sale.id));

      result.push({
        ...sale,
        items: items as any,
      });
    }

    return result;
  }

  async getSale(id: number): Promise<SaleResponse | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        subtotal: saleItems.subtotal,
        product: products,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, sale.id));

    return { ...sale, items: items as any };
  }

  async createSale(saleRequest: CreateSaleRequest): Promise<SaleResponse> {
    // Start a transaction for creating the sale and updating inventory
    return await db.transaction(async (tx) => {
      // 1. Create the sale
      const [newSale] = await tx
        .insert(sales)
        .values({
          totalAmount: saleRequest.totalAmount.toString(),
          paymentMethod: saleRequest.paymentMethod,
          date:
            saleRequest.date != null ? new Date(saleRequest.date) : new Date(),
        })
        .returning();

      // 2. Create sale items and update product quantities
      for (const item of saleRequest.items) {
        // Insert sale item
        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
        });

        // Update product inventory
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) {
          throw new Error("Producto no encontrado");
        }

        // 🔧 corregir stock negativo existente
        let currentStock = product.quantity;
        if (currentStock < 0) {
          currentStock = 100;

          await tx
            .update(products)
            .set({ quantity: currentStock })
            .where(eq(products.id, item.productId));
        }

        // 🛑 validar stock suficiente
        if (currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        // ➖ descontar correctamente
        const newQuantity = currentStock - item.quantity;

        await tx
          .update(products)
          .set({ quantity: newQuantity })
          .where(eq(products.id, item.productId));
      }

      // Return the complete sale
      const fullSale = await this.getSale(newSale.id);
      if (!fullSale) throw new Error("Sale not found");
      return fullSale;
    });
  }

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    // Total products
    const [productsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    // Low stock products (e.g., less than 10)
    const [lowStockCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(sql`${products.quantity} < 10`);

    // Today's boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sales today
    const [salesTodayResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`COALESCE(sum(${sales.totalAmount}::numeric), 0)::float`,
      })
      .from(sales)
      .where(gte(sales.date, today));

    return {
      totalProducts: productsCountResult.count,
      lowStockProducts: lowStockCountResult.count,
      totalSalesToday: salesTodayResult.count,
      revenueToday: salesTodayResult.revenue || 0,
    };
  }
}

export const storage = new DatabaseStorage();
// 🔧 FIX TEMPORAL: arreglar stocks negativos
async function fixNegativeStock() {
  await db
    .update(products)
    .set({ quantity: 100 })
    .where(sql`${products.quantity} < 0`);
}

// ejecutar automáticamente al iniciar
