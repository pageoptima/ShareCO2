import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
} from "lucide-react";
import React from "react";
import {
  activateRideBooking,
  cancleRideBooking,
  getUserRideBookings,
} from "../actions";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { toast } from "sonner";

// Shimmer Component for Loading State
const ShimmerCard = () => (
  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-pulse">
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-600/50 rounded-full mr-1" />
            <div className="h-4 w-32 bg-gray-600/50 rounded" />
          </div>
          <span className="hidden sm:inline mx-1">→</span>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-600/50 rounded-full mr-1" />
            <div className="h-4 w-32 bg-gray-600/50 rounded" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-24 bg-gray-600/50 rounded-3xl" />
          <div className="h-6 w-24 bg-gray-600/50 rounded-3xl" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-8 w-24 bg-gray-600/50 rounded" />
        <div className="h-8 w-24 bg-gray-600/50 rounded" />
        <div className="h-8 w-20 bg-gray-600/50 rounded" />
      </div>
    </div>
  </div>
);

// ... (rest of the imports and functions remain unchanged)

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
    refetch: refetchRideBookings,
  } = useQuery({
    queryKey: ["ride-bookings"],
    queryFn: getUserRideBookings,
  });

  if (isRideBookingsFetchingError || isRideBookingsRefetchingError) {
    console.error(rideBookingsFetchingError);
  }

  // Hook for confirm reach
  const { mutateAsync: mutateConfirmReach, isPending: isConfirmReachPending } =
    useMutation({
      mutationFn: (bookingId: string) => {
        return activateRideBooking(bookingId);
      },
      onSuccess: async () => {
        toast.success("Ride booking activated");
        refetchRideBookings();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Hook for cancel booking
  const {
    mutateAsync: mutateCancleBooking,
    isPending: isCancleBookingPending,
  } = useMutation({
    mutationFn: (bookingId: string) => {
      return cancleRideBooking(bookingId);
    },
    onSuccess: async () => {
      toast.success("Ride booking canceled successfully");
      refetchRideBookings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /**
   * Confirm Reach handler
   */
  const handleConfirmReach = async (bookingId: string) => {
    if (isConfirmReachPending) {
      return true;
    }
    await mutateConfirmReach(bookingId);
  };

  /**
   * Cancel Ride booking
   */
  const handleCancelBooking = async (bookingId: string) => {
    if (isCancleBookingPending) {
      return true;
    }

    await mutateCancleBooking(bookingId);
  };

  const handleOpenChat = (bookingId: string) => {
    console.log(bookingId);
  };

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
                        className={`flex items nacimiento-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(
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
                  {rideBooking.status === "Confirmed" && (
                    <Button
                      onClick={() => handleConfirmReach(rideBooking.id)}
                      className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirm Reach
                    </Button>
                  )}

                  {rideBooking.status === "Confirmed" && (
                    <Button
                      onClick={() => handleCancelBooking(rideBooking.id)}
                      className="px-3 py-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30"
                    >
                      Cancel Booking
                    </Button>
                  )}

                  {(rideBooking.status === "Confirmed" ||
                    rideBooking.status === "Active") && (
                    <Button
                      onClick={() => handleOpenChat(rideBooking.id)}
                      className="px-3 py-1 h-8 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border border-blue-500/30"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat
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
