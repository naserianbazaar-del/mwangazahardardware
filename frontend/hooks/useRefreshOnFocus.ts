"use client";

import { useEffect, useState } from "react";

export function useRefreshOnFocus(): number {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let lastRefresh = 0;
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh < 1000) return;
      lastRefresh = now;
      setRefreshKey((current) => current + 1);
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return refreshKey;
}
