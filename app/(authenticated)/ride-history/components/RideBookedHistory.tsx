"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
} from "lucide-react";
import React from "react";
import { getUserRideBookings } from "../actions";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";

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
    case "Confirmed":
      return "text-gray-400";
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
    case "Pending":
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
    // isRefetching: isRideBookingsRefetching,
    // isRefetchError: isRideBookingsRefetchingError,
    // refetch: refetchRideBookings,
  } = useQuery({
    queryKey: ["ride-bookings"],
    queryFn: getUserRideBookings,
  });

  if (isRideBookingsFetchingError) {
    console.error(rideBookingsFetchingError);
  }

  const handleCompleteRide = (bookingId: string) => {
    console.log(bookingId);
  };

  const handleCancelBooking = (bookingId: string) => {
    console.log(bookingId);
  };

  const handleOpenChat = (bookingId: string) => {
    console.log(bookingId);
  };

  if (isRideBookingsFetching) {
    return <div>Loading should be implemented</div>;
  }

  console.log("rideBooking", rideBookings);

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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rideBooking.status === "Confirmed" &&
                    rideBooking.ride.status === "Active" && (
                      <Button
                        onClick={() => handleCompleteRide(rideBooking.id)}
                        className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete Ride
                      </Button>
                    )}

                  {rideBooking.status === "Confirmed" &&
                    rideBooking.ride.status === "Active" && (
                      <Button
                        onClick={() => handleOpenChat(rideBooking.id)}
                        className="px-3 py-1 h-8 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border border-blue-500/30"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    )}

                  {rideBooking.status === "Confirmed" && (
                    <Button
                      onClick={() => handleCancelBooking(rideBooking.ride.id)}
                      className="px-3 py-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30"
                    >
                      Cancel Booking
                    </Button>
                  )}
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
