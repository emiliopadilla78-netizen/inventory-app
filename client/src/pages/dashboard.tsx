import { useDashboardStats, useDashboardSellers } from "@/hooks/use-dashboard";
import { useState } from "react";
import { useSales } from "@/hooks/use-sales";
import { format } from "date-fns";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  ShoppingCart,
  History,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [range, setRange] = useState("today");

  const { data, isLoading: statsLoading } = useDashboardStats(range);

// 🔥 FORZAR USO DIRECTO
const stats = data;
  const { data: sellers } = useDashboardSellers(range);
  const { data: sales, isLoading: salesLoading } = useSales();

  const recentSales = sales?.slice(0, 5) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Vista General</h1>

        <div style={{ marginTop: 10 }}>
          Mostrando:{" "}
          {range === "today"
            ? "Hoy"
            : range === "week"
            ? "Últimos 7 días"
            : "Últimos 30 días"}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
  onClick={() => setRange("today")}
  style={{
    fontWeight: range === "today" ? "bold" : "normal",
    textDecoration: range === "today" ? "underline" : "none",
  }}
>
  Hoy
</button>

<button
  onClick={() => setRange("week")}
  style={{
    fontWeight: range === "week" ? "bold" : "normal",
    textDecoration: range === "week" ? "underline" : "none",
  }}
>
  Semana
</button>

<button
  onClick={() => setRange("month")}
  style={{
    fontWeight: range === "month" ? "bold" : "normal",
    textDecoration: range === "month" ? "underline" : "none",
  }}
>
  Mes
</button>
        </div>
      </div>

      {/* STATS */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Ingresos"
            value={`$${Number(stats?.revenueToday || 0).toFixed(0)}`}
            icon={DollarSign}
          />

          <StatCard
            title="Ventas"
            value={stats?.totalSalesToday || 0}
            icon={TrendingUp}
          />

          <StatCard
            title="SKU (Líneas)"
            value={stats?.totalProducts || 0}
            icon={Package}
          />

          <StatCard
            title="Unidades"
            value={stats?.totalUnits || 0}
            icon={Package}
          />
<StatCard
  title=""
  value={`$${Number(stats?.inventoryValue || 0).toFixed(0)}`}
  icon={DollarSign}
/>

          <StatCard
            title="Bajo Stock"
            value={stats?.lowStockProducts || 0}
            icon={AlertTriangle}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP VENDEDORES */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            {!sellers ? (
              <div>Cargando...</div>
            ) : sellers.length === 0 ? (
              <div>Sin datos</div>
            ) : (
              sellers.map((s: any, i: number) => (
                <div key={i}>
                  {i + 1}. {s.name} — ${Number(s.total).toFixed(0)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ÚLTIMOS MOVIMIENTOS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Últimos Movimientos
            </CardTitle>
          </CardHeader>

          <CardContent>
            {salesLoading ? (
              <div>Cargando...</div>
            ) : recentSales.length === 0 ? (
              <div>No hay ventas</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>
                        {format(new Date(sale.date), "dd-MM-yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${Number(sale.totalAmount).toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
        <Icon className="w-6 h-6" />
      </CardContent>
    </Card>
  );
}