import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideRequestStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

/**
 * Get other's ride request except user
 */
export const getOthersRideRequests = async (userId: string) => {
    try {

        // Get today's date range
        const today = new Date();
        const startDay = startOfDay(today);
        const endDay = endOfDay(today);


        // Get all pending ride requests for today (excluding the user's own)
        const rideRequests = await prisma.rideRequest.findMany({
            where: {
                // Exclude the current user's requests
                userId: {
                    not: userId,
                },
                createdAt: {
                    gte: startDay,
                    lte: endDay,
                },
                status: RideRequestStatus.Pending,
                // Only get future ride requests
                startingTime: {
                    gte: today,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return rideRequests;

    } catch (error) {
        logger.error(`Error fetching ride requests: ${error}`);
        throw error;
    }
}

/**
 * Get all of the user's ride requests for today
 */
export const getUserRideRequests = async (userId: string) => {
    try {

        // Get today's date range
        const today = new Date();
        const startDay = startOfDay(today);
        const endDay = endOfDay(today);

        // Get all the user's ride requests for today
        const rideRequests = await prisma.rideRequest.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDay,
                    lte: endDay,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                startingLocation: { select: { id: true, name: true }},
                destinationLocation: { select: { id: true, name: true } },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return rideRequests;
    } catch (error) {
        logger.error(`Error fetching ride requests: ${error}`);
        throw error;
    }
};

/**
 * Get aggregated ride requests for today and future
 */
export const getAggregatedRideRequests = async (userId: string) => {
    try {

        // Get current date and time
        const now = new Date();

        // Fetch ALL pending ride requests (including future dates, not just today)
        const rideRequests = await prisma.rideRequest.findMany({
            where: {
                userId: {
                    not: userId,
                },
                status: RideRequestStatus.Pending,
                startingTime: {
                    gte: now,
                },
            },
            include: {
                startingLocation: { select: { id: true, name: true } },
                destinationLocation: { select: { id: true, name: true } },
            },
            orderBy: {
                startingTime: 'asc',
            },
        });

        // Group by starting point, destination, and time
        const groupedRequests: Record<string, {
            key                  : string,
            startingLocationId   : string | null,
            destinationLocationId: string | null,
            startingLocation     : { id: string, name: string } | null,
            destinationLocation  : { id: string, name: string } | null,
            startingTime         : Date,
            requestIds           : string[],
        }> = {};

        rideRequests.forEach( request => {

            const requestTime = new Date(request.startingTime);

            // Prepare key for gorup request
            const key = `${request.startingLocationId}|${request.destinationLocationId}|${requestTime}`;

            if (!groupedRequests[key]) {
                groupedRequests[key] = {
                    key,
                    startingLocationId   : request.startingLocationId,
                    destinationLocationId: request.destinationLocationId,
                    startingLocation     : request.startingLocation,
                    destinationLocation  : request.destinationLocation,
                    startingTime         : request.startingTime,
                    requestIds           : [request.id],
                };
            } else {
                groupedRequests[key].requestIds.push(request.id);
            }
        });

        const groupedRequestsList = Object.values(groupedRequests).sort((a, b) => {
            const tA = new Date(a.startingTime).getTime();
            const tB = new Date(b.startingTime).getTime();
            return tA - tB;  // ascending: earliest first
        });

        return groupedRequestsList;

    } catch (error) {
        logger.error( `Error fetching aggregated ride requests: ${error}` );
        throw error;
    }
};
