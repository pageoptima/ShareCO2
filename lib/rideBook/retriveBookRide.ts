import logger from "@/config/logger";
import { prisma } from "@/config/prisma";

/**
 * Get all ride of a user
 */
export async function getUserRideBookings( userId: string, limit: number = 20 ) {
    try {
        const rideBookings = await prisma.rideBooking.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                status: true,
                ride: {
                    select: {
                        id: true,
                        status: true,
                        startingTime: true,
                        startingLocation: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        destinationLocation: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            },
            take: limit,
        });
        console.log(rideBookings);
        return rideBookings;
    } catch (error: any) {
        logger.error( `Error on fetching user rides: ${error}` )
        throw error;
    }
}