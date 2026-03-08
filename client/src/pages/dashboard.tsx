import { useDashboardStats } from "@/hooks/use-dashboard";
import { useSales } from "@/hooks/use-sales";
import { format } from "date-fns";
import { Package, AlertTriangle, TrendingUp, DollarSign, Activity, ShoppingCart, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sales, isLoading: salesLoading } = useSales();

  const recentSales = sales?.slice(0, 5) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground text-lg">Monitor your store's performance today.</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue Today"
            value={`$${stats?.revenueToday.toFixed(2) || "0.00"}`}
            icon={DollarSign}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            title="Sales Today"
            value={stats?.totalSalesToday || 0}
            icon={TrendingUp}
            color="bg-success/10 text-success"
          />
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockProducts || 0}
            icon={AlertTriangle}
            color={stats?.lowStockProducts && stats.lowStockProducts > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl shadow-black/5 border-border/50 rounded-2xl overflow-hidden glass-panel">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {salesLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentSales.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No sales yet</h3>
                <p className="text-muted-foreground">Start processing orders in the POS to see them here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Transaction ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 font-medium">#{sale.id.toString().padStart(6, '0')}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(sale.date), "h:mm a")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize bg-background">
                          {sale.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-bold text-foreground">
                        ${Number(sale.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Can add more cards here for low stock list or top products */}
        <Card className="shadow-xl shadow-black/5 border-border/50 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <a href="/pos" className="flex items-center gap-4 p-4 rounded-xl bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary-foreground/20">
                <ShoppingCart className="w-6 h-6 group-hover:text-primary-foreground text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg">New Sale</h4>
                <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80">Open Point of Sale</p>
              </div>
            </a>
            <a href="/products" className="flex items-center gap-4 p-4 rounded-xl bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary-foreground/20">
                <Package className="w-6 h-6 group-hover:text-primary-foreground text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Inventory</h4>
                <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80">Manage products</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="shadow-xl shadow-black/5 border border-border/50 rounded-2xl hover:shadow-2xl hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-foreground">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className="w-8 h-8" />
        </div>
      </CardContent>
    </Card>
  );
}
