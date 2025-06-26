"use server";

import { prisma } from "@/lib/prisma";

export async function getAvailableRides(userId: string) {
  // Get current time in UTC (database stores in UTC)
  const nowUTC = new Date();

  const rides = await prisma.ride.findMany({
    where: {
      status: "Pending",
      startingTime: { 
        gt: nowUTC // Only future rides (not past current time)
      },
      NOT: { driverId: userId },
    },
    include: {
      driver: { select: { email: true } },
      bookings: {
        where: {
          status: { in: ["Pending", "Confirmed"] } // Only count pending and confirmed bookings
        }
      },
    },
    orderBy: {
      startingTime: "asc" // Order by time ascending (earliest first)
    }
  });

  return rides
    .filter(ride => {
      // Check if user has already booked this ride (any status)
      const userHasBooked = ride.bookings.some(booking => booking.userId === userId);
      if (userHasBooked) {
        return false; // Exclude rides already booked by user
      }
      
      // Additional filter to ensure seats are available
      const confirmedBookings = ride.bookings.filter(booking => booking.status === "Confirmed").length;
      return ride.maxPassengers > confirmedBookings; // Only show rides with available seats
    })
    .map((ride) => {
      const confirmedBookings = ride.bookings.filter(booking => booking.status === "Confirmed").length;
      
      return {
        id: ride.id,
        from: ride.startingPoint,
        to: ride.destination,
        seatsLeft: ride.maxPassengers - confirmedBookings,
        driverName: ride.driver.email.split("@")[0],
        startingTime: ride.startingTime.toISOString(), // Return full ISO string for proper time formatting
        vehicleType: ride.vehicleType, // Include vehicle type for carbon points calculation
      };
    });
}