import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";

export default function POS() {
  const { data: products }: any = useProducts();
  console.log("POS PRODUCTS:", products);
  const createSale = useCreateSale();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<any[]>([]);

  const selectedProduct = products?.find(
    (p: any) => p.id === selectedProductId,
  );
  const stock = selectedProduct?.quantity ?? 0;

  const addToCart = () => {
    if (!selectedProduct) return;

    if (quantity > selectedProduct.quantity) {
      alert("Not enough stock available");
      return;
    }

    const unitPrice = Number(selectedProduct.price);
    const subtotal = unitPrice * quantity;

    setCart([
      ...cart,
      {
        productId: selectedProduct.id,
        name:
          selectedProduct.name +
          (selectedProduct.variant ? ` (${selectedProduct.variant})` : ""),
        quantity,
        unitPrice,
        subtotal,
      },
    ]);

    setQuantity(1);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const completeSale = async () => {
    if (cart.length === 0) return;

    for (const item of cart) {
      const product = products.find((p: any) => p.id === item.productId);

      if (!product) continue;

      if (item.quantity > product.quantity) {
        alert("Stock changed. Not enough inventory for " + product.name);
        return;
      }
    }

    await createSale.mutateAsync({
      paymentMethod: "cash",
      totalAmount: total.toFixed(2),
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
        Point of Sale
      </h1>

      {/* Product selector */}

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search product..."
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
          {products
            ?.filter(
              (p: any) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, 10)
            .map((p: any) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProductId(p.id);
                  setSearch(p.name + (p.variant ? ` (${p.variant})` : ""));
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

      {/* Add to cart */}

      <button
        onClick={addToCart}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: 6,
        }}
      >
        Add to Cart
      </button>

      {/* Cart */}

      <h2 style={{ marginTop: 40, fontSize: 22 }}>Cart</h2>

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

                const newCart = [...cart];
                newCart[index].unitPrice = price;
                newCart[index].subtotal = price * newCart[index].quantity;

                setCart(newCart);
              }}
            />

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

      {/* Complete sale */}

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
        Complete Sale
      </button>
    </div>
  );
}
