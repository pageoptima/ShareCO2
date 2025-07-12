"use server";

import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/lib/user/userServices";
import { requestTopUp as requestTopUpDb } from "@/lib/transaction/requestTopUp";
import { getUserTransactions } from "@/lib/transaction/transactionServices";
import {
  activateRide,
  getUserRides as getUserRidesDb,
} from "@/lib/ride/rideServices";
import {
  getUserRideBookings as getUserRideBookingsDb,
  cancleRideBookingByDriverOnPurpose,
  activateRideBooking as activateRideBookingDb,
  cancleRideBookingByUser,
} from "@/lib/rideBook/rideBookServices";
import { cancelRide as cancelRideDb } from "@/lib/ride/rideServices";
import { completeRide as completeRideDb } from "@/lib/ride/rideServices";
import {
  PublicUserRides,
  PublicUserRideBookings,
  PublicTransactions,
} from "./types";

/**
 * Get the carbon point of the user
 * @returns
 */
export async function getCarbonPoint(): Promise<number> {
  // Get authenticated user
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to view your carbon point");
  }

  // Get user's data
  const user = await getUserById(session.user.id);

  return user.carbonPoints;
}

/**
 * Submit a top-up request for carbon points
 */
export async function requestTopUp(amount: number) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const success = await requestTopUpDb({
    userId: session.user.id,
    amount: amount,
  });

  return success;
}

/**
 * Get all transactions for a user
 */
export async function getTransactions(): Promise<PublicTransactions[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const transactions = await getUserTransactions(session.user.id);

  return transactions;
}

/**
 * Get created rides
 */
export async function getUserRides(): Promise<PublicUserRides[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const userRides = await getUserRidesDb(session.user.id);

  return userRides;
}

/**
 * Get user ride booking
 */
export async function getUserRideBookings(): Promise<PublicUserRideBookings[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const userRides = await getUserRideBookingsDb(session.user.id);

  return userRides;
}

/**
 * Cancel a ride
 */
export async function cancelRide(rideId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await cancelRideDb({
    userId: session.user.id,
    rideId: rideId,
  });

  return success;
}

/**
 * Start a ride
 */
export async function startRide(rideId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await activateRide({
    userId: session.user.id,
    rideId: rideId,
  });

  return success;
}

/**
 * Complete a ride
 */
export async function completeRide(rideId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await completeRideDb({
    userId: session.user.id,
    rideId: rideId,
  });

  return success;
}

/**
 * Cancell a ridebooking by champion
 */
export async function denyRideBooking(bookingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await cancleRideBookingByDriverOnPurpose({
    driverId: session.user.id,
    bookingId: bookingId,
  });

  return success;
}

/**
 * Activate a ridebooking by rider
 */
export async function activateRideBooking(bookingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await activateRideBookingDb({
    userId: session.user.id,
    bookingId: bookingId,
  });

  return success;
}

/**
 * Cancle a ridebooking by rider
 */
export async function cancleRideBooking(bookingId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const success = await cancleRideBookingByUser({
    userId: session.user.id,
    bookingId: bookingId,
  });

  return success;
}
