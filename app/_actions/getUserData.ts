"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Session } from "next-auth";

export async function getUserData() {
  const session = (await auth()) as Session | null;

  if (!session?.user?.email) {
    throw new Error("User not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      carbonPoints: true,
      isAdmin: true,
      disclaimerAccepted: true,
      name: true,
      email: true,
      gender: true,
      age: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      createdRides: {
        orderBy: { createdAt: "desc" },
        include: {
          bookings: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
        },
      },
      bookedRides: {
        orderBy: { createdAt: "desc" },
        include: {
          ride: true,
        },
      },
      vehicles: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    carbonPoints: user.carbonPoints,
    isAdmin: user.isAdmin || false,
    disclaimerAccepted: user.disclaimerAccepted || false,
    name: user.name || undefined,
    email: user.email,
    gender: user.gender || undefined,
    age: user.age || undefined,
    transactions: user.transactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      date: txn.createdAt.toISOString().split("T")[0],
    })),
    createdRides: user.createdRides.map((ride) => ({
      id: ride.id,
      from: ride.startingPoint,
      to: ride.destination,
      date: ride.startingTime.toISOString().split("T")[0],
      time: ride.startingTime.toISOString().split("T")[1].slice(0, 5),
      status: ride.status,
      maxPassengers: ride.maxPassengers,
      startingTime: ride.startingTime.toISOString(),
      createdAt: ride.createdAt.toISOString(),
      bookings: ride.bookings.map((booking) => ({
        id: booking.id,
        userEmail: booking.user.email,
        status: booking.status,
      })),
    })),
    bookedRides: user.bookedRides.map((booking) => ({
      id: booking.ride.id,
      from: booking.ride.startingPoint,
      to: booking.ride.destination,
      date: booking.ride.startingTime.toISOString().split("T")[0],
      time: booking.ride.startingTime.toISOString().split("T")[1].slice(0, 5),
      status: booking.status, // Use booking status instead of ride status
      rideStatus: booking.ride.status, // Include ride status separately
      startingTime: booking.ride.startingTime.toISOString(),
      createdAt: booking.createdAt.toISOString(), // Use booking creation time
      bookingId: booking.id, // Include booking ID for cancellation
    })),
    vehicles: user.vehicles.map((vehicle) => ({
      id: vehicle.id,
      type: vehicle.type,
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model || undefined,
    })),
  };
}