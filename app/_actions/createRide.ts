"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validate the inputs
const createRideSchema = z.object({
  startingPoint: z.string().min(1, "Starting point is required"),
  destination: z.string().min(1, "Destination is required"),
  startingTime: z.string().min(1, "Starting time is required"),
  maxPassengers: z.number().int().min(1).max(3),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  vehicleId: z.string().optional(),
});

export async function createRide(
  startingPoint: string,
  destination: string,
  startingTime: string,
  maxPassengers: number,
  vehicleType: string,
  vehicleId?: string
) {
  try {
    // Get the session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to create a ride"
      };
    }
    
    // Validate inputs
    try {
      createRideSchema.parse({
        startingPoint,
        destination,
        startingTime,
        maxPassengers,
        vehicleType,
        vehicleId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: error.errors[0].message
        };
      }
      throw error;
    }

    // Check if user has an active ride
    const existingRide = await prisma.ride.findFirst({
      where: {
        driverId: session.user.id,
        status: {
          in: ["Pending", "Active"],
        },
      },
    });

    if (existingRide) {
      return {
        success: false,
        message: "You have an active ride. Please complete it before creating a new one."
      };
    }

    // Check if vehicle exists if vehicleId is provided
    if (vehicleId && vehicleId !== "other") {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: session.user.id,
        },
      });

      if (!vehicle) {
        return {
          success: false,
          message: "Selected vehicle not found"
        };
      }

      // Ensure vehicle type matches the provided one
      if (vehicle.type !== vehicleType) {
        return {
          success: false,
          message: "Vehicle type mismatch"
        };
      }
    }

    // Calculate carbon cost (distance-based cost)
    const carbonCost = 5; // Default carbon cost

    // Parse the time and create a datetime for the ride
    const [hours, minutes] = startingTime.split(':').map(Number);
    
    // Set the date to today
    const rideDate = new Date();
    rideDate.setHours(hours, minutes, 0, 0);
    
    // If time is in the past for today, set it to tomorrow
    if (rideDate < new Date()) {
      rideDate.setDate(rideDate.getDate() + 1);
    }

    // Create the ride
    const ride = await prisma.ride.create({
      data: {
        driverId: session.user.id,
        startingPoint,
        destination,
        startingTime: rideDate,
        maxPassengers,
        vehicleType,
        vehicleId: vehicleId !== "other" ? vehicleId : undefined,
        carbonCost,
        status: "Pending",
      },
    });

    // Check if there's a matching ride request
    const matchingRequests = await prisma.rideRequest.findMany({
      where: {
        startingPoint,
        destination,
        status: "Pending",
        startingTime: {
          // Find requests within 30 minutes of the ride time
          gte: new Date(rideDate.getTime() - 30 * 60000),
          lte: new Date(rideDate.getTime() + 30 * 60000),
        },
      },
    });

    // Update matching requests to Matched status
    if (matchingRequests.length > 0) {
      await prisma.rideRequest.updateMany({
        where: {
          id: {
            in: matchingRequests.map(req => req.id),
          },
        },
        data: {
          status: "Matched",
        },
      });
    }

    return {
      success: true,
      message: "Ride created successfully",
      data: ride
    };
  } catch (error) {
    console.error("Error creating ride:", error);
    return {
      success: false,
      message: "Failed to create ride. Please try again."
    };
  }
} 