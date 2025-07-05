import { prisma } from "@/config/prisma";
import { RideBookingStatus } from "@prisma/client";

export async function confirmRideBooking(
    {
        userId,
        bookingId,
    } : {
        userId: string,
        bookingId: string,
    }
) {
    // Find the booking and verify the driver is the ride owner
    const booking = await prisma.rideBooking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
    });

    if (!booking) {
        throw new Error( 'Booking not found' );
    }

    if ( booking.ride.driverId !== userId ) {
        throw new Error( 'You are not authorized to manage this booking' );
    }

    await prisma.rideBooking.update({
        where: { id: bookingId },
        data: { status: RideBookingStatus.Confirmed },
    });

    return true;
}