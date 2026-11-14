import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mwazanga Hardware",
  description: "Mwazanga Hardware Point of Sale System",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' font-weight='bold' fill='%23C46A32'>T</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
