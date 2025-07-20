"use server";

import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/lib/user/userServices";

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

