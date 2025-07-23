"use client";

import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldX,
  UserCircle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { denyRideBooking, getUserRides } from "../actions";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { toast } from "sonner";
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
    default:
      return "";
  }
};

/**
 * Get the color of the booking status
 */
const getBookingStatusColor = (status: PublicRideBookingStatus) => {
  switch (status) {
    case "Active":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Confirmed":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Denied":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

/**
 * Get icons for Booking status
 */
const getBookingStatusIcon = (status: PublicRideBookingStatus) => {
  switch (status) {
    case "Confirmed":
      return <ShieldCheck className="h-3 w-3 mr-1" />;
    case "Denied":
      return <ShieldX className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
};

// Shimmer component for a single ride card
const RideCardShimmer = () => {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
      <div className="flex flex-col gap-3">
        {/* Shimmer for ride location and status */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full" />
              <div className="h-4 w-24 bg-gray-600/50 rounded" />
            </div>
            <div className="hidden sm:inline h-4 w-4 bg-gray-600/50 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full" />
              <div className="h-4 w-24 bg-gray-600/50 rounded" />
            </div>
          </div>

          {/* Shimmer for date, time, and status */}
          <div className="flex flex-wrap gap-3">
            <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
            <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
            <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
          </div>
        </div>

        {/* Shimmer for buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
          <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
          <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
        </div>

        {/* Shimmer for ride bookings */}
        <div className="mt-2 pt-3 border-t border-white/10">
          <div className="h-4 w-24 bg-gray-600/50 rounded mb-2" />
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-600/50 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-600/50 rounded" />
                  <div className="h-4 w-16 bg-gray-600/50 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="h-8 w-20 bg-gray-600/50 rounded-md flex-1 sm:flex-initial" />
                <div className="h-8 w-20 bg-gray-600/50 rounded-md flex-1 sm:flex-initial" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreatedRideHistory = () => {
  // Fetch user's created rides via react-query
  const {
    data: createdRides = [],
    isLoading: isCreatedRidesFetching,
    isError: isCreatedRidesFetchingError,
    error: createdRidesFetchingError,
    isRefetching: isCreatedRidesRefetching,
    isRefetchError: isCreatedRidesRefetchingError,
    refetch: refetchCreatedRides,
  } = useQuery({
    queryKey: ["created-rides"],
    queryFn: getUserRides,
  });

  // Hook for denied ride booking
  const {
    mutateAsync: mutateDenyRideBooking,
    isPending: isDenyRideBookingPending,
  } = useMutation({
    mutationFn: (bookingId: string) => {
      return denyRideBooking(bookingId);
    },
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Ride Booking denied successfully");
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  if (isCreatedRidesFetchingError) {
    console.error(createdRidesFetchingError);
  }

  if (isCreatedRidesRefetching) {
    console.error(isCreatedRidesRefetchingError);
  }

  /**
   * Handle deny ride booking
   */
  const handleDenyRideBooking = async (bookingId: string) => {
    if (isDenyRideBookingPending) {
      return true;
    }

    await mutateDenyRideBooking(bookingId);
    refetchCreatedRides();
  };

  if (
    isCreatedRidesFetching ||
    isCreatedRidesRefetching ||
    isDenyRideBookingPending
  ) {
    return (
      <ScrollArea className="h-[500px] w-full px-4 pb-4">
        <div className="space-y-3">
          {/* Render multiple shimmer cards to simulate loading */}
          {Array.from({ length: 3 }).map((_, index) => (
            <RideCardShimmer key={index} />
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[500px] w-full px-4 pb-4">
      <div className="space-y-3">
        {createdRides.length > 0 ? (
          createdRides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                        <p className="font-medium">
                          {ride.startingLocation?.name}
                        </p>
                      </div>
                      <span className="hidden sm:inline mx-1">→</span>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-red-400 mr-1" />
                        <p className="font-medium">
                          {ride.destinationLocation?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                    <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                      <Calendar className="h-3 w-3 mr-1 opacity-70" />
                      {utcIsoToLocalDate(ride.startingTime)}
                    </div>
                    <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                      <Clock className="h-3 w-3 mr-1 opacity-70" />
                      {utcIsoToLocalTime12(ride.startingTime)}
                    </div>
                    <div
                      className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(
                        ride.status
                      )}`}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {ride.status}
                    </div>
                  </div>
                </div>

                {ride.bookings && ride.bookings.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-white/10">
                    <p className="text-sm font-medium mb-2">Ride Bookings</p>
                    <div className="space-y-3">
                      {ride.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border border-emerald-600/30 flex justify-center items-center">
                              <UserCircle className="h-5 w-5" />
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {booking.user.name || booking.user.email}
                              </p>
                              <Badge
                                className={`mt-1.5 text-xs px-2 py-0.5 border ${getBookingStatusColor(
                                  booking.status
                                )} flex w-fit items-center`}
                                variant="outline"
                              >
                                {getBookingStatusIcon(booking.status)}
                                {booking.status}
                              </Badge>
                            </div>
                          </div>

                          {booking.status === "Confirmed" && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                onClick={() =>
                                  handleDenyRideBooking(booking.id)
                                }
                                className="bg-red-500/20 hover:bg-red-500/40 text-xs border border-red-500/30 text-red-300 flex-1 sm:flex-initial"
                                size="sm"
                              >
                                <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-gray-400 mt-2">
              No created rides in the past 7 days
            </p>
            <p className="text-xs text-gray-500">
              Your recent created rides will appear here
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default CreatedRideHistory;
