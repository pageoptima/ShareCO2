import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideStatus } from "@prisma/client";
import { z } from "zod";

// Validate the inputs
const createRideSchema = z.object({
  startingLocationId   : z.string().min(1, "Starting point is required"),
  destinationLocationId: z.string().min(1, "Destination is required"),
  startingTime         : z.string().min(1, "Starting time is required"),
  maxPassengers        : z.number().int().min(1).max(3),
  vehicleId            : z.string().optional(),
});

// Create a new ride
export async function createRide(
  {
    userId,
    startingLocationId,
    destinationLocationId,
    startingTime,
    maxPassengers,
    vehicleId,
  } :
  {
    userId               : string,
    startingLocationId   : string,
    destinationLocationId: string,
    startingTime         : string,
    maxPassengers        : number,
    vehicleId            : string
  }
) {
  try {
    // Validate inputs before insert
    try {
      createRideSchema.parse({
        startingLocationId,
        destinationLocationId,
        startingTime,
        maxPassengers,
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
        driverId: userId,
        status: {
          in: [RideStatus.Pending, RideStatus.Active],
        },
      },
    });

    if (existingRide) {
      throw new Error( 'You have an active ride. Please complete it before creating a new one.' );
    }

    // Check if vehicle exists if vehicleId is provided
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id    : vehicleId,
        userId: userId,
      },
    });

    if ( ! vehicle ) {
      throw new Error( 'Selected vehicle not found' )
    }

    // Calculate carbon cost (distance-based cost)
    const carbonCost = parseFloat(process.env.NEXT_PUBLIC_CARBON_COST || '5');

    // Create the ride
    const ride = await prisma.ride.create({
      data: {
        driverId             : userId,
        startingLocationId   : startingLocationId,
        destinationLocationId: destinationLocationId,
        startingTime         : startingTime,
        maxPassengers        : maxPassengers,
        vehicleId            : vehicleId,
        carbonCost           : carbonCost,
        status               : RideStatus.Pending,
      },
    });

    return ride;

  } catch ( error: any ) {

    logger.error( `Error creating ride: ${error.stack}` );

    throw error;
  }
}