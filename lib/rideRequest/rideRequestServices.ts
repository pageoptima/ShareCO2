import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideRequestStatus } from "@prisma/client";
import {
  addDays,
  addMinutes,
  endOfDay,
  startOfDay,
  startOfMinute,
} from "date-fns";

/**
 * Create a new ride request for user
 */
export async function createRideRequest({
  userId,
  startingLocationId,
  destinationLocationId,
  startingTime,
}: {
  userId: string;
  startingLocationId: string;
  destinationLocationId: string;
  startingTime: string;
}) {
  try {
    // Check if user profile is complete
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isProfileCompleted: true },
    });

    if (!user || !user.isProfileCompleted) {
      throw new Error(
        "Please complete your profile before creating a ride request."
      );
    }

    // Validate startingTime
    const requestTime = new Date(startingTime).getTime();
    const thirtyMinutesLater = Date.now() + 30 * 60 * 1000;
    const endOfTomorrow = endOfDay(addDays(new Date(), 1)).getTime();

    if (isNaN(requestTime)) {
      throw new Error("Invalid starting time format");
    }

    if (requestTime < thirtyMinutesLater) {
      throw new Error("Ride request time must be at least 30 minutes from now");
    }

    if (requestTime > endOfTomorrow) {
      throw new Error("Ride request time must be within today or tomorrow");
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

    if (duplicateRequest) {
      throw new Error("You already have a ride request with the same details");
    }

    // Create the ride request in the database
    await prisma.rideRequest.create({
      data: {
        userId,
        startingLocationId,
        destinationLocationId,
        startingTime,
        status: RideRequestStatus.Pending,
      },
    });

    return true;
  } catch (error) {
    logger.error(`Error creating ride request: ${error}`);
    throw error;
  }
}

/**
 * Cancel ride request for a user by a user
 */
export async function cancelRideRequest({
  userId,
  requestId,
}: {
  userId: string;
  requestId: string;
}) {
  try {
    // Find the ride request
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: requestId },
    });

    if (!rideRequest) {
      throw new Error("Ride request not found");
    }

    // Check if the user is the owner of the ride request
    if (rideRequest.userId !== userId) {
      throw new Error("You can only cancel your own ride requests");
    }

    // Check if the ride request is already cancelled or matched
    if (rideRequest.status !== RideRequestStatus.Pending) {
      throw new Error("Cannot cancel a ride request that is not pending");
    }

    // Update the ride request status to Canceled
    await prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: RideRequestStatus.Cancelled },
    });

    return true;
  } catch (error) {
    logger.error(`Error cancelling ride request: ${error}`);
    throw error;
  }
}

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
        createdAt: "desc",
      },
    });

    return rideRequests;
  } catch (error) {
    logger.error(`Error fetching ride requests: ${error}`);
    throw error;
  }
};

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
        startingLocation: { select: { id: true, name: true } },
        destinationLocation: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return rideRequests;
  } catch (error) {
    logger.error(`Error fetching ride requests: ${error}`);
    throw error;
  }
};

/**
 * Get aggregated ride requests by 30-minute time windows for today and future
 */
export const getAggregatedRideRequests = async (userId: string) => {
  try {
    // Get current date and time
    const now = new Date();

    // Fetch ALL pending ride requests
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
        startingTime: "asc",
      },
    });

    // Group by 30-minute time windows
    const timeWindowRequests: Record<
      string,
      {
        timeWindowStart: Date;
        timeWindowEnd: Date;
        requests: {
          key: string;
          startingLocationId: string | null;
          destinationLocationId: string | null;
          startingLocation: { id: string; name: string } | null;
          destinationLocation: { id: string; name: string } | null;
          startingTime: Date;
          requestIds: string[];
        }[];
      }
    > = {};

    rideRequests.forEach((request) => {
      const requestTime = new Date(request.startingTime);
      // Round down to the nearest 30-minute interval
      const minutes = requestTime.getMinutes();
      const windowStart = startOfMinute(
        new Date(requestTime.setMinutes(minutes >= 30 ? 30 : 0))
      );
      const windowEnd = addMinutes(windowStart, 30);
      const windowKey = windowStart.toISOString();

      const requestKey = `${request.startingLocationId}|${request.destinationLocationId}|${requestTime}`;

      if (!timeWindowRequests[windowKey]) {
        timeWindowRequests[windowKey] = {
          timeWindowStart: windowStart,
          timeWindowEnd: windowEnd,
          requests: [],
        };
      }

      const existingRequest = timeWindowRequests[windowKey].requests.find(
        (r) => r.key === requestKey
      );

      if (existingRequest) {
        existingRequest.requestIds.push(request.id);
      } else {
        timeWindowRequests[windowKey].requests.push({
          key: requestKey,
          startingLocationId: request.startingLocationId,
          destinationLocationId: request.destinationLocationId,
          startingLocation: request.startingLocation,
          destinationLocation: request.destinationLocation,
          startingTime: request.startingTime,
          requestIds: [request.id],
        });
      }
    });

    // Convert to array and sort by time window
    const groupedRequestsList = Object.values(timeWindowRequests).sort(
      (a, b) => {
        const tA = new Date(a.timeWindowStart).getTime();
        const tB = new Date(b.timeWindowStart).getTime();
        return tA - tB; // ascending: earliest first
      }
    );

    return groupedRequestsList;
  } catch (error) {
    logger.error(`Error fetching aggregated ride requests: ${error}`);
    throw error;
  }
};
