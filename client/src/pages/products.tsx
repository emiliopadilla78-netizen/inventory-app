import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useProducts, useDeleteProduct } from "@/hooks/use-products";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@shared/routes";
import { z } from "zod";

type Product = z.infer<(typeof api.products.list.responses)[200]>[number];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);


const handleImport = async () => {
  try {
    const response = await fetch("/api/sales/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  rows: [
  {
    sku: "MRP-001",
    quantity: 1,
    unitPrice: 100,
  },
],
}),
    });

    const data = await response.json();
    console.log("IMPORT RESULT:", data);
  } catch (error) {
    console.error("IMPORT ERROR:", error);
  }
};

useEffect(() => {
  fetch("/api/products")
    .then((res) => res.json())
    .then((data) => {
      setProducts(Array.isArray(data) ? data : []);
      setIsLoading(false);
    });
}, []);
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredProducts = (products ?? []).filter((p: any) => {
    const name = (p.name ?? "").toLowerCase();
    const sku = (p.sku ?? "").toLowerCase();
    const category = (p.category ?? "").toLowerCase();
    const term = (search || "").toLowerCase().trim();

    if (!term) return true;

    return name.includes(term) || sku.includes(term) || category.includes(term);
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Gestiona tus productos y niveles de existencias.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          size="lg"
          className="rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agrega Producto
        </Button>
      </div>

      <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Busca productos, SKU, o categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-background border-border/50 h-11"
            />
          </div>
        </div>

        <div className="p-0">

  <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-[300px]">Producto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right pr-6">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-6 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProducts?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 mb-4 text-muted" />
                      <p className="text-lg font-medium text-foreground">
                        No products found
                      </p>
                      <p>Try adjusting your search or add a new product.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts?.map((product) => {
                  console.log(product);

                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="pl-6">
                        <div className="font-semibold text-foreground">
                          {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {product.sku}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-secondary/50 hover:bg-secondary/80 text-secondary-foreground rounded-lg"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.variant || "-"}</TableCell>
                      <TableCell className="font-medium">
                        ${Number(product.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {product.quantity <= 5 ? (
                          <Badge
                            variant="destructive"
                            className="bg-destructive/10 text-destructive border-none shadow-none"
                          >
                            {product.quantity} Left
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-success/10 text-success border-none shadow-none font-semibold"
                          >
                            {product.quantity} In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-600"
                            onClick={async () => {
                              const input = prompt("Add stock quantity");

                              if (!input) {
                                return;
                              }

                              const quantity = parseInt(input);

                              if (isNaN(quantity) || quantity <= 0) {
                                alert("Invalid quantity");
                                return;
                              }

                              await fetch(
                                "/api/products/" + product.id + "/add-stock",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ quantity: quantity }),
                                },
                              );

                              window.location.reload();
                            }}
                          >
                            +
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={async () => {
                              const input = prompt("Sell quantity");

                              if (!input) {
                                return;
                              }

                              const quantity = parseInt(input);

                              if (isNaN(quantity) || quantity <= 0) {
                                alert("Invalid quantity");
                                return;
                              }

                              await fetch("/api/products/" + product.id, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  quantity: product.quantity - quantity,
                                }),
                              });

                              window.location.reload();
                            }}
                          >
                            -
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-destructive flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this product? This action cannot
              be undone and will remove it from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 shadow-lg shadow-destructive/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
