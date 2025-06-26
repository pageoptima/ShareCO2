"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function cancelBooking(bookingId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "User not authenticated"
      };
    }

    const userId = session.user.id;

    // Find the booking and verify it belongs to the user
    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) {
      return {
        success: false,
        message: "Booking not found"
      };
    }

    if (booking.userId !== userId) {
      return {
        success: false,
        message: "You can only cancel your own bookings"
      };
    }

    // Check if the ride has already started or completed
    const now = new Date();
    if (booking.ride.startingTime <= now) {
      return {
        success: false,
        message: "Cannot cancel booking for a ride that has already started"
      };
    }

    // Delete the booking
    await prisma.rideBooking.delete({
      where: { id: bookingId },
    });

    return { success: true, message: "Booking cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again."
    };
  }
} 