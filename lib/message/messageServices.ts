import logger from "@/config/logger";
import { prisma } from "@/config/prisma";

/**
 * Insert message into database.
 */
export async function insertMessage(
    {
        rideId,
        senderId,
        content,
    }:
        {
            rideId: string,
            senderId: string,
            content: string
        }
) {
    try {

        await validateCredentials({ rideId, userId: senderId });

        // Insert message into database.
        const message = await prisma.chatMessage.create({
            data: {
                rideId: rideId,
                userId: senderId,
                content: content,
            },
        });

        return message;

    } catch (error) {
        logger.error(`Error insert message: ${error}`);
        throw error;
    }
}

/**
 * Fetch messages for a ride, including sender info, ordered oldest→newest.
 */
export async function getMessagesByRide(
    {
        userId,
        rideId,
    }: {
        userId: string
        rideId: string
    }
) {
    await validateCredentials({ rideId, userId });

    const messages = await prisma.chatMessage.findMany({
        where: { rideId },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: 'asc' },
    });

    return messages;
}

/**
 * Validate the credential for accessing the chat
 */
async function validateCredentials(
    {
        rideId,
        userId,
    }: {
        rideId: string,
        userId: string,
    }
) {

    let ride = null;
    try {
        // Check ride status
        ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                bookings: {
                    where: {
                        userId: userId
                    }
                }
            },
        });
    } catch ( error ) {
        logger.error( `Unable to fetch ride: ${error}` );
        throw new Error('Something went wrong. Please try again letter.');
    }

    if (!ride) {
        throw new Error( 'Ride not found' );
    }

    if ( ride.status === 'Cancelled' ) {
        throw new Error( 'Ride is cancelled. Chat closed.' );
    }

    // Authenticate the user
    let senderIsAuthenticated = false;

    // Check sender is driver
    if (ride.driverId === userId) {
        senderIsAuthenticated = true;
    } else {

        // Check sender is rider
        if (ride.bookings.length > 0) {

            senderIsAuthenticated = true;

            if (
                ride.bookings[0].status === 'CancelledDriver' ||
                ride.bookings[0].status === 'CancelledUser'
            ) {
                throw new Error('Ride booking is cancelled. chat closed.');
            }
        }
    }

    if (!senderIsAuthenticated) {
        throw new Error('Unauthorized sender');
    }

    return true;
}