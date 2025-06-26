'use server'

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createRideRequest(
  startingPoint: string,
  destination: string,
  startingTime: string
) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return {
        success: false,
        message: 'You must be signed in to request a ride'
      };
    }

    const userId = session.user.id;

    // Parse the time
    const [hours, minutes] = startingTime.split(':').map(Number);
    
    // Create a date object for today with the specified time
    const today = new Date();
    const requestDatetime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes
    );

    // Check if the time is at least 2 hours from now
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    
    if (requestDatetime < twoHoursFromNow) {
      return {
        success: false,
        message: 'Ride request time must be at least 2 hours from now'
      };
    }

    // Get today's date range for queries
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check for duplicate ride request with same start, destination and time from the SAME user
    const duplicateRequest = await prisma.rideRequest.findFirst({
      where: {
        userId: userId,
        startingPoint: startingPoint,
        destination: destination,
        startingTime: requestDatetime,
        status: 'Pending',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (duplicateRequest) {
      return {
        success: false,
        message: 'You already have a ride request with the same details'
      };
    }

    // Check if user already has a created ride or booking for today
    const existingRide = await prisma.ride.findFirst({
      where: {
        driverId: userId,
        status: { not: 'Cancelled' },
        startingTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingRide) {
      return {
        success: false,
        message: 'You already have a ride created for today'
      };
    }

    const existingBooking = await prisma.rideBooking.findFirst({
      where: {
        userId,
        status: { not: 'Canceled' },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        ride: true,
      },
    });

    if (existingBooking) {
      return {
        success: false,
        message: 'You already have a ride booked for today'
      };
    }

    // Create the ride request in the database
    const rideRequest = await prisma.rideRequest.create({
      data: {
        userId,
        startingPoint,
        destination,
        startingTime: requestDatetime,
        status: 'Pending',
      },
    });

    // Revalidate the book ride page
    revalidatePath('/book-ride');
    
    return { 
      success: true, 
      message: 'Ride request created successfully',
      data: rideRequest
    };
  } catch (error) {
    console.error('Error creating ride request:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.'
    };
  }
} 