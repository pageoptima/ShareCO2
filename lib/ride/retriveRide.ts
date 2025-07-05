import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { RideBookingStatus, RideStatus } from "@prisma/client";

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
                gt: nowUTC // Only future rides (not past current time)
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
                        in: [
                            RideBookingStatus.Pending,
                            RideBookingStatus.Confirmed,
                        ]
                    } // Only count pending and confirmed bookings
                }
            },
        },
        orderBy: {
            startingTime: "asc" // Order by time ascending (earliest first)
        }
    });

    return rides
        .filter(ride => {

            // Check if user has already booked this ride (any status)
            const userHasBooked = ride.bookings.some(booking => booking.userId === userId);
            if (userHasBooked) {
                return false; // Exclude rides already booked by user
            }

            // Additional filter to ensure seats are available
            const confirmedBookings = ride.bookings.filter(booking => booking.status === RideBookingStatus.Confirmed).length;
            return ride.maxPassengers > confirmedBookings; // Only show rides with available seats
        })
        .map((ride) => {

            const confirmedBookings = ride.bookings.filter(booking => booking.status === RideBookingStatus.Confirmed).length;

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
                    select: { id: true, name: true }
                },
                destinationLocation: {
                    select: { id: true, name: true }
                },
                vehicle: {
                    select: { id: true, type: true, model: true }
                },
                bookings: {
                    include: { user: true }
                }
            },
            orderBy: {
                startingTime: "asc"
            },
            take: limit,
        });

        return rides;
    } catch (error: any) {
        logger.error(`Error on fetching user rides: ${error}`)
        throw error;
    }
}