"use client";

import { useEffect } from "react";
import { processSyncQueue } from "@/lib/offline-sync";

export function SyncProvider() {
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is back online. Processing sync queue...");
      processSyncQueue();
    };

    // Check on mount as well, just in case
    if (typeof window !== "undefined" && navigator.onLine) {
      processSyncQueue();
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
