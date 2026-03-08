import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";
import { api } from "@shared/routes";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Minus, Plus, Trash2, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Product = z.infer<typeof api.products.list.responses[200]>[number];

type CartItem = {
  product: Product;
  quantity: number;
};

export default function PointOfSale() {
  const { data: products, isLoading } = useProducts();
  const createSale = useCreateSale();
  
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  
  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // check stock
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        if (newQ <= 0) return item;
        if (newQ > item.product.quantity) return item; // stock limit
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% dummy tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutOpen(true);
  };

  const confirmCheckout = () => {
    const payload = {
      totalAmount: totals.total.toFixed(2),
      paymentMethod,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: (Number(item.product.price) * item.quantity).toFixed(2),
      }))
    };

    createSale.mutate(payload, {
      onSuccess: () => {
        setCart([]);
        setCheckoutOpen(false);
      }
    });
  };

  return (
    <div className="flex h-full w-full bg-muted/10 overflow-hidden">
      {/* LEFT PANEL: PRODUCTS */}
      <div className="flex-1 flex flex-col h-full border-r border-border/50 bg-background/50">
        <div className="p-4 border-b border-border/50 bg-background z-10 flex items-center gap-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search products by name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-xl border-border bg-muted/30 focus-visible:ring-primary/20 text-lg shadow-inner"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
            {isLoading ? (
              Array.from({length: 8}).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
              ))
            ) : filteredProducts?.map(product => {
              const inCart = cart.find(c => c.product.id === product.id)?.quantity || 0;
              const isOutOfStock = product.quantity === 0;
              
              return (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer border border-border/50 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 ${
                    isOutOfStock 
                      ? 'opacity-60 cursor-not-allowed grayscale' 
                      : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/50'
                  } ${inCart > 0 ? 'ring-2 ring-primary/50 bg-primary/5' : 'bg-card'}`}
                  onClick={() => !isOutOfStock && addToCart(product)}
                >
                  <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur">
                          {product.sku}
                        </Badge>
                        {inCart > 0 && (
                          <Badge className="bg-primary shadow-sm">{inCart} in cart</Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{product.category}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-xl font-extrabold text-primary">${Number(product.price).toFixed(2)}</p>
                      <p className={`text-xs font-semibold ${isOutOfStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {product.quantity} left
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-[400px] flex flex-col bg-card shadow-2xl z-20 h-full">
        <div className="p-6 border-b border-border/50 bg-primary/5">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Current Order
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{cart.length} items selected</p>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground mt-20">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-lg">Cart is empty</p>
              <p className="text-sm">Select products to add them to the order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-3 bg-background p-3 rounded-xl border border-border/50 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate pr-2">{item.product.name}</h4>
                    <p className="text-primary font-bold text-sm mt-1">${Number(item.product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border/50">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-background rounded-md shadow-sm hover:text-primary">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center bg-background rounded-md shadow-sm hover:text-primary">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur-md">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span>
              <span className="font-medium">${totals.tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-foreground">
              <span className="text-xl font-bold">Total</span>
              <span className="text-3xl font-extrabold text-primary">${totals.total.toFixed(2)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/25 hover:-translate-y-1 transition-transform"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Checkout Order
          </Button>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="p-6 bg-primary text-primary-foreground text-center">
            <h2 className="text-3xl font-extrabold mb-2">${totals.total.toFixed(2)}</h2>
            <p className="text-primary-foreground/80 font-medium">Select Payment Method</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
                className={`h-24 flex flex-col gap-2 rounded-2xl border-2 ${paymentMethod === 'credit_card' ? 'border-primary ring-4 ring-primary/20' : 'border-border/50'}`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <CreditCard className={`w-8 h-8 ${paymentMethod === 'credit_card' ? '' : 'text-muted-foreground'}`} />
                <span>Credit Card</span>
              </Button>
              <Button 
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className={`h-24 flex flex-col gap-2 rounded-2xl border-2 ${paymentMethod === 'cash' ? 'border-primary ring-4 ring-primary/20' : 'border-border/50'}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className={`w-8 h-8 ${paymentMethod === 'cash' ? '' : 'text-muted-foreground'}`} />
                <span>Cash</span>
              </Button>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold rounded-xl flex gap-2 items-center justify-center shadow-lg shadow-primary/20" 
              onClick={confirmCheckout}
              disabled={createSale.isPending}
            >
              {createSale.isPending ? "Processing..." : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
