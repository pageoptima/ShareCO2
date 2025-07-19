import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideBookingStatus, RideStatus, VehicleType } from "@prisma/client";
import {
  applyFineChargeRidebooking,
  creditDriverPayout,
  hasSufficientSpendableBalance,
  holdRideCost,
  settleRideCost,
  unholdRideCost,
} from "@/lib/wallet/walletServices";
import { hasPassedNMinutes, isMoreThanNMinutesLeft } from "@/utils/time";

/**
 * Book a ride for a user
 */
export async function bookRide({
  userId,
  rideId,
}: {
  userId: string;
  rideId: string;
}) {
  try {
    // Check if user profile is complete
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isProfileCompleted: true }, // Only fetch isProfileCompleted
    });

    if (!user || !user.isProfileCompleted) {
      throw new Error(
        "Please complete your profile before creating a ride request."
      );
    }

    // Check if the ride exists and is available
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { bookings: true },
    });

    if (!ride) {
      throw new Error("Ride not found");
    }

    const now = new Date();
    if (ride.status !== RideStatus.Pending || ride.startingTime <= now) {
      throw new Error("Ride is not available for booking");
    }

    // Check confirmed bookings for seat availability (first-come-first-serve)
    const confirmedBookings = ride.bookings.filter(
      (booking) => booking.status === RideBookingStatus.Confirmed
    ).length;
    if (confirmedBookings >= ride.maxPassengers) {
      throw new Error("Ride has reached maximum passenger capacity");
    }

    // Check if the user has already booked this ride
    const existingBooking = await prisma.rideBooking.findUnique({
      where: { rideId_userId: { rideId, userId } },
    });

    if (existingBooking) {
      throw new Error("You have already booked this ride");
    }

    // Check if the user has an active ride - can only book a new ride if previous rides are completed
    const activeBookings = await prisma.rideBooking.findMany({
      where: {
        userId,
        status: {
          in: [RideBookingStatus.Confirmed, RideBookingStatus.Active],
        },
        ride: {
          status: RideStatus.Active,
        },
      },
    });

    if (activeBookings.length > 0) {
      throw new Error(
        "You have an active ride. Please complete it before booking a new one."
      );
    }

    // Create a new booking in a transaction (no carbon points deduction at booking time)
    await prisma.$transaction(async (tx) => {
      // Double-check seat availability within transaction to prevent race conditions
      const currentRide = await tx.ride.findUnique({
        where: { id: rideId },
        include: {
          bookings: {
            where: {
              status: {
                in: [RideBookingStatus.Confirmed, RideBookingStatus.Active],
              },
            },
          },
          vehicle: true,
        },
      });

      // Check ride existence
      if (!currentRide) {
        throw new Error("Ride not found");
      }

      // Check for passenger capacity
      if (currentRide.bookings.length >= currentRide.maxPassengers) {
        throw new Error("Ride has reached maximum passenger capacity");
      }

      // Calculate riding cost amount
      const amount =
        currentRide.vehicle?.type === VehicleType.Wheeler2
          ? Number(process.env.NEXT_PUBLIC_CARBON_COST_TWO_WHEELER)
          : Number(process.env.NEXT_PUBLIC_CARBON_COST_FOUR_WHEELER);

      // Check user has sufficient balance before creating ride
      if (!(await hasSufficientSpendableBalance({ tx, userId, amount }))) {
        throw new Error("Wallet has not sufficient spendable balance");
      }

      // Create the booking
      const rideBook = await tx.rideBooking.create({
        data: {
          rideId,
          userId,
          status: RideBookingStatus.Confirmed,
          carbonCost: amount,
        },
      });

      // Hold the ride cost
      await holdRideCost({
        tx,
        userId,
        rideId: rideBook.rideId,
        rideBookId: rideBook.id,
        amount,
      });
    });

    return true;
  } catch (error) {
    logger.error(`Error booking ride: ${error}`);
    throw error;
  }
}

/**
 * Activate( Start ) the ride booking by user
 */
export async function activateRideBooking({
  userId,
  bookingId,
}: {
  userId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.userId !== userId) {
    throw new Error("Not authorized to manage this booking");
  }

  if (booking.status != RideBookingStatus.Confirmed) {
    throw new Error("RideBooking is not in Confirmed state for activate");
  }

  await prisma.rideBooking.update({
    where: { id: bookingId },
    data: { status: RideBookingStatus.Active },
  });

  return true;
}

/**
 * Complete a ride booking
 */
export async function completeRideBooking({
  driverId,
  bookingId,
}: {
  driverId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.ride.driverId !== driverId) {
    throw new Error("Not authorized to manage this booking");
  }

  await prisma.$transaction(async (tx) => {
    // Settle the ride cost from rider
    await settleRideCost({
      tx,
      userId: booking.userId,
      rideId: booking.rideId,
      rideBookId: booking.id,
      amount: booking.carbonCost,
    });

    // Credit driver payout
    await creditDriverPayout({
      tx,
      userId: driverId,
      rideId: booking.rideId,
      rideBookId: booking.id,
      amount: booking.carbonCost,
    });

    // Update the ride booking status
    await prisma.rideBooking.update({
      where: { id: bookingId },
      data: { status: RideBookingStatus.Completed },
    });
  });

  return true;
}

/**
 * Cancle ride booking by driver on purpose
 */
