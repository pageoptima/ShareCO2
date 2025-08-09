"use client";

import { AblyProvider } from "ably/react";
import { ReactNode } from "react";
import AblyPushRegistrar from "./AblyPushRegistrar";
import { getAblyClient } from "@/services/ablyClient";

export function AblyClientProvider({ children }: { children: ReactNode }) {
  
  // Only build the client in the browser
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  // Get the ably client
  const ablyClient = getAblyClient();

  return (
    <AblyProvider client={ablyClient}>
      { Notification && <AblyPushRegistrar /> }
      {children}
    </AblyProvider>
  );
}
