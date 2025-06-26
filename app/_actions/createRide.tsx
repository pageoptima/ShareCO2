"use server";

import { prisma } from "@/lib/prisma";
import { auth } from '@/lib/auth';
import { Ride } from "@prisma/client";

export async function createRide(
  startingPoint: string,
  destination: string,
  startingTime: string, // Now expects a time string (e.g., "14:30")
  maxPassengers: number = 3 // Add maxPassengers parameter with default value
) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("User not authenticated");
  }

  // Validate that one of the points is "office"
  if (startingPoint.toLowerCase() !== "office" && destination.toLowerCase() !== "office") {
    throw new Error("One of the points must be the office.");
  }

  // Validate that starting point and destination are not the same
  if (startingPoint === destination) {
    throw new Error("Starting point and destination cannot be the same.");
  }

  // Validate maxPassengers
  if (maxPassengers < 1 || maxPassengers > 3) {
    throw new Error("Number of passengers must be between 1 and 3.");
  }

  // Construct the full datetime using today's date and the selected time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [hours, minutes] = startingTime.split(":");
  const selectedDateTime = new Date(today);
  selectedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  // New validation logic considering date changes
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const endOfTomorrow = new Date(today);
  endOfTomorrow.setDate(today.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59);

  if (selectedDateTime < oneHourFromNow) {
    throw new Error("Ride time must be at least 1 hour after the current time.");
  }
  if (selectedDateTime > endOfTomorrow) {
    throw new Error("Rides can only be created for today or tomorrow.");  
  }
  // Create the ride
  const ride = await prisma.ride.create({
    data: {
      driverId: session.user.id as string,
      startingTime: selectedDateTime,
      startingPoint,
      destination,
      status: "Pending",
      carbonCost: 0, // To be calculated later based on distance
      maxPassengers, // Add maxPassengers to the data
    },
  });

  return ride as Ride;
}