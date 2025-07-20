import { z } from "zod";
import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideBookingStatus, RideStatus } from "@prisma/client";
import {
  cancleRideBookingByDriverOnRideCancle,
  completeRideBooking,
} from "../rideBook/rideBookServices";
import {
  applyFineChargeRide,
  getWalletByUserId,
} from "../wallet/walletServices";
import { isMoreThanNMinutesLeft } from "@/utils/time";

// Validate the inputs
const createRideSchema = z.object({
  startingLocationId: z.string().min(1, "Starting point is required"),
  destinationLocationId: z.string().min(1, "Destination is required"),
  startingTime: z.string().min(1, "Starting time is required"),
  maxPassengers: z.number().int().min(1).max(3),
  vehicleId: z.string().optional(),
});

/**
 * Create a new ride
 */
export async function createRide({
  userId,
  startingLocationId,
  destinationLocationId,
  startingTime,
  maxPassengers,
  vehicleId,
}: {
  userId: string;
  startingLocationId: string;
  destinationLocationId: string;
  startingTime: string;
  maxPassengers: number;
  vehicleId: string;
}) {
  try {
    // Validate inputs before insert
    try {
      createRideSchema.parse({
        startingLocationId,
        destinationLocationId,
        startingTime,
        maxPassengers,
        vehicleId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: error.errors[0].message,
        };
      }
      throw error;
    }

    // Check the user has insufficient balance in wallet before create the ride
    const wallet = await getWalletByUserId(userId);

    if (wallet.spendableBalance < 0) {
      throw new Error("Insufficient carbon coin for craete ride");
    }

    // Check if user has an active ride
    const existingRide = await prisma.ride.findFirst({
      where: {
        driverId: userId,
        status: {
          in: [RideStatus.Pending, RideStatus.Active],
        },
      },
    });

    if (existingRide) {
      throw new Error("Please complete active ride before creating a new one.");
    }

    // Check if vehicle exists if vehicleId is provided
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId: userId,
      },
    });

    if (!vehicle) {
      throw new Error("Selected vehicle not found");
    }

    // Calculate carbon cost (distance-based cost)
    const carbonCost = parseFloat(process.env.NEXT_PUBLIC_CARBON_COST || "5");

    // Create the ride
    await prisma.ride.create({
      data: {
        driverId: userId,
        startingLocationId: startingLocationId,
        destinationLocationId: destinationLocationId,
        startingTime: startingTime,
        maxPassengers: maxPassengers,
        vehicleId: vehicleId,
        carbonCost: carbonCost,
        status: RideStatus.Pending,
      },
    });

    return true;
  } catch (error) {
    logger.error(`Error creating ride: ${error}`);
    throw error;
  }
}

/**
 * Cancle the ride
 */
export async function cancelRide({
  userId,
  rideId,
}: {
  userId: string;
  rideId: string;
}) {
  try {
    // Get the ride for authentication
    const ride = await prisma.ride.findUnique({
      where: { id: rideId, driverId: userId },
      include: {
        bookings: {
          where: {
            status: {
              in: [RideBookingStatus.Confirmed, RideBookingStatus.Active],
            },
          },
        },
      },
    });

    if (!ride) {
      throw new Error("Ride not found or you are not the creater.");
    }

    // Handle ride bookings
    const rideBookings = ride.bookings;

    let hasAnyConfirmOrActiveRideBooking = false;

    for (const rideBooking of rideBookings) {
      // Check for any confirmed of active ride booking
      if (
        rideBooking.status === "Confirmed" ||
        rideBooking.status === "Active"
      ) {
        hasAnyConfirmOrActiveRideBooking = true;
      }

      // Cancle ride booking by driver
      try {
        await cancleRideBookingByDriverOnRideCancle({
          driverId: userId,
          bookingId: rideBooking.id,
        });
      } catch (error) {
        logger.error(
          `Unable to cancle the ride booking: ${rideBooking.id}: ${error}`
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Check ride booking is getting cancled before ride threshold time
      const rideThresHoldMinuts = Number(
        process.env.NEXT_PUBLIC_RIDE_THRESHOLD_TIME
      );
      if (
        hasAnyConfirmOrActiveRideBooking &&
        !isMoreThanNMinutesLeft(ride.startingTime, rideThresHoldMinuts)
      ) {
        // Charge fine for late cancellation to champion
        const rideCancellationCharge = Number(
          process.env.NEXT_PUBLIC_RIDE_CANCELLATION_CHARGE_CHAMPION
        );

        await applyFineChargeRide({
          tx,
          userId: userId,
          rideId: rideId,
          amount: rideCancellationCharge,
        });
      }

      await tx.ride.update({
        where: { id: rideId },
        data: { status: RideStatus.Cancelled },
      });
    });

    return true;
  } catch (error) {
    logger.error(`Error cancelling ride: ${error}`);
    throw error;
  }
}

/**
 * Activate ( Start ) the ride
 */
export async function activateRide({
  userId,
  rideId,
}: {
  userId: string;
  rideId: string;
}) {
  try {
    // Get the ride for authentication
    const ride = await prisma.ride.findUnique({
      where: { id: rideId, driverId: userId },
      include: {
        bookings: {
          where: {
            status: {
              in: [RideBookingStatus.Confirmed, RideBookingStatus.Active],
            },
          },
          include: { user: true },
        },
      },
    });

    if (!ride) {
      throw new Error("Ride not found or you are not the creater.");
    }

    if (ride.status != RideStatus.Pending) {
      throw new Error("Ride is not Pending and cannot be activate");
    }

    // Handle ride bookings
    const rideBookings = ride.bookings;

    // Check for any confirm ridebooking status
    for (const rideBooking of rideBookings) {
      if (rideBooking.status == RideBookingStatus.Confirmed) {
        throw new Error(
          `
            Rider ${
              rideBooking.user.name || rideBooking.user.email
            } is not reached yet.
          `
        );
      }
    }

    // Update the ride status to active
    await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.Active },
    });

    return true;
  } catch (error) {
    logger.error(`Error activating ride: ${error}`);
    throw error;
  }
}

