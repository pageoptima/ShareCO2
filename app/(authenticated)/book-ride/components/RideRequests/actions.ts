"use server";

import { auth } from "@/lib/auth/auth";
import { getLocations as getLocationDb } from '@/lib/location/locationServices';
import { createRideRequest as createRideRequestDb } from "@/lib/rideRequest/rideRequestServices";
import { cancelRideRequest as cancelRideRequestDb } from "@/lib/rideRequest/rideRequestServices";
import { getUserRideRequests as getUserRideRequestsDb } from "@/lib/rideRequest/rideRequestServices";
import { PublicLocation, PublicRideRequest } from "./types";


/**
 * Get the avialable location
 */
export const getLocations = async (): Promise<PublicLocation[]> => {
    try {
        return await getLocationDb();
    } catch (error: unknown ) {
        console.error( error );
        throw new Error('Failed to fetch locations');
    }
};

/**
 * Create a new ride request for a user
 */
export async function createRideRequest({
  startingLocationId,
  destinationLocationId,
  startingTime,
}: {
  startingLocationId: string;
  destinationLocationId: string;
  startingTime: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be signed in to request a ride");
    }

    const success = await createRideRequestDb({
      userId: session.user.id,
      startingLocationId,
      destinationLocationId,
      startingTime,
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
 * Cancelled a ride request for a user
 */
export async function cancelRideRequest(requestId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be signed in to cancel a ride request");
    }

    const success = await cancelRideRequestDb({
      userId: session.user.id,
      requestId: requestId,
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
 * Get all ride request for a user
 */
export const getUserRideRequests = async (): Promise<PublicRideRequest[]> => {

    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('You must be signed in to request a ride');
    }

    const rideRequests = await getUserRideRequestsDb(session.user.id);

    return rideRequests;
};
