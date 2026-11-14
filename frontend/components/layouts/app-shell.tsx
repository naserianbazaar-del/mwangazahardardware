"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainLayout } from "./main-layout";

const publicPaths = new Set(["/", "/forgot-password", "/subscribe"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!pathname || publicPaths.has(pathname)) {
    return children;
  }

  return <MainLayout>{children}</MainLayout>;
}
