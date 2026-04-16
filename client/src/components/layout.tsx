import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Package, ShoppingCart, History } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Ingreso de Ventas", url: "/pos", icon: ShoppingCart },
  { title: "Productos", url: "/products", icon: Package },
  { title: "Ventas Históricas", url: "/sales", icon: History },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-xl shadow-black/5 z-50">
      <SidebarContent>
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Package className="w-6 h-6" />
            </div>
            NexusPOS
          </h2>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-2 mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title} className="px-2">
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20" 
                            : "hover:bg-secondary text-sidebar-foreground hover:text-primary"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 h-full min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card/50 backdrop-blur-md px-6 shadow-sm z-10">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-lg transition-colors" />
            <div className="flex-1" />
            {/* Top right user/settings items could go here */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                AD
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
