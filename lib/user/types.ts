import { User, Transaction, Ride, RideBooking, Vehicle } from "@prisma/client";

export type CompleteUserType = User & {
    transactions: Transaction[];
    createdRides: Array<Ride & {
        bookings: Array<RideBooking & {
            user: { email: string }
        }>
    }>;
    bookedRides: Array<RideBooking & {
        ride: Ride;
    }>;
    vehicles: Vehicle[];
};
