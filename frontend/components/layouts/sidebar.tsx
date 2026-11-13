 "use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Users,
  BarChart3,
  DollarSign,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  mobileOnly?: boolean;
}

export function Sidebar({ open = true, onClose, mobileOnly = false }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "POS",
      href: "/pos",
      icon: ShoppingCart,
    },
    {
      label: "Products",
      href: "/products",
      icon: Package,
    },
    {
      label: "Categories",
      href: "/categories",
      icon: Tags,
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: Boxes,
    },
    {
      label: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      label: "Reports",
      href: "/reports",
      icon: BarChart3,
    },
    {
      label: "Expenses",
      href: "/expenses",
      icon: DollarSign,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-all duration-300 ease-in-out md:translate-x-0",
        mobileOnly && "md:hidden",
        !open && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="border-b border-border p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ceramic-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">MH</span>
            </div>
            <span className="font-bold text-ceramic-primary">Mwazanga Hardware</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    active && "bg-ceramic-primary text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold">Branch: Main Store</p>
            <p>Last sync: Just now</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function SidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      <Sidebar open={open} onClose={() => setOpen(false)} mobileOnly />
    </>
  );
}