/**
 * Complete a ride
 */
export async function completeRide({
  userId,
  rideId,
}: {
  userId: string;
  rideId: string;
}) {
  // Fetch the ride with bookings and location details
  const ride = await prisma.ride.findUnique({
    where: { id: rideId, driverId: userId },
    include: {
      bookings: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!ride) {
    throw new Error(
      `Ride not found or You're not authorized to complete this ride`
    );
  }

  if (ride.status != RideStatus.Active) {
    throw new Error("The ride is not active and cannot be completed.");
  }

  // Handle ride bookings
  const rideBookings = ride.bookings;

  for (const rideBooking of rideBookings) {
    // Complete all active ride booking
    if (rideBooking.status == RideBookingStatus.Active) {
      try {
        await completeRideBooking({
          driverId: userId,
          bookingId: rideBooking.id,
        });
      } catch (error) {
        logger.error(
          `Unable to complete the ride booking: ${rideBooking.id}: ${error}`
        );
      }
    }
  }

  // Update the ride status to active
  await prisma.ride.update({
    where: { id: rideId },
    data: { status: RideStatus.Completed },
  });

  return true;
}

/**
 * Get all ride of a user
 */
export async function getUserRides(userId: string, limit: number = 20) {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        driverId: userId,
      },
      include: {
        startingLocation: {
          select: { id: true, name: true },
        },
        destinationLocation: {
          select: { id: true, name: true },
        },
        vehicle: {
          select: { id: true, type: true, model: true },
        },
        bookings: {
          include: { user: true },
        },
      },
      orderBy: {
        startingTime: "asc",
      },
      take: limit,
    });

    return rides;
  } catch (error) {
    logger.error(`Error on fetching user rides: ${error}`);
    throw error;
  }
}

/**
 * Get avialable ride for a user
 */
export async function getAvailableRidesForUser(userId: string) {
  // Get current time in UTC (database stores in UTC)
  const nowUTC = new Date();

  const rides = await prisma.ride.findMany({
    where: {
      status: RideStatus.Pending,
      startingTime: {
        gt: nowUTC, // Only future rides (not past current time)
      },
      NOT: { driverId: userId },
    },
    include: {
      startingLocation: true,
      destinationLocation: true,
      vehicle: true,
      driver: { select: { name: true, email: true } },
      bookings: {
        where: {
          status: {
            in: [RideBookingStatus.Active, RideBookingStatus.Confirmed],
          }, // Only count pending and confirmed bookings
        },
      },
    },
    orderBy: {
      startingTime: "asc", // Order by time ascending (earliest first)
    },
  });

  return rides
    .filter((ride) => {
      // Check if user has already booked this ride (any status)
      const userHasBooked = ride.bookings.some(
        (booking) => booking.userId === userId
      );
      if (userHasBooked) {
        return false; // Exclude rides already booked by user
      }

      // Additional filter to ensure seats are available
      const confirmedBookings = ride.bookings.filter(
        (booking) => booking.status === RideBookingStatus.Confirmed
      ).length;
      return ride.maxPassengers > confirmedBookings; // Only show rides with available seats
    })
    .map((ride) => {
      const confirmedBookings = ride.bookings.filter(
        (booking) => booking.status === RideBookingStatus.Confirmed
      ).length;

      return {
        id: ride.id,
        startingLocationId: ride.startingLocationId,
        destinationLocationId: ride.destinationLocationId,
        startingLocationName: ride.startingLocation?.name,
        destinationLocationName: ride.destinationLocation?.name,
        availableSets: ride.maxPassengers - confirmedBookings,
        driverName: ride.driver.name,
        driverEmail: ride.driver.email,
        startingTime: ride.startingTime,
        vehicleId: ride.vehicle?.id,
        vehicleName: ride.vehicle?.model,
        vehicleType: ride.vehicle?.type,
      };
    });
}
