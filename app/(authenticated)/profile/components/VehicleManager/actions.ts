"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { createVehicle as createVehicleDb } from "@/lib/vehicle/vehicleServices";
import { updateVehicle as updateVehicleDb } from "@/lib/vehicle/vehicleServices";
import { deleteVehicle as deleteVehicleDb } from "@/lib/vehicle/vehicleServices";
import { getUserVehicles as getUserVehiclesDb } from "@/lib/vehicle/vehicleServices";

import { PublicVehicle, PublicVehicleArgs } from "./types";

/**
 * Add a new vehicle for the authenticated user
 */
export async function addVehicle(data: PublicVehicleArgs) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be signed in to add a vehicle");
    }

    await createVehicleDb({
      userId: session.user.id,
      vehicleNumber: data.vehicleNumber,
      type: data.type,
      model: data.model as string,
    });

    revalidatePath("/profile");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
/**
 * Update an existing vehicle
 */
export async function updateVehicle(id: string, data: PublicVehicleArgs) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be signed in to update a vehicle");
    }

    const success = await updateVehicleDb({
      id,
      userId: session.user.id,
      vehicleNumber: data.vehicleNumber,
      type: data.type,
      model: data.model as string,
    });

    revalidatePath("/profile");

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to delete a vehicle" };
    }

    // Check if vehicle exists and belongs to user
    const success = await deleteVehicleDb({
      id,
      userId: session.user.id,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get all vehicles for the authenticated user
 */
export async function getUserVehicles(): Promise<PublicVehicle[]> {
  // Get authenticated user
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to view your vehicles");
  }

  // Get user's vehicles
  const vehicles = await getUserVehiclesDb(session.user.id);

  return vehicles as PublicVehicle[];
}