export async function cancleRideBookingByDriverOnPurpose({
  driverId,
  bookingId,
}: {
  driverId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.ride.driverId !== driverId) {
    throw new Error("Not authorized to manage this booking");
  }

  await prisma.$transaction(async (tx) => {
    // Check ride booking is getting cancled before ride threshold time
    const rideThresHoldMinuts = Number(
      process.env.NEXT_PUBLIC_RIDE_THRESHOLD_TIME
    );
    if (
      !isMoreThanNMinutesLeft(booking.ride.startingTime, rideThresHoldMinuts)
    ) {
      // Charge fine for late cancellation to champion
      const rideCancellationCharge = Number(
        process.env.NEXT_PUBLIC_RIDE_CANCELLATION_CHARGE_CHAMPION
      );

      await applyFineChargeRidebooking({
        tx,
        userId: driverId,
        rideId: booking.rideId,
        rideBookId: booking.id,
        amount: rideCancellationCharge,
      });
    }

    // Unhold the amount from walet
    await unholdRideCost({
      tx,
      userId: booking.userId,
      rideId: booking.rideId,
      rideBookId: booking.id,
      amount: booking.carbonCost,
    });

    // Update the ride booking status
    await tx.rideBooking.update({
      where: { id: bookingId },
      data: { status: RideBookingStatus.CancelledDriver },
    });
  });

  return true;
}

/**
 * Cancle ride booking by driver on un reach
 */
export async function cancleRideBookingByDriverOnUnreach({
  driverId,
  bookingId,
}: {
  driverId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.ride.driverId !== driverId) {
    throw new Error("Not authorized to manage this booking");
  }

  await prisma.$transaction(async (tx) => {
    // Check ride starting time is passed the threshold waiting time
    const rideThresHoldWatingMinuts = Number(
      process.env.NEXT_PUBLIC_RIDE_THRESHOLD_WATING_TIME
    );

    if (
      !hasPassedNMinutes(booking.ride.startingTime, rideThresHoldWatingMinuts)
    ) {
      throw new Error(
        "Unable to cancell due to sufficient cancellation time left"
      );
    } else {
      // Unlock the rider's ride booking amount
      await unholdRideCost({
        tx,
        rideBookId: booking.id,
        rideId: booking.rideId,
        userId: booking.userId,
        amount: booking.carbonCost,
      });

      // Charge fine the user for unreach the ride
      const rideCancellationCharge = Number(
        process.env.NEXT_PUBLIC_RIDE_CANCELLATION_CHARGE_RIDER
      );

      await applyFineChargeRidebooking({
        tx,
        userId: driverId,
        rideId: booking.rideId,
        rideBookId: booking.id,
        amount: rideCancellationCharge,
      });
    }

    // Update the ride booking status
    await tx.rideBooking.update({
      where: { id: bookingId },
      data: { status: RideBookingStatus.CancelledDriver },
    });
  });

  return true;
}

/**
 * Cancle the ride booking by driver
 */
export async function cancleRideBookingByDriverOnRideCancle({
  driverId,
  bookingId,
}: {
  driverId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.ride.driverId !== driverId) {
    throw new Error("Not authorized to manage this booking");
  }

  await prisma.$transaction(async (tx) => {
    // Unhold the amount from walet

    await unholdRideCost({
      tx,
      userId: booking.userId,
      rideId: booking.rideId,
      rideBookId: booking.id,
      amount: booking.carbonCost,
    });

    // Update the ridebooking status
    await tx.rideBooking.update({
      where: { id: bookingId },
      data: { status: RideBookingStatus.CancelledDriver },
    });
  });

  return true;
}

/**
 * Deny the ride booking by user
 */
export async function cancleRideBookingByUser({
  userId,
  bookingId,
}: {
  userId: string;
  bookingId: string;
}) {
  // Find the booking and verify the driver is the ride owner
  const booking = await prisma.rideBooking.findUnique({
    where: { id: bookingId, userId: userId },
    include: { ride: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  await prisma.$transaction(async (tx) => {
    // Unhold the amount from walet
    await unholdRideCost({
      tx,
      userId: booking.userId,
      rideId: booking.rideId,
      rideBookId: booking.id,
      amount: booking.carbonCost,
    });

    // Check ride booking is getting cancled before ride threshold time
    const rideThresHoldMinuts = Number(
      process.env.NEXT_PUBLIC_RIDE_THRESHOLD_TIME
    );
    if (
      !isMoreThanNMinutesLeft(booking.ride.startingTime, rideThresHoldMinuts)
    ) {
      // Charge fine for late cancellation to rider
      const rideCancellationCharge = Number(
        process.env.NEXT_PUBLIC_RIDE_CANCELLATION_CHARGE_RIDER
      );

      await applyFineChargeRidebooking({
        tx,
        userId: booking.userId,
        rideId: booking.rideId,
        rideBookId: booking.id,
        amount: rideCancellationCharge,
      });
    }

    // Update the ridebooking status
    await tx.rideBooking.update({
      where: { id: bookingId },
      data: { status: RideBookingStatus.CancelledUser },
    });
  });

  return true;
}

/**
 * Get all ride bookings of a user from the database
 */
export async function getUserRideBookingsDb(
  userId: string,
  limit: number = 20
) {
  try {
    const rideBookings = await prisma.rideBooking.findMany({
      where: { userId: userId },
      select: {
        id: true,
        status: true,
        userId: true, 
        ride: {
          select: {
            id: true,
            status: true,
            startingTime: true,
            startingLocation: {
              select: { id: true, name: true },
            },
            destinationLocation: {
              select: { id: true, name: true },
            },
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                vehicleNumber: true, 
                model: true, 
              },
            },
            bookings: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rideBookings;
  } catch (error) {
    logger.error(`Error on fetching user rides: ${error}`);
    throw error;
  }
}
