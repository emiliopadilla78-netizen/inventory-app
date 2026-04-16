import Login from "./pages/Login";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";

// Pages
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import PointOfSale from "./pages/pos";
import SalesHistory from "./pages/sales";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard}/>
            <Route path="/products" component={Products}/>
            <Route path="/pos" component={PointOfSale}/>
            <Route path="/sales" component={SalesHistory}/>
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}
function App() {
const user = localStorage.getItem("user");
const currentPath = window.location.pathname;

if (!user && currentPath !== "/login") {
  window.location.href = "/login";
  return null;
}
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
