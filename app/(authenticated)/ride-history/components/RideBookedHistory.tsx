"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Clock, MapPin, Leaf } from "lucide-react"; // Added Leaf icon
import React from "react";
import { getUserRideBookings } from "../actions";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";

// Shimmer Component for Loading State
const ShimmerCard = () => (
  <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-pulse">
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center w-full sm:w-auto">
            <div className="h-4 w-4 bg-gray-600/50 rounded-full mr-1" />
            <div className="h-4 w-full sm:w-32 bg-gray-600/50 rounded" />
          </div>
          <span className="hidden sm:inline mx-1">→</span>
          <div className="flex items-center w-full sm:w-auto">
            <div className="h-4 w-4 bg-gray-600/50 rounded-full mr-1" />
            <div className="h-4 w-full sm:w-32 bg-gray-600/50 rounded" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="h-6 w-16 sm:w-20 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-16 sm:w-20 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-20 sm:w-24 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-20 sm:w-24 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-16 sm:w-20 bg-gray-600/50 rounded-3xl" /> {/* For cePoints */}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="h-8 w-20 sm:w-24 bg-gray-600/50 rounded" />
        <div className="h-8 w-20 sm:w-24 bg-gray-600/50 rounded" />
        <div className="h-8 w-16 sm:w-20 bg-gray-600/50 rounded" />
      </div>
    </div>
  </div>
);
/**
 * Get the color of the ride status
 */
const getStatusColor = (status: PublicRideStatus) => {
  switch (status) {
    case "Active":
      return "text-emerald-400";
    case "Pending":
      return "text-amber-400";
    case "Completed":
      return "text-blue-400";
    case "Cancelled":
      return "text-red-400";
    default:
      return "";
  }
};

/**
 * Get the color of the booking status
 */
const getBookingStatusColor = (status: PublicRideBookingStatus) => {
  switch (status) {
    case "Confirmed":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Active":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Denied":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const RideBookedHistory = () => {
  // Fetch user's ride bookings via react-query
  const {
    data: rideBookings = [],
    isLoading: isRideBookingsFetching,
    isError: isRideBookingsFetchingError,
    error: rideBookingsFetchingError,
    isRefetching: isRideBookingsRefetching,
    isRefetchError: isRideBookingsRefetchingError,
  } = useQuery({
    queryKey: ["ride-bookings"],
    queryFn: getUserRideBookings,
  });

  if (isRideBookingsFetchingError || isRideBookingsRefetchingError) {
    console.error(rideBookingsFetchingError);
  }

  if (isRideBookingsFetching || isRideBookingsRefetching) {
    return (
      <ScrollArea className="h-[500px] w-full px-4 pb-4">
        <div className="space-y-3">
          {/* Render multiple shimmer cards to simulate loading */}
          {Array.from({ length: 3 }).map((_, index) => (
            <ShimmerCard key={index} />
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[500px] w-full px-4 pb-4">
      <div className="space-y-3">
        {rideBookings.length > 0 ? (
          rideBookings.map((rideBooking) => (
            <div
              key={rideBooking.id}
              className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                      <p className="font-medium">
                        {rideBooking.ride.startingLocation?.name}
                      </p>
                    </div>
                    <span className="hidden sm:inline mx-1">→</span>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-red-400 mr-1" />
                      <p className="font-medium">
                        {rideBooking.ride.destinationLocation?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                    <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                      <Calendar className="h-3 w-3 mr-1 opacity-70" />
                      {utcIsoToLocalDate(rideBooking.ride.startingTime)}
                    </div>
                    <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                      <Clock className="h-3 w-3 mr-1 opacity-70" />
                      {utcIsoToLocalTime12(rideBooking.ride.startingTime)}
                    </div>
                    <div
                      className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getBookingStatusColor(
                        rideBooking.status
                      )}`}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {rideBooking.status}
                    </div>
                    {rideBooking.ride.status && (
                      <div
                        className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(
                          rideBooking.ride.status
                        )}`}
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Ride: {rideBooking.ride.status}
                      </div>
                    )}
                    <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1 text-emerald-400">
                      <Leaf className="h-3 w-3 mr-1" />
                      {rideBooking.cePointsEarned.toFixed(2)} CEP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-gray-400 mt-2">
              No booked rides in the past 7 days
            </p>
            <p className="text-xs text-gray-500">
              Your recent booked rides will appear here
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default RideBookedHistory;