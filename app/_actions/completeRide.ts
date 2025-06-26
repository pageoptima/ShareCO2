"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RideBooking, Ride, User } from "@prisma/client";
import Ably from "ably";
import { formatCarbonPointsForDB } from "@/lib/carbonPointsConversion";

// Define a more specific ride type for our needs
interface RideWithBookings extends Ride {
  bookings: (RideBooking & {
    user: User;
  })[];
}

// Initialize Ably for server-side operations
const ably = new Ably.Rest(process.env.ABLY_SERVER_API_KEY || '');

// Helper function to generate ride channel name
function getRideChannelName(rideId: string): string {
  return `ride:${rideId}`;
}

export async function completeRide(rideId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Fetch the ride with bookings and location details
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      bookings: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  // Check if user is either the driver or a passenger with a confirmed booking
  const userId = session.user.id as string;
  const isDriver = ride.driverId === userId;
  const isPassenger = ride.bookings.some(
    (booking) => booking.userId === userId && booking.status === "Confirmed"
  );

  if (!isDriver && !isPassenger) {
    throw new Error("You're not authorized to complete this ride");
  }

  // If user is a passenger, mark their booking as completed
  if (isPassenger) {
    await prisma.rideBooking.update({
      where: { rideId_userId: { rideId, userId } },
      data: { status: "Completed" },
    });

    // Check if all confirmed bookings are now completed
    const allBookingsCompleted = await checkAllBookingsCompleted(rideId);
    
    // If all bookings are completed, process carbon points and mark ride as completed
    if (allBookingsCompleted) {
      await processRideCarbonPoints(ride as RideWithBookings);
    }

    return { success: true, message: "Your ride has been marked as completed" };
  }

  // If user is the driver, mark the ride as completed and process carbon points
  if (isDriver) {
    // If there are no confirmed bookings, just mark as completed
    if (ride.bookings.filter(b => b.status === "Confirmed").length === 0) {
      await prisma.ride.update({
        where: { id: rideId },
        data: { status: "Completed" },
      });
      return { success: true, message: "Ride marked as completed" };
    }
    
    // Check if all confirmed bookings are completed
    const allBookingsCompleted = await checkAllBookingsCompleted(rideId);
    
    if (allBookingsCompleted) {
      await processRideCarbonPoints(ride as RideWithBookings);
      return { success: true, message: "Ride completed and carbon points processed" };
    }
    
    return { 
      success: true, 
      message: "Waiting for all passengers to mark the ride as completed" 
    };
  }
}

// Helper function to check if all confirmed bookings are completed
async function checkAllBookingsCompleted(rideId: string): Promise<boolean> {
  const bookings = await prisma.rideBooking.findMany({
    where: { 
      rideId,
      status: "Confirmed" 
    },
  });
  
  const completedBookings = await prisma.rideBooking.findMany({
    where: { 
      rideId,
      status: "Completed" 
    },
  });
  
  // If there are no confirmed bookings, return true
  if (bookings.length === 0) return true;
  
  // Check if all confirmed bookings are now completed
  return completedBookings.length === bookings.length;
}

// Helper function to process carbon points transfers
async function processRideCarbonPoints(ride: RideWithBookings) {
  // Calculate carbon points based on vehicle type
  // Fixed carbon points: Car/4 Wheeler = 2 CP, Bike/2 Wheeler = 1 CP
  let carbonPoints = 2; // Default to car cost
  
  if (ride.vehicleType) {
    const vehicleType = ride.vehicleType.toLowerCase();
    if (vehicleType.includes('2') || vehicleType.includes('bike') || vehicleType.includes('two')) {
      carbonPoints = 1; // 2 Wheeler/Bike
    } else {
      carbonPoints = 2; // 4 Wheeler/Car
    }
  }
  
  // Ensure proper database precision
  const carbonPointsForDB = formatCarbonPointsForDB(carbonPoints);
  
  // Get confirmed bookings (passengers)
  const confirmedBookings = ride.bookings.filter(
    (booking) => booking.status === "Confirmed" || booking.status === "Completed"
  );
  
  // Update ride status to completed
  await prisma.ride.update({
    where: { id: ride.id },
    data: { 
      status: "Completed",
      carbonCost: carbonPointsForDB
    },
  });
  
  // Clean up the chat channel
  try {
    const channelName = getRideChannelName(ride.id);
    const channel = ably.channels.get(channelName);
    
    // Publish a system message that the ride is completed
    await channel.publish("system", JSON.stringify({
      type: "ride-completed",
      message: "This ride has been completed. The chat channel will be closed."
    }));
    
    console.log(`System message sent to chat channel ${channelName}`);
  } catch (error) {
    console.error(`Error sending system message to chat channel for ride ${ride.id}:`, error);
  }
  
  // Process carbon points - deduct from passengers and credit to driver
  let totalDriverPoints = 0;
  
  // Deduct points from each passenger and calculate total for driver
  for (const booking of confirmedBookings) {
    // Check if passenger has enough carbon points
    const passenger = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: { carbonPoints: true },
    });

    if (!passenger) {
      throw new Error(`Passenger not found: ${booking.userId}`);
    }

    if (passenger.carbonPoints < carbonPointsForDB) {
      throw new Error(`Passenger ${booking.user.email} has insufficient carbon points for this ride.`);
    }

    // Create debit transaction for passenger
    await prisma.transaction.create({
      data: {
        userId: booking.userId,
        type: "debit",
        amount: carbonPointsForDB,
        description: `Ride from ${ride.startingPoint} to ${ride.destination}`,
      },
    });
    
    // Deduct points from passenger
    await prisma.user.update({
      where: { id: booking.userId },
      data: {
        carbonPoints: {
          decrement: carbonPointsForDB,
        },
      },
    });
    
    totalDriverPoints += carbonPointsForDB;
  }
  
  // Add points to driver if any passengers were on the ride
  if (totalDriverPoints > 0) {
    // Ensure proper database precision for driver points
    const driverPointsToAdd = formatCarbonPointsForDB(totalDriverPoints);
    
    // Create credit transaction for driver
    await prisma.transaction.create({
      data: {
        userId: ride.driverId,
        type: "credit",
        amount: driverPointsToAdd,
        description: `Ride from ${ride.startingPoint} to ${ride.destination} with ${confirmedBookings.length} passenger(s)`,
      },
    });
    
    // Add points to driver
    await prisma.user.update({
      where: { id: ride.driverId },
      data: {
        carbonPoints: {
          increment: driverPointsToAdd,
        },
      },
    });
  }
  
  // Mark all bookings as completed
  await prisma.rideBooking.updateMany({
    where: { rideId: ride.id, status: "Confirmed" },
    data: { status: "Completed" },
  });
} 