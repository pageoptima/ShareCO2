import logger from "@/config/logger";
import * as Ably from "ably";

// Initialize Ably REST client with your API key
const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY as string);

// Function to send push notification
export async function sendPushNotification({
  userId,
  title,
  body,
  eventName,
  redirectUrl,
}: {
  userId: string;
  eventName: string;
  title: string;
  body: string;
  redirectUrl: string;
}): Promise<boolean> {
  try {
    // Validate required parameters
    if (!userId || !eventName || !title || !body || !redirectUrl) {
      throw new Error(
        "userId, eventName, title, body, and redirectUrl are required"
      );
    }

    const channel = ably.channels.get(`user:${userId}`);

    await channel.publish({
      name: eventName,
      data: {},
      extras: {
        push: {
          notification: {
            title,
            body,
          },
          data: {
            userId,
            redirectUrl,
          },
        },
      },
    });
    return true;
  } catch (error) {
    logger.error("Error sending push notification:", error);
    throw error;
  }
}

export default ably;
