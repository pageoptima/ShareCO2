"use client";

import { configureAbly } from "@ably-labs/react-hooks";
import { ReactNode, useEffect } from "react";

export function AblyClientProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    configureAbly({
      authUrl: `${location.origin}/api/message/token`,
    });
  }, []);

  return <>{children}</>;
}
