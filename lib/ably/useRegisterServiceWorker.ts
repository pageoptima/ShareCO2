"use client";
import { useEffect } from "react";

export function useRegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    } else {
      console.warn(
        "⚠️ Service Worker not registered. Ensure HTTPS or localhost and browser support."
      );
    }
  }, []);
}
