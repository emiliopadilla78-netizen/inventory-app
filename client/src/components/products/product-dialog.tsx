import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { api } from "@shared/routes";

type ProductResponse = z.infer<typeof api.products.list.responses[200]>[number];

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      description: "",
      price: 0,
      quantity: 0,
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        description: product.description || "",
        price: Number(product.price),
        quantity: product.quantity,
      });
    } else if (!open) {
      form.reset({
        name: "",
        sku: "",
        category: "",
        description: "",
        price: 0,
        quantity: 0,
      });
    }
  }, [product, open, form]);

  const onSubmit = async (values: ProductFormValues) => {
    const payload = {
      ...values,
      price: values.price.toString(),
      description: values.description || null,
    };

    if (product) {
      updateProduct.mutate({ id: product.id, ...payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl border-none shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl">{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {product ? "Update the details of your product below." : "Enter the details for the new product here."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wireless Mouse" className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WM-001" className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electronics" className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" className="rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Product details..." 
                      className="resize-none rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-background transition-all" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20" disabled={isPending}>
                {isPending ? "Saving..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
