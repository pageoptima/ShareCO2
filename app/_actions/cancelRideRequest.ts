"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function cancelRideRequest(requestId: string) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in to cancel a ride request"
      };
    }

    const userId = session.user.id;

    // Find the ride request
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: requestId },
    });

    if (!rideRequest) {
      return {
        success: false,
        message: "Ride request not found"
      };
    }

    // Check if the user is the owner of the ride request
    if (rideRequest.userId !== userId) {
      return {
        success: false,
        message: "You can only cancel your own ride requests"
      };
    }

    // Check if the ride request is already cancelled or matched
    if (rideRequest.status !== "Pending") {
      return {
        success: false,
        message: "Cannot cancel a ride request that is not pending"
      };
    }

    // Update the ride request status to Canceled
    await prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: "Canceled" },
    });

    // Revalidate pages
    revalidatePath("/book-ride");

    return {
      success: true,
      message: "Ride request cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling ride request:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again."
    };
  }
} 