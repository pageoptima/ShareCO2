import { prisma } from "@/config/prisma";

export async function completeDriverRide(
    {
        userId,
        rideId,
    } : {
        userId: string,
        rideId: string,
    }
){

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

    if ( ! ride ) {
        throw new Error( "Ride not found or You're not authorized to complete this ride" );
    }

    throw new Error( 'Not implemented yet.' );

    // // Check if user is either the driver or a passenger with a confirmed booking
    // const userId = session.user.id as string;
    // const isDriver = ride.driverId === userId;
    // const isPassenger = ride.bookings.some(
    //     (booking) => booking.userId === userId && booking.status === "Confirmed"
    // );

    // if (!isDriver && !isPassenger) {
    //     throw new Error("You're not authorized to complete this ride");
    // }

    // If user is a passenger, mark their booking as completed
    // if (isPassenger) {
    //     await prisma.rideBooking.update({
    //         where: { rideId_userId: { rideId, userId } },
    //         data: { status: "Completed" },
    //     });

    //     // Check if all confirmed bookings are now completed
    //     const allBookingsCompleted = await checkAllBookingsCompleted(rideId);

    //     // If all bookings are completed, process carbon points and mark ride as completed
    //     if (allBookingsCompleted) {
    //         await processRideCarbonPoints(ride as RideWithBookings);
    //     }

    //     return { success: true, message: "Your ride has been marked as completed" };
    // }

    // If user is the driver, mark the ride as completed and process carbon points
    // if (isDriver) {
    //     // If there are no confirmed bookings, just mark as completed
    //     if (ride.bookings.filter(b => b.status === "Confirmed").length === 0) {
    //         await prisma.ride.update({
    //             where: { id: rideId },
    //             data: { status: "Completed" },
    //         });
    //         return { success: true, message: "Ride marked as completed" };
    //     }

    //     // Check if all confirmed bookings are completed
    //     const allBookingsCompleted = await checkAllBookingsCompleted(rideId);

    //     if (allBookingsCompleted) {
    //         await processRideCarbonPoints(ride as RideWithBookings);
    //         return { success: true, message: "Ride completed and carbon points processed" };
    //     }

    //     return {
    //         success: true,
    //         message: "Waiting for all passengers to mark the ride as completed"
    //     };
    // }
}