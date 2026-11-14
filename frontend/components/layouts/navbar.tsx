"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Moon, Sun, User, LogOut, Settings } from "lucide-react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "./sidebar";

export function Navbar() {
  const router = useRouter();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("posVerifiedSessionToken");
    sessionStorage.removeItem("posVerifiedSessionExpiry");
    sessionStorage.removeItem("subscriptionToken");
    router.replace("/");
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, orders..."
              className="border-0 bg-transparent placeholder:text-muted-foreground focus:ring-0 text-sm"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <InstallAppButton compact />

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-ceramic-primary rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <p className="font-medium text-sm">Low Stock Alert</p>
                <p className="text-xs text-muted-foreground">
                  Glossy Wall Tiles stock is running low
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <p className="font-medium text-sm">New Order</p>
                <p className="text-xs text-muted-foreground">
                  Order #ORD-001 has been completed
                </p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="h-8 w-8 rounded-full bg-ceramic-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">AH</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="border-t border-border p-3 md:hidden">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, orders..."
              className="border-0 bg-transparent placeholder:text-muted-foreground focus:ring-0 text-sm"
              autoFocus
            />
          </div>
        </div>
      )}
    </nav>
  );
}
