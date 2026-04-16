import fetch from "node-fetch";
import xlsx from "xlsx";

const workbook = xlsx.readFile("Productos a cargar.ods");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

async function cargar() {
  for (const row of data) {
   const producto = {
  name: String(row.producto || "").trim(),
  sku: String(row.sku || row.SKU_Base || "").trim(),
  category: String(row.linea_producto || "General").trim(),
  variant: String(row.Variant || "").trim(),
  price: String(row.price || 0),
  quantity: Number(row.stock || 0),
  atributo: "",
};

    if (!producto.name || !producto.sku) {
      console.log("⛔ fila inválida:", row);
      continue;
    }

    try {
      const res = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });

      if (!res.ok) {
        const error = await res.text();
        console.log("❌ error:", producto.sku, error);
        continue;
      }

      console.log("✔ cargado:", producto.name);
    } catch (err) {
      console.log("❌ fallo:", producto.sku, err.message);
    }
  }
}

cargar();