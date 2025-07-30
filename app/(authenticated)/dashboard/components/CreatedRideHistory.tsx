"use client";

import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShieldX,
  UserCircle,
  Phone,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRide,
  completeRide,
  denyRideBooking,
  getUserRides,
  startRide,
  activateRideBookingByChampion,
} from "../actions";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { toast } from "sonner";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { RideChatModal } from "@/app/_components/modals/RideChatModal/RideChatModal";
import { CancelRideModal } from "@/app/_components/modals/CancelRideModal";

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

/**
 * Check if threshold time for cancellation has passed
 */
const isThresholdTimePassed = (startTime: string): boolean => {
  const rideThresholdMinutes = Number(
    process.env.NEXT_PUBLIC_RIDE_THRESHOLD_TIME
  );
  const startDate = new Date(startTime);
  const currentDate = new Date();
  const diffInMinutes =
    (startDate.getTime() - currentDate.getTime()) / (1000 * 60);
  return diffInMinutes <= rideThresholdMinutes;
};

/**
 * Check if the ride start time has passed
 */
const isStartTimePassed = (startTime: string): boolean => {
  const startDate = new Date(startTime);
  const currentDate = new Date();
  return currentDate >= startDate;
};

const CreatedRideHistory = () => {
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Cancellation charge constant
  const CANCELLATION_CHARGE = Number(
    process.env.NEXT_PUBLIC_RIDE_CANCELLATION_CHARGE_CHAMPION
  );

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

  // Hook for cancelled ride
  const { mutateAsync: mutateCancellRide, isPending: isCancellRidePending } =
    useMutation({
      mutationFn: (rideId: string) => cancelRide(rideId),
      onSuccess: async (result) => {
        if (result.success) {
          toast.success("Ride cancelled successfully");
          await queryClient.invalidateQueries({ queryKey: ["carbonpoint"] });
        } else {
          toast.error(result.error);
        }
      },
      onError: (error) => {
        console.error(error.message);
      },
    });

  // Hook for start ride
  const { mutateAsync: mutateStartRide, isPending: isStartRidePending } =
    useMutation({
      mutationFn: (rideId: string) => startRide(rideId),
      onSuccess: async (result) => {
        if (result.success) {
          toast.success("Ride started successfully");
        } else {
          toast.error(result.error);
        }
      },
      onError: (error) => {
        console.error(error.message);
      },
    });

  // Hook for complete ride
  const { mutateAsync: mutateCompleteRide, isPending: isCompleteRidePending } =
    useMutation({
      mutationFn: (rideId: string) => completeRide(rideId),
      onSuccess: async (result) => {
        if (result.success) {
          toast.success("Ride completed successfully");
          await queryClient.invalidateQueries({ queryKey: ["carbonpoint"] });
        } else {
          toast.error(result.error);
        }
      },
      onError: (error) => {
        console.error(error.message);
      },
    });

  // Hook for denied ride booking
  const {
    mutateAsync: mutateDenyRideBooking,
    isPending: isDenyRideBookingPending,
  } = useMutation({
    mutationFn: (bookingId: string) => denyRideBooking(bookingId),
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Ride booking denied successfully");
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  // Hook for confirm reach by champion
  const { mutateAsync: mutateConfirmReach, isPending: isConfirmReachPending } =
    useMutation({
      mutationFn: (bookingId: string) =>
        activateRideBookingByChampion(bookingId),
      onSuccess: async (result) => {
        if (result.success) {
          toast.success("Rider reach confirmed successfully by Champion");
          refetchCreatedRides();
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

  if (isCreatedRidesRefetchingError) {
    console.error(createdRidesFetchingError);
  }

  /**
   * Handle confirm reach by champion
   */
  const handleConfirmReach = async (bookingId: string) => {
    if (isConfirmReachPending) return;
    await mutateConfirmReach(bookingId);
  };

  /**
   * Handle cancel ride
   */
  const handleCancelRide = (rideId: string) => {
    setRideToCancel(rideId);
    setIsCancelModalOpen(true);
  };

  /**
   * Confirm cancel ride
   */
  const confirmCancelRide = async () => {
    if (!rideToCancel) return;
    await mutateCancellRide(rideToCancel);
    refetchCreatedRides();
    setIsCancelModalOpen(false);
    setRideToCancel(null);
  };

  /**
   * Handle start ride
   */
  const handleStartRide = async (rideId: string) => {
    if (isStartRidePending) return;
    await mutateStartRide(rideId);
    refetchCreatedRides();
  };

  /**
   * Handle complete ride
   */
  const handleCompleteRide = async (rideId: string) => {
    if (isCompleteRidePending) return;
    await mutateCompleteRide(rideId);
    refetchCreatedRides();
  };

  /**
   * Handle deny ride booking
   */
  const handleDenyRideBooking = async (bookingId: string) => {
    if (isDenyRideBookingPending) return;
    await mutateDenyRideBooking(bookingId);
    refetchCreatedRides();
  };

  /**
   * Handle open chat
   */
  const handleOpenChat = (bookingId: string) => {
    setSelectedRideId(bookingId);
    setIsChatOpen(true);
  };

  /**
   * Handle close chat
   */
  const handleCloseChat = () => {
    setSelectedRideId(null);
    setIsChatOpen(false);
  };

  if (
    isCreatedRidesFetching ||
    isCreatedRidesRefetching ||
    isCancellRidePending ||
    isCompleteRidePending ||
    isDenyRideBookingPending
  ) {
    return (
      <ScrollArea className="h-[500px] w-full px-4 pb-4">
        <div className="space-y-3">
          {/* Render 3 skeleton cards to mimic ride cards */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-pulse"
            >
              <div className="flex flex-col gap-3">
                {/* Location and Status Section */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <div className="h-4 w-32 bg-gray-600/50 rounded" />
                    </div>
                    <span className="hidden sm:inline mx-1">→</span>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <div className="h-4 w-32 bg-gray-600/50 rounded" />
                    </div>
                  </div>

                  {/* Date, Time, and Status Badges */}
                  <div className="flex flex-wrap gap-3">
                    <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
                    <div className="h-6 w-20 bg-gray-600/50 rounded-3xl" />
                    <div className="h-6 w-24 bg-gray-600/50 rounded-3xl" />
                  </div>
                </div>

                {/* Button Section */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
                  <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
                  <div className="h-8 w-20 bg-gray-600/50 rounded-md" />
                </div>

                {/* Booking Section */}
                <div className="pt-3 border-t border-white/10">
                  <div className="h-4 w-24 bg-gray-600/50 rounded mb-2" />
                  <div className="space-y-3">
                    {/* Simulate 2 booking placeholders */}
                    {Array.from({ length: 2 }).map((_, bookingIndex) => (
                      <div
                        key={bookingIndex}
                        className="bg-white/5 rounded-xl p-3 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-600/50 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-36 bg-gray-600/50 rounded" />
                            <div className="h-4 w-20 bg-gray-600/50 rounded" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <div className="h-8 w-24 bg-gray-600/50 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <>
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

                  <div className="flex flex-wrap items-center gap-2">
                    {ride.status === "Pending" && (
                      <Button
                        onClick={() => handleStartRide(ride.id)}
                        className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30 cursor-pointer"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Start Ride
                      </Button>
                    )}
                    {ride.status === "Active" && (
                      <Button
                        onClick={() => handleCompleteRide(ride.id)}
                        className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30 cursor-pointer"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete Ride
                      </Button>
                    )}
                    {ride.status === "Pending" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelRide(ride.id)}
                        className="px-3 py-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30 cursor-pointer"
                      >
                        Cancel Ride
                      </Button>
                    )}
                    {(ride.status === "Pending" ||
                      ride.status === "Active" ||
                      ride.status === "Completed") && (
                      <Button
                        onClick={() => handleOpenChat(ride.id)}
                        className="px-3 py-1 h-8 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border border-blue-500/30 cursor-pointer"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    )}
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
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <Badge
                                    className={`text-xs px-2 py-0.5 border ${getBookingStatusColor(
                                      booking.status
                                    )} flex w-fit items-center`}
                                    variant="outline"
                                  >
                                    {getBookingStatusIcon(booking.status)}
                                    {booking.status}
                                  </Badge>
                                  {booking.user.phone && (
                                    <a
                                      href={`tel:${booking.user.phone}`}
                                      className="flex items-center text-xs text-gray-300 hover:text-gray-100"
                                    >
                                      <Phone className="h-3 w-3 mr-1 opacity-70" />
                                      <span>{booking.user.phone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            {booking.status === "Confirmed" && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  onClick={() =>
                                    handleDenyRideBooking(booking.id)
                                  }
                                  className="bg-red-500/20 hover:bg-red-500/40 text-xs border border-red-500/30 text-red-300 sm:flex-initial cursor-pointer"
                                  size="sm"
                                >
                                  <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                                  Reject
                                </Button>
                                {isStartTimePassed(
                                  ride.startingTime.toISOString()
                                ) && (
                                  <Button
                                    onClick={() =>
                                      handleConfirmReach(booking.id)
                                    }
                                    className="bg-emerald-500/20 hover:bg-emerald-500/40 text-xs border border-emerald-500/30 text-emerald-300 sm:flex-initial cursor-pointer"
                                    size="sm"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Confirm Reach
                                  </Button>
                                )}
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

      {isChatOpen && (
        <RideChatModal
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          rideId={selectedRideId as string}
          isActive={true}
        />
      )}

      {isCancelModalOpen && (
        <CancelRideModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setRideToCancel(null);
          }}
          onConfirm={confirmCancelRide}
          isPending={isCancellRidePending}
          amount={CANCELLATION_CHARGE}
          isThresholdPassed={
            rideToCancel
              ? isThresholdTimePassed(
                  createdRides
                    .find((ride) => ride.id === rideToCancel)
                    ?.startingTime?.toISOString() || new Date().toISOString()
                )
              : false
          }
        />
      )}
    </>
  );
};

export default CreatedRideHistory;
