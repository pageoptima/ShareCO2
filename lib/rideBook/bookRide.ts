import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideBookingStatus, RideStatus } from "@prisma/client";

/**
 * Book a ride for a user
 */
export async function bookRide(
    {
        userId,
        rideId,
    } : {
        userId: string,
        rideId: string
    }
) {
    try {
        // Check if the ride exists and is available
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: { bookings: true },
        });

        if ( ! ride ) {
            throw new Error( 'Ride not found' );
        }

        const now = new Date();
        if ( ride.status !== RideStatus.Pending || ride.startingTime <= now ) {
            throw new Error( 'Ride is not available for booking' );
        }

        // Check confirmed bookings for seat availability (first-come-first-serve)
        const confirmedBookings = ride.bookings.filter(booking => booking.status === RideBookingStatus.Confirmed).length;
        if (confirmedBookings >= ride.maxPassengers) {
            throw new Error( 'Ride has reached maximum passenger capacity' );
        }

        // Check if the user has already booked this ride
        const existingBooking = await prisma.rideBooking.findUnique({
            where: { rideId_userId: { rideId, userId } },
        });

        if (existingBooking) {
            throw new Error( 'You have already booked this ride' );
        }

        // Check if the user has an active ride - can only book a new ride if previous rides are completed
        const activeBookings = await prisma.rideBooking.findMany({
            where: {
                userId,
                status: {
                    in: [ RideBookingStatus.Confirmed, RideBookingStatus.Pending]
                },
                ride: {
                    status: RideStatus.Active
                }
            },
        });

        if (activeBookings.length > 0) {
            throw new Error( 'You have an active ride. Please complete it before booking a new one.' );
        }

        // Note: Carbon points will be deducted only when the ride is completed, not at booking time

        // Create a new booking in a transaction (no carbon points deduction at booking time)
        await prisma.$transaction(async (tx) => {

            // Double-check seat availability within transaction to prevent race conditions
            const currentRide = await tx.ride.findUnique({
                where: { id: rideId },
                include: {
                    bookings: {
                        where: { status: RideBookingStatus.Confirmed }
                    }
                },
            });

            // Check ride existence,
            if ( ! currentRide ) {
                throw new Error( 'Ride not found' );
            }

            // Check for passenger capacity
            if (currentRide.bookings.length >= currentRide.maxPassengers) {
                throw new Error( 'Ride has reached maximum passenger capacity' );
            }

            // Create the booking with automatic confirmation (first-come-first-serve)
            await tx.rideBooking.create({
                data: {
                    rideId,
                    userId,
                    status: RideBookingStatus.Confirmed, // Automatically confirm if seats are available
                },
            });
        });

        return true;

    } catch ( error: any ) {
        logger.error( `Error booking ride: ${error}` );
        throw error;
    }
}