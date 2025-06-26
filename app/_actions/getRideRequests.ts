'use server'

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cache } from 'react';
import { startOfDay, endOfDay } from 'date-fns';

// Define the RideRequest type
export interface RideRequest {
  id: string;
  userId: string;
  user: {
    email: string;
  };
  startingPoint: string;
  destination: string;
  startingTime: Date;
  status: string;
  createdAt: Date;
}

// Define the AggregatedRideRequest type
export interface AggregatedRideRequest {
  key: string;
  from: string;
  to: string;
  time: string;
  date: string;
  count: number;
  requestIds: string[];
}

// Cache the function for better performance
export const getRideRequests = cache(async (): Promise<RideRequest[]> => {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error('You must be signed in to view ride requests');
    }

    const userId = session.user.id;

    // Get today's date range
    const today      = new Date();
    const startDay   = startOfDay(today);
    const endDay     = endOfDay(today);

    // Check if the user has any create rides, bookings, or requests for today
    const hasActivity = await checkUserDailyActivity( userId, startDay, endDay );
    
    if ( hasActivity ) {
      // If user has activity, don't show other requests
      return [];
    }

    // Get all pending ride requests for today (excluding the user's own)
    const rideRequests = await prisma.rideRequest.findMany({
      where: {
        userId: {
          not: userId, // Exclude the current user's requests
        },
        createdAt: {
          gte: startDay,
          lte: endDay,
        },
        status: 'Pending',
        // Only get future ride requests
        startingTime: {
          gte: today,
        },
      },
      include: {
        user: {
          select: {
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
    console.error('Error fetching ride requests:', error);
    throw error;
  }
});

// Get aggregated ride requests for today and future
export const getAggregatedRideRequests = cache(async (): Promise<AggregatedRideRequest[]> => {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error('You must be signed in to view ride requests');
    }

    const userId = session.user.id;

    // Get current date and time
    const now = new Date();

    // Check if the user has any create rides, bookings, or requests for today
    const hasActivity = await checkUserDailyActivity(userId, new Date(now), new Date(now));
    
    if (hasActivity) {
      // If user has activity, don't show other requests
      return [];
    }

    // Fetch ALL pending ride requests (including future dates, not just today)
    const rideRequests = await prisma.rideRequest.findMany({
      where: {
        userId: {
          not: userId, // Exclude the current user's requests
        },
        status: 'Pending',
        startingTime: {
          gte: now, // Only get future ride requests
        },
      },
      select: {
        id: true,
        startingPoint: true,
        destination: true,
        startingTime: true,
      },
      orderBy: {
        startingTime: 'asc',
      },
    });

    console.log(`Found ${rideRequests.length} future ride requests`);
    
    // Perform aggregation in JavaScript
    return aggregateRideRequestsClientSide(rideRequests);
  } catch (error) {
    console.error('Error fetching aggregated ride requests:', error);
    return [];
  }
});

// Helper function to aggregate ride requests on the client side
function aggregateRideRequestsClientSide(rideRequests: {
  id: string;
  startingPoint: string;
  destination: string;
  startingTime: Date;
}[]): AggregatedRideRequest[] {
  if (!rideRequests || rideRequests.length === 0) return [];

  console.log('Aggregating ride requests:', rideRequests.map(r => ({
    id: r.id,
    from: r.startingPoint,
    to: r.destination,
    time: new Date(r.startingTime).toISOString()
  })));

  // Group by starting point, destination, and time
  const groupedRequests: Record<string, AggregatedRideRequest> = {};
  
  rideRequests.forEach(request => {
    const requestTime = new Date(request.startingTime);
    
    // Format time in 24-hour format (HH:MM)
    const hours = requestTime.getHours().toString().padStart(2, '0');
    const minutes = requestTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Format date as MM/DD/YYYY
    const dateString = requestTime.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    const key = `${request.startingPoint}|${request.destination}|${timeString}`;
    
    if (!groupedRequests[key]) {
      groupedRequests[key] = {
        key,
        from: request.startingPoint,
        to: request.destination,
        time: timeString,
        date: dateString,
        count: 1,
        requestIds: [request.id]
      };
    } else {
      groupedRequests[key].count += 1;
      groupedRequests[key].requestIds.push(request.id);
    }
  });
  
  const result = Object.values(groupedRequests).sort((a, b) => {
    // First sort by count (most requested first)
    if (b.count !== a.count) return b.count - a.count;
    
    // Parse dates for comparison
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Sort by date (closest first)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Then by time
    const [aHour, aMinute] = a.time.split(':').map(Number);
    const [bHour, bMinute] = b.time.split(':').map(Number);
    
    if (aHour !== bHour) return aHour - bHour;
    if (aMinute !== bMinute) return aMinute - bMinute;
    
    // Then by starting point
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    
    // Then by destination
    return a.to.localeCompare(b.to);
  });
  
  console.log('Aggregated result:', result);
  return result;
}

// Get the user's ride request for today (for backward compatibility)
export const getUserRideRequest = cache(async (): Promise<RideRequest | null> => {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error('You must be signed in to view your ride request');
    }

    const userId = session.user.id;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get the user's ride request for today
    const rideRequest = await prisma.rideRequest.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return rideRequest;
  } catch (error) {
    console.error('Error fetching user ride request:', error);
    throw error;
  }
});

// Get all of the user's ride requests for today
export const getUserRideRequests = cache(async (): Promise<RideRequest[]> => {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error('You must be signed in to view your ride requests');
    }

    const userId = session.user.id;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get all the user's ride requests for today
    const rideRequests = await prisma.rideRequest.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: {
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
    console.error('Error fetching user ride requests:', error);
    throw error;
  }
});

// Helper function to check if user has any activity for today
async function checkUserDailyActivity(
  userId: string,
  startOfDay: Date,
  endOfDay: Date
): Promise<boolean> {
  // Check if user has created a ride
  const existingRide = await prisma.ride.findFirst({
    where: {
      driverId: userId,
      startingTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingRide) {
    return true;
  }

  // Check if user has booked a ride
  const existingBooking = await prisma.rideBooking.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingBooking) {
    return true;
  }

  // Check if user already has a ride request
  const existingRequest = await prisma.rideRequest.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return !!existingRequest;
} 