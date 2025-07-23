"use server";

import { auth } from "@/lib/auth/auth";
import { getRideById } from "@/lib/ride/rideServices";

/**
 * Fetch ride details for a specific ride ID
 */
export async function getRideDetails(rideId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const ride = await getRideById(rideId);

  return {
    id: ride.id,
    driver: {
      id: ride.driver.id,
      name: ride.driver.name || null,
      email: ride.driver.email,
      phone: ride.driver.phone || null,
    },
    startingTime: ride.startingTime,
    startingLocation: ride.startingLocation
      ? { id: ride.startingLocation.id, name: ride.startingLocation.name }
      : null,
    destinationLocation: ride.destinationLocation
      ? { id: ride.destinationLocation.id, name: ride.destinationLocation.name }
      : null,
    vehicle: ride.vehicle
      ? {
          id: ride.vehicle.id,
          type: ride.vehicle.type,
          model: ride.vehicle.model,
          vehicleNumber: ride.vehicle.vehicleNumber,
        }
      : null,
    status: ride.status,
    carbonCost: ride.carbonCost,
    maxPassengers: ride.maxPassengers,
    createdAt: ride.createdAt,
    bookings: ride.bookings.map((booking) => ({
      id: booking.id,
      user: {
        id: booking.user.id,
        name: booking.user.name || null,
        email: booking.user.email,
        phone: booking.user.phone || null,
      },
      status: booking.status,
      createdAt: booking.createdAt,
    })),
  };
}
