"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "./pwa-install-provider";

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const { isInstalled, promptInstall } = usePwaInstall();

  const handleInstall = async () => {
    try {
      const result = await promptInstall();
      if (result === "unavailable") {
        toast.info(
          "Install popup is unavailable in this browser. Use its menu to install the app or add it to your home screen."
        );
      } else if (result === "dismissed") {
        toast.info("Installation was dismissed. You can try again from your browser menu.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Unable to open the install prompt: ${error.message}`
          : "Unable to open the install prompt."
      );
    }
  };

  if (isInstalled) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      aria-label="Install Mwazanga Hardware POS"
      className="gap-2 px-2"
    >
      <Download className="h-4 w-4" />
      <span className={compact ? "hidden sm:inline" : ""}>Install App</span>
    </Button>
  );
}
