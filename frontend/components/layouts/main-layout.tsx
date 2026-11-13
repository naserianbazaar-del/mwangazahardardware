"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { useStore } from "@/store";
import { apiRootUrl } from "@/lib/api";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [accessState, setAccessState] = useState<"checking" | "allowed" | "error">(
    "checking"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("best-price-hardware-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("best-price-hardware-theme");
    if (savedTheme === "dark" && !isDarkMode) {
      useStore.setState({ isDarkMode: true });
    }
  }, [isDarkMode]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/");
      return () => {
        cancelled = true;
      };
    }

    fetch(apiRootUrl("/auth/session"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (cancelled) return;
        if (response.status === 401 || response.status === 402) {
          if (response.status === 402) {
            sessionStorage.setItem("subscriptionToken", token);
          }
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          router.replace(response.status === 402 ? "/subscribe" : "/");
          return;
        }
        if (!response.ok) {
          setAccessState("error");
          return;
        }
        setAccessState("allowed");
      })
      .catch(() => {
        if (!cancelled) setAccessState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (accessState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking subscription...
      </div>
    );
  }

  if (accessState === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">Unable to verify your subscription.</p>
        <button
          className="text-ceramic-primary underline"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={false} />
      <div className="flex flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
