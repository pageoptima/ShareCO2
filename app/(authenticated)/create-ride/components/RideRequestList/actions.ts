"use server";

import { auth } from "@/lib/auth/auth";
import { getAggregatedRideRequests as getAggregatedRideRequestsDb  } from "@/lib/rideRequest/retriveRideRequest";
import { PublicAggregatedRideRequests } from "./types";


// /**
//  * Get all ride request for a user
//  */
// export const getRideRequest = async (): Promise<PublicRideRequest[]> => {
    
//     // Authenticate the user
//     const session = await auth();
//     if ( !session?.user?.id ) {
//         throw new Error( 'You must be signed in to request a ride' );
//     }

//     const rideRequests = await getOthersRideRequests(session.user.id);

//     return rideRequests;
// };

/**
 * Get all ride request for a user
 */
export const getAggregatedRideRequests = async (): Promise<PublicAggregatedRideRequests[]> => {
    
    // Authenticate the user
    const session = await auth();
    if ( !session?.user?.id ) {
        throw new Error( 'You must be signed in to request a ride' );
    }

    const rideRequests = await getAggregatedRideRequestsDb(session.user.id);

    return rideRequests;
};