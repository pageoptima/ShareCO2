"use server";

import { auth } from "@/lib/auth/auth";
import { getAvailableRidesForUser } from "@/lib/ride/retriveRide";
import { bookRide as bookRideDb } from "@/lib/rideBook/bookRide";
import { PublicAvialableRides } from "./types";

/**
 * Get all avialable ride for the authenticated user
 */
export async function getAvialableRides(): Promise<PublicAvialableRides[]> {

    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('You must be signed in to view avilalable rides');
    }

    // Get avialable rides
    const avialableRides = await getAvailableRidesForUser(session.user.id);

    return avialableRides;
}

/**
 * Book ride for the user
 */
export async function bookRide( rideId: string ) {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('You must be signed in to book rides');
    }

    const success = await bookRideDb({
        userId: session.user.id,
        rideId: rideId,
    });

    return success;
}
