import { Wallet, Shield, CheckCircle, Settings, Home, Network } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Identity Wallet",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "Credentials",
    url: "/credentials",
    icon: Shield,
  },
  {
    title: "Verification",
    url: "/verify",
    icon: CheckCircle,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
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

      <SidebarFooter>
        <div className="px-4 py-3 space-y-2" data-testid="sidebar-footer-network">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Network Status
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-online animate-pulse" data-testid="indicator-network-status" />
            <span className="text-sm font-medium" data-testid="text-network-name">Ethereum Mainnet</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono" data-testid="text-block-height">
            Block: 18,432,156
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
