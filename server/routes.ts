import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // --- Products ---

  app.get(api.products.list.path, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      // PostgreSQL unique constraint violation
      if (err?.code === "23505") {
        return res
          .status(400)
          .json({ message: "A product with that SKU already exists." });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      product.createdAt = new Date(product.createdAt);
      product.updatedAt = new Date(product.updatedAt);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  app.post("/api/products/:id/add-stock", async (req, res) => {
    try {
      const id = Number(req.params.id);
      console.log("ADD STOCK", id, req.body);
      const quantity = Number(req.body.quantity);

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const newQuantity = product.quantity + quantity;

      const updatedProduct = await storage.updateProduct(id, {
        quantity: newQuantity,
      });

      res.json(updatedProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to add stock" });
    }
  });

  // --- Sales ---

  app.get(api.sales.list.path, async (req, res) => {
    try {
      const salesList = await storage.getSales();
      res.json(salesList);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get(api.sales.get.path, async (req, res) => {
    try {
      const sale = await storage.getSale(Number(req.params.id));
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post(api.sales.create.path, async (req, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      const sale = await storage.createSale(input);
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // --- Dashboard ---

  app.get(api.dashboard.stats.path, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // --- Seed Database ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const products = await storage.getProducts();
    if (products.length === 0) {
      await storage.createProduct({
        name: "Wireless Mouse",
        sku: "WM-001",
        description: "Ergonomic wireless mouse with 2.4GHz receiver",
        price: "29.99",
        quantity: 50,
        category: "Electronics",
      });
      await storage.createProduct({
        name: "Mechanical Keyboard",
        sku: "KB-102",
        description: "RGB mechanical keyboard with blue switches",
        price: "89.50",
        quantity: 15,
        category: "Electronics",
      });
      await storage.createProduct({
        name: "Coffee Mug",
        sku: "CM-055",
        description: "Ceramic coffee mug 12oz",
        price: "12.00",
        quantity: 100,
        category: "Office Supplies",
      });
      await storage.createProduct({
        name: "Office Chair",
        sku: "OC-200",
        description: "Ergonomic mesh office chair",
        price: "145.00",
        quantity: 5,
        category: "Furniture",
      });
      console.log("Database seeded successfully with sample products.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
