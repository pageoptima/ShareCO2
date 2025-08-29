import {
  RideBookingStatus,
  RideStatus,
  TransactionType,
  VehicleType,
} from "@prisma/client";

export type PublicRideStatus = RideStatus;

export type PublicRideBookingStatus = RideBookingStatus;

export type PublicTransactionType = TransactionType;

export interface PublicUserRides {
  id: string;
  status: PublicRideStatus;
  startingTime: Date;
  carbonCost: number;
  cePointsEarned: number;
  vehicle: {
    model: string | null;
    id: string;
    type: VehicleType;
  } | null;
  startingLocation: {
    name: string;
    id: string;
  } | null;
  destinationLocation: {
    name: string;
    id: string;
  } | null;
  bookings: {
    id: string;
    status: PublicRideBookingStatus;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }[];
}
// types.ts
export interface PublicUserRideBookings {
  id: string;
  status: PublicRideBookingStatus;
  userId: string;
  cePointsEarned: number; // Moved cePointsEarned to top-level RideBooking
  ride: {
    id: string;
    startingTime: Date;
    status: PublicRideStatus;
    startingLocation: {
      id: string;
      name: string;
    } | null;
    destinationLocation: {
      id: string;
      name: string;
    } | null;
    driver: {
      id: string;
      name: string | null;
      phone: string | null;
    };
    vehicle: {
      id: string;
      vehicleNumber: string | null;
      model: string | null;
    } | null;
    bookings: {
      id: string;
      user: {
        id: string;
        name: string | null;
      };
    }[];
  };
}

export interface PublicTransactions {
  id: string;
  createdAt: Date;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
}