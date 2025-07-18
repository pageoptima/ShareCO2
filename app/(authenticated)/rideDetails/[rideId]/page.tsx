"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Car } from "lucide-react";
import { getRideDetails } from "../actions";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { toast } from "sonner";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";

// Shimmer Component for Loading State
const Loading = () => (
  <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
    <CardHeader>
      <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Overview Section */}
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-48 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-64 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-56 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-600/50 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-4 w-28 bg-gray-600/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Driver Section */}
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-600/50 rounded animate-pulse" />
            <div className="h-4 w-36 bg-gray-600/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Passengers Section */}
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse mb-2" />
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="p-2 bg-white/5 rounded border border-white/10"
                >
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-600/50 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-gray-600/50 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-gray-600/50 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-600/50 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-600/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </CardContent>
  </Card>
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
    case "Active":
      return "text-emerald-400";
    case "Confirmed":
      return "text-teal-400";
    case "CancelledUser":
      return "text-red-400";
    case "CancelledDriver":
      return "text-orange-400";
    case "Completed":
      return "text-blue-400";
    case "Denied":
      return "text-gray-400";
    default:
      return "";
  }
};

const RideDetailsPage = () => {
  const params = useParams();
  const rideId = params.rideId as string;

  const {
    data: ride,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ride-details", rideId],
    queryFn: () => getRideDetails(rideId),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error(error);
    toast.error("Failed to load ride details");
    return <div>Error loading ride details</div>;
  }

  if (!ride) {
    return <div>Ride not found</div>;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Ride Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Ride Overview */}
          <div>
            <h3 className="text-sm font-medium text-gray-300">Overview</h3>
            <div className="mt-2 space-y-2 text-gray-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {utcIsoToLocalDate(ride.startingTime)}{" "}
                  {utcIsoToLocalTime12(ride.startingTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  From: {ride.startingLocation?.name || "N/A"} → To:{" "}
                  {ride.destinationLocation?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gray-400" />
                <span>
                  Vehicle:{" "}
                  {ride.vehicle
                    ? `${ride.vehicle.type} (${ride.vehicle.model}) - ${ride.vehicle.vehicleNumber}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Status: </span>
                <Badge
                  className={`text-white ${getStatusColor(ride.status)}`}
                  variant="outline"
                >
                  {ride.status}
                </Badge>
              </div>
              <div>Carbon Cost: {ride.carbonCost.toFixed(2)} CP</div>
              <div>Max Passengers: {ride.maxPassengers}</div>
            </div>
          </div>

          {/* Driver Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-300">Driver</h3>
            <div className="mt-2 text-gray-200">
              <p>Name: {ride.driver.name || "N/A"}</p>
              <p>Email: {ride.driver.email}</p>
              <p>Phone: {ride.driver.phone || "N/A"}</p>
            </div>
          </div>

          {/* Bookings */}
          <div>
            <h3 className="text-sm font-medium text-gray-300">Passengers</h3>
            <ScrollArea className="h-[150px] mt-2 pb-16">
              {ride.bookings.length > 0 ? (
                <div className="space-y-2">
                  {ride.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-2 bg-white/5 rounded border border-white/10"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-gray-200">
                            {booking.user.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.user.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Phone: {booking.user.phone || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`text-white ${getBookingStatusColor(
                              booking.status
                            )}`}
                            variant="outline"
                          >
                            {booking.status}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            Carbon Cost: {booking.carbonCost.toFixed(2)} CP
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No passengers found</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideDetailsPage;
