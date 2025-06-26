"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Accept disclaimer for the current user
 */
export async function acceptDisclaimer() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "Not authenticated", success: false };
  }
  
  try {
    // Update user's disclaimer acceptance status
    await prisma.user.update({
      where: { email: session.user.email },
      data: { disclaimerAccepted: true },
    });
    
    // Revalidate paths that might use disclaimer status
    revalidatePath("/dashboard");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error accepting disclaimer:", error);
    return { error: "Failed to accept disclaimer", success: false };
  }
} 