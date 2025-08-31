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
      phone: string | null;
      imageUrl: string | null;
    };
  }[];
}

export interface PublicUserRideBookings {
  id: string;
  status: PublicRideBookingStatus;
  userId: string;
  ride: {
    id: string;
    status: PublicRideStatus;
    startingTime: Date;
    startingLocation?: {
      id: string;
      name: string;
    };
    destinationLocation?: {
      id: string;
      name: string;
    };
    driver: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      imageUrl: string | null;
    };
    vehicle?: {
      id: string;
      vehicleNumber: string;
      model: string;
    };
    bookings: {
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        imageUrl: string | null;
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