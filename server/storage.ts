import { db } from "./db";
import { sql, eq, desc } from "drizzle-orm";
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

export interface IStorage {
  getProducts(): Promise<ProductResponse[]>;
  getProduct(id: number): Promise<ProductResponse | undefined>;
  getProductBySku(sku: string): Promise<any>;
  createProduct(product: InsertProduct): Promise<ProductResponse>;
  updateProduct(
    id: number,
    updates: UpdateProductRequest,
  ): Promise<ProductResponse>;
  deleteProduct(id: number): Promise<void>;

  getSales(): Promise<SaleResponse[]>;
  getSale(id: number): Promise<SaleResponse | undefined>;
  createSale(sale: CreateSaleRequest): Promise<SaleResponse>;

  getDashboardStats(): Promise<DashboardStatsResponse>;
}

export class DatabaseStorage implements IStorage {

  async getProducts(): Promise<ProductResponse[]> {
    const result = await db.execute(
      sql`SELECT * FROM products`
    );
    return result.rows as any;
  }

  async getProduct(id: number): Promise<ProductResponse | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductBySku(sku: string) {
    return db.query.products.findFirst({
      where: (p, { eq }) => eq(p.sku, sku),
    });
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

      let user = null;

           result.push({
        ...sale,
        items: items as any,
        user,
      });
    }

    return result;
  }

  async getSale(id: number): Promise<SaleResponse | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    return {
      ...sale,
      items: [],
    } as SaleResponse;
  }

  async createSale(saleRequest: CreateSaleRequest): Promise<SaleResponse> {
    return await db.transaction(async (tx) => {
      const [newSale] = await tx
        .insert(sales)
        .values({
          totalAmount: saleRequest.totalAmount.toString(),
          paymentMethod: saleRequest.paymentMethod,
          date: saleRequest.date ? new Date(saleRequest.date) : new Date(),
          userId: saleRequest.user_id,
        })
        .returning();

      for (const item of saleRequest.items) {
        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
        });

        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) throw new Error("Product not found");

        if (product.quantity < item.quantity) {
          throw new Error("Insufficient stock");
        }

        await tx
          .update(products)
          .set({
            quantity: product.quantity - item.quantity,
          })
          .where(eq(products.id, item.productId));
      }

      return {
        ...newSale,
        items: saleRequest.items,
      } as SaleResponse;
    });
  }

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      totalSalesToday: 0,
      revenueToday: 0,
    };
  }
}

export const storage = new DatabaseStorage();
