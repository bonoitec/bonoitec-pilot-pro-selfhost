import {
  LayoutDashboard, Wrench, Users, Smartphone, Package,
  FileText, Receipt, UserCog, BarChart3, Bot, Settings,
  Zap, BookOpen, QrCode, Cpu, ShoppingBag, Bell, Cog,
  MessageSquare, BadgeDollarSign,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Réparations", url: "/repairs", icon: Wrench },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Devis", url: "/quotes", icon: FileText },
  { title: "Factures", url: "/invoices", icon: Receipt },
  { title: "Techniciens", url: "/technicians", icon: UserCog },
  { title: "Ventes", url: "/sales", icon: BadgeDollarSign },
];

const shopItems = [
  { title: "Services", url: "/services", icon: Cog },
  { title: "Appareils", url: "/devices", icon: Smartphone },
  { title: "Catalogue", url: "/device-catalog", icon: BookOpen },
  { title: "Pièces détachées", url: "/stock", icon: Package },
  { title: "Articles", url: "/articles", icon: ShoppingBag },
  { title: "Alertes stock", url: "/stock-alerts", icon: Bell },
];

const toolsItems = [
  { title: "Bibliothèque", url: "/repair-library", icon: BookOpen },
  
  { title: "Scanner IMEI", url: "/imei-scanner", icon: Cpu },
  { title: "Assistant IA", url: "/ai-assistant", icon: Bot },
  { title: "Statistiques", url: "/statistics", icon: BarChart3 },
  { title: "Rentabilité", url: "/profitability", icon: BarChart3 },
];

const bottomItems = [
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const renderMenu = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
            <NavLink
              to={item.url}
              end={item.url === "/"}
              className="transition-all duration-200 rounded-xl"
              activeClassName="bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium border border-sidebar-primary/20"
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Zap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight font-display">
                BonoitecPilot
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-none">
                Le cockpit intelligent
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            {renderMenu(mainItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/30 text-[10px] uppercase tracking-wider font-semibold">Atelier</SidebarGroupLabel>}
          <SidebarGroupContent>
            {renderMenu(shopItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/30 text-[10px] uppercase tracking-wider font-semibold">Outils IA</SidebarGroupLabel>}
          <SidebarGroupContent>
            {renderMenu(toolsItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        {renderMenu(bottomItems)}
      </SidebarFooter>
    </Sidebar>
  );
}
