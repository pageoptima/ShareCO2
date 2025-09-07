import logger from "@/config/logger";
import * as Ably from "ably";

/**
 * Lazy-initialized Ably REST client.
 * This avoids running `new Ably.Rest(...)` at module load (which breaks `next build`)
 * because process.env is often not set during the build step.
 */
let ablyInstance: Ably.Rest | null = null;

export function getAbly(): Ably.Rest {

  if (ablyInstance) return ablyInstance;

  const key = process.env.ABLY_SERVER_API_KEY;
  if (!key) {
    // Throw here only when someone actually attempts to use Ably at runtime.
    // This will NOT run during `next build` as long as no module top-level code calls getAbly().
    throw new Error("ABLY_SERVER_API_KEY is not set. Cannot initialize Ably REST client.");
  }

  ablyInstance = new Ably.Rest({ key });
  return ablyInstance;
}

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

    const ably    = getAbly();
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
