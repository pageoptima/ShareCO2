import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideRequestStatus } from "@prisma/client";

/**
 * Cancel ride request for a user by a user
 */
export async function cancelRideRequest(
  {
    userId,
    requestId,
  } : {
    userId: string,
    requestId: string,
  }
) {
  try {

    // Find the ride request
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: requestId },
    });

    if ( ! rideRequest ) {
      throw new Error( 'Ride request not found' );
    }

    // Check if the user is the owner of the ride request
    if (rideRequest.userId !== userId) {
      throw new Error( 'You can only cancel your own ride requests' );
    }

    // Check if the ride request is already cancelled or matched
    if (rideRequest.status !== RideRequestStatus.Pending ) {
      throw new Error( 'Cannot cancel a ride request that is not pending' );
    }

    // Update the ride request status to Canceled
    await prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: RideRequestStatus.Cancelled },
    });

    return true;
  } catch (error) {
    logger.error( `Error cancelling ride request: ${error}`);
    throw error;
  }
}