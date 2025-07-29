"use client";

import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import Push from "ably/push";
import { ReactNode } from "react";
import { AblyPushRegistrar } from "./AblyPushRegistrar";

export function AblyClientProvider({ children }: { children: ReactNode }) {

  // Only build the client in the browser
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  const ablyClient = new Ably.Realtime({
    authUrl             : `${location.origin}/api/message/token`,
    pushServiceWorkerUrl: "/service-worker.js",
    plugins             : { Push }
  });

  return (
    <AblyProvider client={ablyClient}>
      <AblyPushRegistrar/>
      {children}
    </AblyProvider>
  );
}
