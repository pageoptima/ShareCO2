"use server";

import logger from "@/config/logger";
import { auth } from "@/lib/auth/auth";
import { getUserById, updateTokenDb } from "@/lib/user/userServices";

export async function getUserProfileStatus() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await getUserById(session.user.id);
    return { isProfileCompleted: user.isProfileCompleted };
  } catch (error) {
    console.error("Error fetching user profile status:", error);
    throw new Error("Failed to fetch user profile status");
  }
}

export async function updateFcmToken(fcmToken: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const userId = session.user.id;
    await updateTokenDb(userId, fcmToken);
    logger.info(`FCM token update initiated for user ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error(
      `Error initiating FCM token update for user ${session.user.id}: ${error}`
    );
    throw new Error("Failed to initiate FCM token update");
  }
}
