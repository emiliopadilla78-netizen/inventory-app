import { useSales } from "@/hooks/use-sales";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { z } from "zod";
import { api } from "@shared/routes";

type Sale = z.infer<(typeof api.sales.list.responses)[200]>[number];

export default function SalesHistory() {
  const { data: sales, isLoading } = useSales();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // 🔥 usuarios únicos
  const uniqueUsers = Array.from(
    new Map(
      (sales || [])
        .filter((s) => s.user)
        .map((s) => [s.user.id, s.user])
    ).values()
  );

  // 🔥 ventas filtradas
  const filteredSales = (sales || []).filter((sale) =>
    selectedUser === "all"
      ? true
      : String(sale.user?.id) === selectedUser
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Ventas
        </h1>

       <div style={{ marginTop: "12px" }}>
  
  {/* EXPORT */}
  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
    <input type="date" id="fromDate" style={{ padding: "6px" }} />
    <input type="date" id="toDate" style={{ padding: "6px" }} />

    <button
  style={{
    padding: "8px 16px",
    background: "#16a34a",
    color: "white",
    borderRadius: "6px",
    fontWeight: "500",
  }}
  onClick={() => {
    const from = (document.getElementById("fromDate") as HTMLInputElement).value;
    const to = (document.getElementById("toDate") as HTMLInputElement).value;
    const url = `/api/sales/export?from=${from}&to=${to}`;
    window.open(url, "_blank");
  }}
>
  Exportar ventas
</button>

<select
      value={selectedUser}
      onChange={(e) => setSelectedUser(e.target.value)}
      style={{ padding: "6px" }}
    >
      <option value="all">Todos los vendedores</option>
      {uniqueUsers.map((u: any) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  </div>

</div>

        <p className="text-muted-foreground text-lg">
          Ver historial de ventas y detalles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Todas las ventas
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Vendedor</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No hay ventas</TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                  >
                    <TableCell>{sale.id}</TableCell>
                    <TableCell>
                      {format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{sale.paymentMethod === "import" ? "Importación" : "Venta POS"}</TableCell>
                    <TableCell className="text-right">
                      ${Number(sale.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {sale.user?.name || "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedSale}
        onOpenChange={() => setSelectedSale(null)}
      >
        <DialogContent>
          {selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Detalle Venta #{selectedSale.id}
                </DialogTitle>
              </DialogHeader>

              <div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>
                    Vendedor: {selectedSale.user?.name || "N/A"}
                  </strong>
                </div>

                {selectedSale.items?.map((item) => (
                  <div key={item.id}>
                    {item.product?.name} - {item.quantity} x $
                    {Number(item.unitPrice).toFixed(2)}
                  </div>
                ))}

                <hr />

                <strong>
                  Total: ${Number(selectedSale.totalAmount).toFixed(2)}
                </strong>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
