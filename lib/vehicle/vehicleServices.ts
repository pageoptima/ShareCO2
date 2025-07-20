import { z } from "zod";
import { prisma } from "@/config/prisma";
import { VehicleType } from "@prisma/client";
import logger from "@/config/logger";

// Vehicle validation schema
const vehicleSchema = z.object({
  type: z.string().min(1, "Vehicle type is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  model: z.string().optional(),
});

/**
 * Add a new vehicle for the authenticated user
 */
export async function createVehicle({
  userId,
  vehicleNumber,
  type,
  model,
}: {
  userId: string;
  vehicleNumber: string;
  type: VehicleType;
  model: string;
}) {
  try {
    // Validate input
    vehicleSchema.parse({
      vehicleNumber,
      type,
      model,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    // Create vehicle
    await prisma.vehicle.create({
      data: {
        userId: user.id,
        type: type,
        vehicleNumber: vehicleNumber,
        model: model,
      },
    });

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    logger.error(`Error updating profile: ${error}`);
    throw error;
  }
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle({
  id,
  userId,
  type,
  vehicleNumber,
  model,
}: {
  id: string;
  userId: string;
  type: VehicleType;
  vehicleNumber: string;
  model: string;
}) {
  try {
    // Validate input
    vehicleSchema.parse({
      type,
      vehicleNumber,
      model,
    });

    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        user: {
          id: userId,
        },
      },
    });

    if (!existingVehicle) {
      throw new Error(
        "Vehicle not found or you do not have permission to update it"
      );
    }

    // Update vehicle
    await prisma.vehicle.update({
      where: { id },
      data: {
        type: type,
        vehicleNumber: vehicleNumber,
        model: model,
      },
    });

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    logger.error(`Error updating profile: ${error}`);
    throw error;
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        user: {
          id: userId,
        },
      },
    });

    if (!existingVehicle) {
      throw new Error(
        "Vehicle not found or you do not have permission to delete it"
      );
    }

    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    logger.error(`Error updating profile: ${error}`);
    throw error;
  }
}

/**
 * Get all vehicles for the user
 */
export async function getUserVehicles(userId: string) {
  try {
    // Get user's vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        user: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return vehicles;
  } catch (error) {
    logger.error(`Error fetching vehicles: ${error}`);
    throw error;
  }
}
