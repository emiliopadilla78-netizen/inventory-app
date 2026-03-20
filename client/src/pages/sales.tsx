import { useSales } from "@/hooks/use-sales";
import { format } from "date-fns";
import { History, Receipt, ArrowUpRight } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data: sales, isLoading, refetch } = useSales();
  console.log("SALES DATA:", sales);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Sales History
        </h1>
        <button
          style={{
            marginTop: "12px",
            padding: "8px 16px",
            background: "#2563eb",
            color: "white",
            borderRadius: "6px",
          }}
          onClick={async () => {
            const productId = prompt("Product ID");
            if (!productId) return;

            const quantity = prompt("Quantity");
            if (!quantity) return;

            await fetch("/api/sales", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentMethod: "cash",
                totalAmount: "0.00",
                items: [
                  {
                    productId: Number(productId),
                    quantity: Number(quantity),
                    unitPrice: "0.00",
                    subtotal: "0.00",
                  },
                ],
              }),
            });

            await refetch();
          }}
        >
          New Sale
        </button>
        <p className="text-muted-foreground text-lg">
          View past transactions and receipts.
        </p>
      </div>

      <Card className="shadow-xl shadow-black/5 border border-border/50 rounded-2xl overflow-hidden bg-card">
        <CardHeader className="bg-muted/20 border-b border-border/50 px-6 py-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            All Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right pr-6">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sales?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="w-12 h-12 mb-4 text-muted" />
                      <p className="text-lg font-medium text-foreground">
                        No sales recorded yet
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sales?.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <TableCell className="pl-6 font-medium">
                      #{sale.id.toString().padStart(6, "0")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(sale.date), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="capitalize bg-secondary/50 text-secondary-foreground"
                      >
                        {sale.paymentMethod.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-foreground flex justify-end items-center gap-2">
                      ${Number(sale.totalAmount).toFixed(2)}
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <DialogContent className="sm:max-w-[450px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
          {selectedSale && (
            <>
              <div className="bg-primary/5 p-6 border-b border-border/50 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-3">
                  <Receipt className="w-6 h-6" />
                </div>
                <DialogTitle className="text-2xl font-extrabold mb-1">
                  Receipt
                </DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {format(new Date(selectedSale.date), "MMMM d, yyyy h:mm a")}
                </p>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-border">
                  <div className="text-sm text-muted-foreground">
                    Transaction ID
                  </div>
                  <div className="font-mono font-medium">
                    #{selectedSale.id.toString().padStart(6, "0")}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedSale.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {item.product?.name || `Product #${item.productId}`}
                        </div>
                        <div className="text-muted-foreground">
                          {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="font-medium">
                        ${Number(item.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <div className="flex justify-between items-center text-muted-foreground text-sm">
                    <span>Payment Method</span>
                    <span className="capitalize">
                      {selectedSale.paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-extrabold text-xl text-foreground pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      ${Number(selectedSale.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
