import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideStatus } from "@prisma/client";

export async function cancelRide(
    {
        userId,
        rideId,
    } : {
        userId: string,
        rideId: string,
    }
) {
    try {

        // Get the ride for authentication
        const ride = await prisma.ride.findUnique({
            where: { id: rideId, driverId: userId },
        });

        if ( ! ride ) {
            throw new Error( 'Ride not found or you are not the creater.' );
        }

        await prisma.ride.update({
            where: { id: rideId },
            data: { status: RideStatus.Cancelled },
        });

        return true;
        
    } catch (error) {
        logger.error( `Error cancelling ride: ${error}` );
        throw error;
    }
}