"use server";

import { auth } from "@/lib/auth/auth";
import { createRide as createRideDb } from "@/lib/ride/rideServices";
import { getUserVehicles as getUserVehiclesDb } from '@/lib/vehicle/vehicleServices';
import { getLocations as getLocationDb } from '@/lib/location/locationServices';
import { PublicLocation, PublicVehicle } from "./types";

/**
 * Create a new ride
 */
export async function createRide(
  startingLocationId: string,
  destinationLocationId: string,
  startingTime: string,
  maxPassengers: number,
  vehicleId: string
) {
  try {
    // Get the session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw new Error("You must be logged in to create a ride");
    }

    const success = await createRideDb({
      userId: session.user.id,
      startingLocationId,
      destinationLocationId,
      startingTime,
      maxPassengers,
      vehicleId,
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
    throw new Error('You must be signed in to view your vehicles');
  }

  // Get user's vehicles
  const vehicles = await getUserVehiclesDb(session.user.id);

  return vehicles as PublicVehicle[];
}

/**
 * Get the available locations
 * @returns 
 */
export const getLocations = async (): Promise<PublicLocation[]> => {
  try {
    return await getLocationDb();

  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch locations');
  }
};