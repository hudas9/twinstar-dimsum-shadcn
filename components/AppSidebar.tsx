"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Receipt,
  ChartLine,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import SignOutButton from "./SignOutButton";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart },
  { title: "Products", url: "/products", icon: Package },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Members", url: "/members", icon: Users },
  { title: "Expenses", url: "/expenses", icon: Wallet },
  { title: "Incomes", url: "/incomes", icon: Receipt },
  { title: "Reports", url: "/reports", icon: ChartLine },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        {/* MENU UTAMA */}
        <SidebarGroup>
          <SidebarGroupLabel>TwinStar POS</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.url}>
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

        {/* SIGN OUT BUTTON */}
        <div className="mt-auto p-4">
          <SignOutButton />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
