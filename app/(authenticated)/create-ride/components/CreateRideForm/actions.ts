"use server";

import { auth } from "@/lib/auth/auth";
import { createRide as createRideDb } from "@/lib/ride/createRide";
import { getUserVehicles as getUserVehiclesDb } from '@/lib/vehicle/retriveVehicle';
import { getLocations as getLocationDb } from '@/lib/location/getLocations';
import { PublicLocation, PublicRide, PublicVehicle } from "./types";

/**
 * Create a new ride
 */
export const createRide = async (
    startingLocationId: string,
    destinationLocationId: string,
    startingTime: string,
    maxPassengers: number,
    vehicleId: string
) => {

    // Get the session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
        throw new Error( 'You must be logged in to create a ride' )
    }

    return await createRideDb({
        userId: session.user.id,
        startingLocationId,
        destinationLocationId,
        startingTime,
        maxPassengers,
        vehicleId,
    }) as PublicRide;
};

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
 * Get the avialable location
 * @returns 
 */
export const getLocations = async (): Promise<PublicLocation[]> => {
    try {
        return await getLocationDb();
    } catch (error) {
        throw new Error('Failed to fetch locations');
    }
};