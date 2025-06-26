"use server";

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Vehicle validation schema
const vehicleSchema = z.object({
  type: z.string().min(1, "Vehicle type is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  model: z.string().optional(),
});

type VehicleData = z.infer<typeof vehicleSchema>;

/**
 * Add a new vehicle for the authenticated user
 */
export async function addVehicle(data: VehicleData) {
  try {
    // Validate input
    const validatedData = vehicleSchema.parse(data);
    
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "You must be signed in to add a vehicle" };
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return { error: "User not found" };
    }
    
    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        vehicleNumber: validatedData.vehicleNumber,
        model: validatedData.model,
      },
    });
    
    revalidatePath('/profile');
    return { success: true, vehicle };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to add vehicle" };
  }
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(id: string, data: VehicleData) {
  try {
    // Validate input
    const validatedData = vehicleSchema.parse(data);
    
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "You must be signed in to update a vehicle" };
    }
    
    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
    });
    
    if (!existingVehicle) {
      return { error: "Vehicle not found or you do not have permission to update it" };
    }
    
    // Update vehicle
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        type: validatedData.type,
        vehicleNumber: validatedData.vehicleNumber,
        model: validatedData.model,
      },
    });
    
    revalidatePath('/profile');
    return { success: true, vehicle };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update vehicle" };
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "You must be signed in to delete a vehicle" };
    }
    
    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
    });
    
    if (!existingVehicle) {
      return { error: "Vehicle not found or you do not have permission to delete it" };
    }
    
    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id },
    });
    
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error? error.message: "Failed to delete vehicle" };
  }
}

/**
 * Get all vehicles for the authenticated user
 */
export async function getUserVehicles() {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "You must be signed in to view your vehicles" };
    }
    
    // Get user's vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return { success: true, vehicles };
  } catch (error) {
    return { error: error instanceof Error? error.message: "Failed to fetch vehicles" };
  }
} 