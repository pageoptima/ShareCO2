"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RideStatus } from "@prisma/client";

export async function bookRide(rideId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "User not authenticated"
      };
    }

    const userId = session.user.id; // Extract userId for type safety

    // Check if the ride exists and is available
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { bookings: true },
    });

    if (!ride) {
      return {
        success: false,
        message: "Ride not found"
      };
    }

    const now = new Date();
    if ( ride.status !== RideStatus.Pending || ride.startingTime <= now) {
      return {
        success: false,
        message: "Ride is not available for booking"
      };
    }

    // Check confirmed bookings for seat availability (first-come-first-serve)
    const confirmedBookings = ride.bookings.filter(booking => booking.status === "Confirmed").length;
    if (confirmedBookings >= ride.maxPassengers) {
      return {
        success: false,
        message: "Ride has reached maximum passenger capacity"
      };
    }

    // Check if the user has already booked this ride
    const existingBooking = await prisma.rideBooking.findUnique({
      where: { rideId_userId: { rideId, userId } },
    });

    if (existingBooking) {
      return {
        success: false,
        message: "You have already booked this ride"
      };
    }

    // Check if the user has an active ride - can only book a new ride if previous rides are completed
    const activeBookings = await prisma.rideBooking.findMany({
      where: { 
        userId,
        status: {
          in: ["Confirmed", "Pending"]
        },
        ride: {
          status: "Active"
        }
      },
    });

    if (activeBookings.length > 0) {
      return {
        success: false,
        message: "You have an active ride. Please complete it before booking a new one."
      };
    }

    // Note: Carbon points will be deducted only when the ride is completed, not at booking time

    // Create a new booking in a transaction (no carbon points deduction at booking time)
    await prisma.$transaction(async (tx) => {
      // Double-check seat availability within transaction to prevent race conditions
      const currentRide = await tx.ride.findUnique({
        where: { id: rideId },
        include: { 
          bookings: {
            where: { status: "Confirmed" }
          }
        },
      });

      if (!currentRide) {
        throw new Error("Ride not found");
      }

      if (currentRide.bookings.length >= currentRide.maxPassengers) {
        throw new Error("Ride has reached maximum passenger capacity");
      }

      // Create the booking with automatic confirmation (first-come-first-serve)
      await tx.rideBooking.create({
        data: {
          rideId,
          userId,
          status: "Confirmed", // Automatically confirm if seats are available
        },
      });
    });

    return { success: true, message: "Ride booked and confirmed successfully" };
  } catch (error) {
    console.error("Error booking ride:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again."
    };
  }
}