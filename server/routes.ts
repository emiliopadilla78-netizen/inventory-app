import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

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
      console.error("PRODUCTS ERROR:", err);
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
    } catch {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = req.body;
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(500).json({
        message: "Failed to create product",
        error: err?.message,
      });
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const input = req.body;
      const product = await storage.updateProduct(Number(req.params.id), input);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.status(204).end();
    } catch {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // --- Sales ---

  app.get(api.sales.list.path, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post(api.sales.create.path, async (req, res) => {
    try {
      const sale = await storage.createSale(req.body);
      res.status(201).json(sale);
    } catch (err: any) {
      res.status(500).json({
        message: err.message || "Failed to create sale",
      });
    }
  });

  // --- IMPORTACIÓN EXCEL ---

  app.post("/api/sales/import", async (req, res) => {
    try {
      const { rows } = req.body;

      if (!rows || !Array.isArray(rows)) {
        return res.status(400).json({ message: "Formato inválido" });
      }

      const errors: string[] = [];
      const validItems: any[] = [];

      let saleDate: Date = new Date();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (i === 0 && row.date) {
          saleDate = new Date(row.date);
        }

        const product = await storage.getProductBySku(row.sku);

        if (!product) {
          errors.push(`Fila ${i + 1}: SKU no existe (${row.sku})`);
          continue;
        }

        const clientName = row.client || "";

        const globalDiscount = 0.2;

        let clientDiscount = 0;

        if (clientName === "Cliente A") {
          clientDiscount = 0.3;
        } else if (clientName === "Cliente B") {
          clientDiscount = 0.1;
        } else {
          clientDiscount = 0.1;
        }

        const maxDiscountFinal = Math.max(globalDiscount, clientDiscount);

        const basePrice = Number(product.price);
        const minPriceAllowed = basePrice * (1 - maxDiscountFinal);

        if (Number(row.unitPrice) < minPriceAllowed) {
          errors.push(
            `Fila ${i + 1}: precio (${row.unitPrice}) menor al mínimo (${minPriceAllowed.toFixed(0)})`
          );
          continue;
        }

        console.log("DEBUG STOCK:", {
          sku: row.sku,
          productQty: product?.quantity,
          rowQty: row.quantity,
        });

        if (!row.quantity || row.quantity <= 0) {
          errors.push(`Fila ${i + 1}: cantidad inválida`);
          continue;
        }

        if (product.quantity < row.quantity) {
          errors.push(
            `Fila ${i + 1}: stock insuficiente (${product.name} | disponible: ${product.quantity} | solicitado: ${row.quantity})`
          );
          continue;
        }

        validItems.push({
          productId: product.id,
          quantity: row.quantity,
          unitPrice: Number(row.unitPrice),
          subtotal: Number(row.unitPrice) * row.quantity,
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Errores en archivo",
          errors,
        });
      }

      const sale = await storage.createSale({
        items: validItems,
        totalAmount: validItems.reduce((acc, i) => acc + i.subtotal, 0),
        paymentMethod: row.client || "Sin vendedor",
        status: "completed",
        date: saleDate,
      });

      res.json({ success: true, sale });

    } catch (err: any) {
      console.error("IMPORT ERROR:", err);
      res.status(500).json({
        message: "Error al importar ventas",
        detail: err?.message,
      });
    }
  });

  // --- Dashboard (ROBUSTO) ---

  app.get(api.dashboard.stats.path, async (req, res) => {
  try {
    const range = req.query.range || "today";

    const sales = (await storage.getSales()) || [];
    const products = (await storage.getProducts()) || [];

    const now = new Date();

    let filteredSales = sales;

    if (range === "today") {
      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d.toDateString() === now.toDateString();
      });
    }

    if (range === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d >= weekAgo;
      });
    }

    if (range === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);

      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d >= monthAgo;
      });
    }

    const totalRevenue = filteredSales.reduce(
      (sum: number, s: any) => sum + Number(s?.totalAmount || 0),
      0
    );

    res.json({
      revenueToday: totalRevenue,
      totalSalesToday: filteredSales.length,
      totalProducts: products.length,
      totalUnits: products.reduce(
        (sum: number, p: any) => sum + Number(p?.quantity || 0),
        0
      ),
      inventoryValue: products.reduce(
        (sum: number, p: any) =>
          sum + Number(p?.cost || 0) * Number(p?.quantity || 0),
        0
      ),
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
});
// --- Dashboard Sellers ---

app.get("/api/dashboard/sellers", async (req, res) => {
  try {
    const range = req.query.range || "today";

    const sales = (await storage.getSales()) || [];

    const now = new Date();

    let filteredSales = sales;

    if (range === "today") {
      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d.toDateString() === now.toDateString();
      });
    }

    if (range === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d >= weekAgo;
      });
    }

    if (range === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);

      filteredSales = sales.filter((s: any) => {
        const d = new Date(s.date);
        return d >= monthAgo;
      });
    }

    const sellersMap: Record<string, number> = {};

    for (const sale of filteredSales) {
      const seller = sale.paymentMethod || "Sin vendedor";

      sellersMap[seller] =
        (sellersMap[seller] || 0) + Number(sale.totalAmount || 0);
    }

    const result = Object.entries(sellersMap).map(([name, total]) => ({
      name,
      total,
    }));

    result.sort((a, b) => b.total - a.total);

    res.json(result.slice(0, 5));
  } catch (err) {
    console.error("SELLERS ERROR:", err);
    res.status(500).json({ message: "Error sellers" });
  }
});

  return httpServer;
}