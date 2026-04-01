import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  variant: text("variant"),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  category: text("category").notNull(),
  atributo: text("atributo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  totalAmount: numeric("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  date: timestamp("date").defaultNow(),

  clientId: integer("client_id"),
  discountPercent: integer("discount_percent").default(0),
  status: text("status").default("approved").notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// === RELATIONS ===
export const salesRelations = relations(sales, ({ many }) => ({
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
}));

// === BASE SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

// Request types
export type CreateProductRequest = InsertProduct;
export type UpdateProductRequest = Partial<InsertProduct>;

export type CreateSaleItemRequest = Omit<InsertSaleItem, "saleId">;
export type CreateSaleRequest = InsertSale & {
  items: CreateSaleItemRequest[];
};

// Response types
export type ProductResponse = Product;
export type ProductsListResponse = Product[];

export type SaleItemWithProduct = SaleItem & { product?: Product };
export type SaleResponse = Sale & { items: SaleItemWithProduct[] };
export type SalesListResponse = Sale[];

export type DashboardStatsResponse = {
  totalProducts: number;
  lowStockProducts: number;
  totalSalesToday: number;
  revenueToday: number;
};
