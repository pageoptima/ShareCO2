// @lib/ably/useAblyPush.ts
import { useEffect } from "react";
import { ablyClient } from "./ablyPushClient";

export function useAblyPush() {
  useEffect(() => {
    // Check if ablyClient is properly initialized
    if (!ablyClient.push) {
      console.error(
        "Ably client is not properly initialized. Push notifications cannot be activated."
      );
      return;
    }

    const activatePush = async () => {
      try {
        await ablyClient.push.activate();
        console.log("Ably Push Activated ✅");
      } catch (err) {
        console.error("Push activation failed ❌", err);
      }
    };

    activatePush();
  }, []);
}
