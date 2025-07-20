"use server";

import { auth } from "@/lib/auth/auth";
import { requestTopUp as requestTopUpDb } from "@/lib/transaction/requestTopUp";
import { getUserTransactions } from "@/lib/transaction/transactionServices";
import {
  activateRide,
  getUserRides as getUserRidesDb,
} from "@/lib/ride/rideServices";
import {
  cancleRideBookingByDriverOnPurpose,
  activateRideBooking as activateRideBookingDb,
  cancleRideBookingByUser,
  getUserRideBookingsDb,
} from "@/lib/rideBook/rideBookServices";
import { cancelRide as cancelRideDb } from "@/lib/ride/rideServices";
import { completeRide as completeRideDb } from "@/lib/ride/rideServices";
import { PublicUserRides, PublicTransactions } from "./types";

import { getWalletByUserId } from "@/lib/wallet/walletServices";
import { getUserById, updateFcmTokenDb } from "@/lib/user/userServices";

/**
 * Submit a top-up request for carbon points
 */
export async function requestTopUp(amount: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const success = await requestTopUpDb({
      userId: session.user.id,
      amount: amount,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
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
 * Get user ride bookings
 */
export async function getUserRideBookings() {
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
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await cancelRideDb({
      userId: session.user.id,
      rideId: rideId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Start a ride
 */
export async function startRide(rideId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await activateRide({
      userId: session.user.id,
      rideId: rideId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Complete a ride
 */
export async function completeRide(rideId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await completeRideDb({
      userId: session.user.id,
      rideId: rideId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Cancell a ridebooking by champion
 */
export async function denyRideBooking(bookingId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await cancleRideBookingByDriverOnPurpose({
      driverId: session.user.id,
      bookingId: bookingId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Activate a ridebooking by rider
 */
export async function activateRideBooking(bookingId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await activateRideBookingDb({
      userId: session.user.id,
      bookingId: bookingId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Cancle a ridebooking by rider
 */
export async function cancleRideBooking(bookingId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const success = await cancleRideBookingByUser({
      // Changed to 'cancel' (optional)
      userId: session.user.id,
      bookingId: bookingId,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

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
  const wallet = await getWalletByUserId(session.user.id);

  //console.log(user)

  return wallet.spendableBalance + wallet.reservedBalance;
}





/**
 * Update Fcm Token in user Schema
 */

export async function updateFcmToken(fcmToken: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    await updateFcmTokenDb(session.user.id, fcmToken);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}


export async function getUserProfileStatus() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await getUserById(session.user.id);
    return { isProfileCompleted: user.isProfileCompleted };
  } catch (error) {
    console.error("Error fetching user profile status:", error);
    throw new Error("Failed to fetch user profile status");
  }
}