import { useState } from "react";
import * as XLSX from "xlsx";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";

export default function POS() {
const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { data: products }: any = useProducts();
  console.log("POS PRODUCTS:", products);
  const createSale = useCreateSale();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
const [uploading, setUploading] = useState(false);
const [uploadResult, setUploadResult] = useState<string | null>(null);
const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const selectedProduct = products?.find(
    (p: any) => p.id === selectedProductId,
  );
  const stock = selectedProduct?.quantity ?? 0;

const addToCart = () => {
  if (!selectedProduct) return;

  const existingIndex = cart.findIndex(
    (item) => item.productId === selectedProduct.id
  );
const unitPrice = Number(selectedProduct.price);
  const basePrice = Number(selectedProduct.price);

  if (existingIndex !== -1) {
    const newCart = [...cart];

    const newQty = newCart[existingIndex].quantity + quantity;

    if (newQty > selectedProduct.quantity) {
      alert("Not enough stock available");
      return;
    }

    newCart[existingIndex].quantity = newQty;
    newCart[existingIndex].subtotal =
      newQty * newCart[existingIndex].unitPrice;

    setCart(newCart);
  } else {
    if (quantity > selectedProduct.quantity) {
      alert("Not enough stock available");
      return;
    }

    setCart([
      ...cart,
      {
        productId: selectedProduct.id,
        name:
          selectedProduct.name +
          (selectedProduct.variant ? ` (${selectedProduct.variant})` : ""),
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      },
    ]);
  }

  setQuantity(1);
};

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
// IMPORTACIÓN EXCEL
const handleFileUpload = async (e: any) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  setUploadResult(null);
  setUploadErrors([]);

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    const excelDateToJSDate = (excelDate: number) => {
  return new Date((excelDate - 25569) * 86400 * 1000);
};

const rows = json.map((row: any) => {
  const rawDate = row["fecha de venta"];

  let parsedDate;

  if (typeof rawDate === "number") {
    parsedDate = excelDateToJSDate(rawDate);
 } else if (typeof rawDate === "string") {
  const parts = rawDate.split("-");
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);

  parsedDate = new Date(year, month, day);
} else {
    parsedDate = new Date();
  }

  return {
    sku: String(row["sku"]).trim(),
    quantity: Number(row["cantidad"]),
    unitPrice: Number(row["precio"]),
    client: row["cliente (rut)"],
    date: parsedDate.toISOString(),
  };
});

    const response = await fetch("/api/sales/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });

    const result = await response.json();

    if (!response.ok) {
      setUploadErrors(result.errors || ["Error desconocido"]);
    } else {
      setUploadResult("Archivo cargado correctamente ✅");
    }
  } catch (error) {
    setUploadErrors(["Error procesando archivo"]);
  } finally {
    setUploading(false);
  }
};
  const filteredProducts = (products ?? []).filter((p: any) => {
    const name = (p.name ?? "").toLowerCase();
    const sku = (p.sku ?? "").toLowerCase();
    const term = (search || "").toLowerCase().trim();

    if (!term) return true;

    return name.includes(term) || sku.includes(term);
  });
const clientMap: Record<number, string> = {
  1: "Cliente A",
  2: "Cliente B",
  3: "Cliente C",
};

  const completeSale = async () => {
    if (!selectedClientId) {
      alert("Debes seleccionar un cliente");
      return;
    }
    if (cart.length === 0) return;
    // 🔥 VALIDACIÓN DE DESCUENTOS
    const productosConExceso = cart.filter((item) => {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) return false;

      const base = Number(product.price);
      const venta = Number(item.unitPrice);

      if (base === 0) return false;

      const discount = 1 - venta / base;

      let maxDiscount = product.max_discount ?? 0.2;

// clientes especiales pueden superar límite
if (selectedClientId === 3) {
  maxDiscount = 0.5;
}

      return discount > maxDiscount;
    });
    if (productosConExceso.length > 0) {
      const mensaje =
        "Descuentos fuera de rango:\n\n" +
        productosConExceso
          .map((item) => {
            const product = products.find((p: any) => p.id === item.productId);
            const base = Number(product.price);
            const venta = Number(item.unitPrice);
            const discount = Math.round((1 - venta / base) * 100);

            return `${product.name} → ${discount}%`;
          })
          .join("\n") +
        "\n\n¿Deseas continuar?";

      const confirmar = window.confirm(mensaje);

      if (!confirmar) return;
    }

    for (const item of cart) {
      const product = products.find((p: any) => p.id === item.productId);

      if (!product) continue;

      if (item.quantity > product.quantity) {
        alert("Stock changed. Not enough inventory for " + product.name);
        return;
      }
    }

    await createSale.mutateAsync({
  paymentMethod: clientMap[selectedClientId!] || "Sin vendedor",
  totalAmount: total.toFixed(2),
  clientId: selectedClientId,
  user_id: user.id,
  items: cart.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toFixed(2),
    subtotal: item.subtotal.toFixed(2),
  })),
});

    setCart([]);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ marginRight: 10 }}>Cliente:</label>
          <select
            value={selectedClientId ?? ""}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? Number(e.target.value) : null,
              )
            }
          >
            <option value="">Seleccionar cliente</option>
            <option value={1}>Cliente A (30%)</option>
            <option value={2}>Cliente B (10%)</option>
            <option value={3}>Cliente C (50%)</option>
          </select>
        </div>
        Punto de Venta
      </h1>
