// @lib/ably/ablyPushClient.ts
"use client";
import Ably from "ably";
import Push from "ably/push";

// Define ablyClient with proper typing
let ablyClient: Ably.Realtime;

// Initialize ablyClient lazily
if (typeof window !== "undefined") {
  ablyClient = new Ably.Realtime({
    authUrl: "/api/message/token",
    pushServiceWorkerUrl: "/service-worker.js",
    plugins: { Push },
  });
} else {
  // Fallback for non-browser environments (e.g., SSR)
  ablyClient = {} as Ably.Realtime; // Dummy object to satisfy TypeScript
}

// Export the ablyClient
export { ablyClient };
