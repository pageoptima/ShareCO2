"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function manageBooking(bookingId: string, action: "confirm" | "deny") {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error( "Booking not found" );
  }

  if (booking.ride.driverId !== session.user.id) {
    throw new Error("You are not authorized to manage this booking");
  }

  const newStatus = action === "confirm" ? "Confirmed" : "Denied";

  await prisma.rideBooking.update({
    where: { id: bookingId },
    data: { status: newStatus },
  });

  return { success: true, message: `Booking ${action}ed successfully` };
}