<div style={{ marginBottom: 20 }}>
  <input
    type="file"
    accept=".xlsx, .xls"
    onChange={handleFileUpload}
  />

  {uploading && <p>Cargando archivo...</p>}

  {uploadResult && <p style={{ color: "green" }}>{uploadResult}</p>}

  {uploadErrors.length > 0 && (
    <ul style={{ color: "red" }}>
      {uploadErrors.map((err, i) => (
        <li key={i}>{err}</li>
      ))}
    </ul>
  )}
</div>

      {/* Product selector */}

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Busca producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, width: 650, marginBottom: 10, fontSize: 16 }}
        />

        <div
          style={{
            maxHeight: 250,
            overflowY: "auto",
            border: "1px solid #ddd",
            width: 650,
          }}
        >
          {filteredProducts.slice(0, 10).map((p: any) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProductId(p.id);
                setSearch("");
              }}
              style={{
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "grid",
                gridTemplateColumns: "350px 150px 100px",
                alignItems: "center",
              }}
            >
              <div>
                <b>{p.sku}</b> — {p.name}
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {p.variant || "-"}
              </div>

              <div style={{ textAlign: "right", color: "#666" }}>
                Stock: {p.quantity}
                {p.quantity < 10 && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    ⚠️ Bajo stock
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {selectedProduct && (
          <div style={{ marginTop: 10 }}>
            Stock available: <b>{stock}</b>
          </div>
        )}
      </div>

      {/* Quantity */}

      <div style={{ marginBottom: 20 }}>
        <input
          type="number"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{ padding: 8, width: 100 }}
        />
      </div>

      {/* Agrega al Carro */}

      <button
        onClick={addToCart}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: 6,
        }}
      >

        Agrega al Carro
      </button>

      {/* Carro */}

      <h2 style={{ marginTop: 40, fontSize: 22 }}>Carro</h2>

      <div style={{ marginTop: 20 }}>
        {cart.map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: 10,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ width: 350 }}>{item.name}</div>

            <div>Qty: {item.quantity}</div>

          <input
  type="number"
  value={item.unitPrice}
  step="0.01"
  style={{ width: 80 }}
  onChange={(e) => {
    const price = Number(e.target.value);

    const product = products.find((p: any) => p.id === item.productId);
    if (!product) return;

    const base = Number(product.price);
    const discount = base > 0 ? 1 - price / base : 0;

    const newCart = [...cart];
    newCart[index].unitPrice = price;
    newCart[index].subtotal = price * newCart[index].quantity;
    newCart[index].discountPercent = discount;

    setCart(newCart);
  }}
/>

<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <input
    type="number"
    value={Math.round((item.discountPercent ?? 0) * 100)}
    style={{ width: 60 }}
    onChange={(e) => {
      const percent = Number(e.target.value) / 100;

      const product = products.find((p: any) => p.id === item.productId);
      if (!product) return;

      const base = Number(product.price);
      const newPrice = base * (1 - percent);

      const newCart = [...cart];
      newCart[index].unitPrice = newPrice;
      newCart[index].subtotal = newPrice * newCart[index].quantity;
      newCart[index].discountPercent = percent;

      setCart(newCart);
    }}
  />
  <span>%</span>
</div>

            <div style={{ width: 120 }}>
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </div>

            <button
              onClick={() => {
                const newCart = cart.filter((_, i) => i !== index);
                setCart(newCart);
              }}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "4px 10px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Total */}

      <h2 style={{ marginTop: 20 }}>Total: ${total.toFixed(2)}</h2>

      {/* Terminar Venta */}

      <button
        onClick={completeSale}
        style={{
          marginTop: 20,
          padding: "12px 30px",
          background: "green",
          color: "white",
          borderRadius: 6,
        }}
      >
        Terminar Venta
      </button>
    </div>
  );
}
