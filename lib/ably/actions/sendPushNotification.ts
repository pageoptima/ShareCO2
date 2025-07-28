import ably from "@/services/ably";
import Ably from "ably";

// Define the structure of the message data (same as useAblyChannel.ts)
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

export async function sendPushToChannel(
  role: string,
  userId: string,
  notification: { title: string; body: string; url?: string },
  eventType: string = "booking"
) {
  try {
    if (!role || !userId || !notification?.title || !notification?.body) {
      throw new Error("Missing required fields to send push notification.");
    }

    const channel = ably.channels.get(`${role}:${userId}`) as Ably.Channel;

    await channel.publish(eventType, {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: "/images/shareco2-icon.png",
      },
      data: {
        url: notification.url ?? "/dashboard",
      },
    } as NotificationData);

    console.log(
      `✅ Push notification sent to channel: ${role}:${userId} for event ${eventType}`
    );
  } catch (error) {
    console.error("❌ Failed to send push notification:", error);
    throw error;
  }
}
