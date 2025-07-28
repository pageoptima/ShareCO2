// @lib/ably/useAblyChannel.ts
import { useEffect } from "react";
import { ablyClient } from "./ablyPushClient";
import Ably from "ably";

// Define the structure of the message data
interface NotificationData {
  notification: {
    title: string;
    body: string;
    icon: string;
  };
  data: {
    url: string;
  };
}

interface AblyChannelOptions {
  role: string; // e.g., 'driver', 'rider'
  userId: string; // Unique user ID
  eventType?: string; // e.g., 'booking', 'rideUpdate' (optional, defaults to 'booking')
  onMessage?: (message: NotificationData) => void; // Callback for handling messages
}

export function useAblyChannel({
  role,
  userId,
  eventType = "booking",
  onMessage,
}: AblyChannelOptions) {
  useEffect(() => {
    // Check if ablyClient is properly initialized
    if (!ablyClient.channels) {
      console.error(
        "Ably client is not properly initialized. Ensure this is running in a browser environment."
      );
      return () => {}; // Return empty cleanup function if not initialized
    }

    const channelName = `${role}:${userId}`;
    const channel = ablyClient.channels.get(
      channelName
    ) as Ably.RealtimeChannel & {
      push: {
        subscribe: () => Promise<void>;
        unsubscribe: () => Promise<void>;
      };
    };

    // Subscribe to the specified event type
    const handleMessage = (message: Ably.Message) => {
      console.log(
        `Received ${eventType} event on ${channelName}:`,
        message.data
      );
      if (onMessage && message.data) {
        onMessage(message.data as NotificationData); // Cast to NotificationData
      }
    };

    channel.subscribe(eventType, handleMessage);

    // Activate push notifications for the channel
    const activatePush = async () => {
      try {
        await ablyClient.push.activate();
        console.log("Ably Push Activated ✅");

        // Subscribe the device to push notifications for this channel
        await channel.push.subscribe();
        console.log(`Subscribed to push notifications for ${channelName}`);
      } catch (err) {
        console.error("Push activation or subscription failed ❌", err);
      }
    };

    activatePush();

    // Cleanup on unmount
    return () => {
      channel.push.unsubscribe();
      channel.unsubscribe(eventType, handleMessage);
      console.log(`Unsubscribed from ${channelName} for event ${eventType}`);
    };
  }, [role, userId, eventType, onMessage]); // Dependencies ensure resubscription if params change
}
