"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RideStatus } from "@prisma/client";

export async function cancelRide(rideId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "User not authenticated"
      };
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride || ride.driverId !== session.user.id) {
      return {
        success: false,
        message: "Ride not found or you are not the driver."
      };
    }

    await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.Cancelled },
    });

    return { success: true, message: "Ride cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling ride:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again."
    };
  }
}