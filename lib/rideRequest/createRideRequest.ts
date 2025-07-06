import logger from '@/config/logger';
import { prisma } from '@/config/prisma';
import { RideRequestStatus } from '@prisma/client';

/**
 * Create a new ride request for user
 */
export async function createRideRequest(
    {
        userId,
        startingLocationId,
        destinationLocationId,
        startingTime,
    } : {
        userId               : string,
        startingLocationId   : string,
        destinationLocationId: string,
        startingTime         : string,
    }
) {
    try {

        // Create date object for requestest time
        const requestTime        = new Date(startingTime).getTime();
        const thirtyMinutesLater = Date.now() + 30 * 60 * 1000;

        if ( requestTime < thirtyMinutesLater ) {
            throw new Error( 'Ride request time must be at least 30 minutes from now' );
        }

        // Check for duplicate ride request with same start, destination and time from the SAME user
        const duplicateRequest = await prisma.rideRequest.findFirst({
            where: {
                userId: userId,
                startingLocationId,
                destinationLocationId,
                startingTime,
                status: RideRequestStatus.Pending,
            },
        });

        if ( duplicateRequest ) {
            throw new Error( 'You already have a ride request with the same details' );
        }

        // Create the ride request in the database
        const rideRequest = await prisma.rideRequest.create({
            data: {
                userId,
                startingLocationId,
                destinationLocationId,
                startingTime,
                status: RideRequestStatus.Pending,
            },
        });

        return rideRequest.id;
    } catch (error) {
        logger.error( `Error creating ride request: ${error}`);
        throw error;
    }
}
