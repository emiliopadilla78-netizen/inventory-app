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

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err: any) {
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
      const quantity = Number(req.body.quantity);

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, {
        quantity: product.quantity + quantity,
      });

      res.json(updatedProduct);
    } catch (err) {
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
      const input = req.body;
      const sale = await storage.createSale(input);
      res.status(201).json(sale);
    } catch (err: any) {
      console.error("SALE ERROR:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      res.status(500).json({
        message: err.message || "Failed to create sale",
      });
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

  return httpServer;
}
