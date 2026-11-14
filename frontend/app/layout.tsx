import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layouts/app-shell";
import { PwaInstallProvider } from "@/components/pwa/pwa-install-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mwazanga Hardware",
  description: "Mwazanga Hardware Point of Sale System",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mwazanga POS",
  },
};

export const viewport: Viewport = {
  themeColor: "#C46A32",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <PwaInstallProvider>
          <AppShell>{children}</AppShell>
          <RegisterServiceWorker />
          <Toaster />
        </PwaInstallProvider>
      </body>
    </html>
  );
}
