"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation"; // Add useRouter import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Car, Copy, Home } from "lucide-react"; // Add Home import
import { getRideDetails } from "../actions";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { toast } from "sonner";
import { PublicRideBookingStatus, PublicRideStatus } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// Shimmer Component for Loading State
const Loading = () => (
  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border-gray-700/20 max-w-2xl mx-auto animate-pulse">
    <CardHeader>
      <div className="h-6 w-40 bg-gray-600/50 rounded-lg" />
    </CardHeader>
    <CardContent>
      <div className="space-y-5">
        {/* Overview Section */}
        <div>
          <div className="h-5 w-28 bg-gray-600/50 rounded-lg mb-3" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full" />
              <div className="h-4 w-52 bg-gray-600/50 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full" />
              <div className="h-4 w-60 bg-gray-600/50 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full" />
              <div className="h-4 w-48 bg-gray-600/50 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-600/50 rounded" />
              <div className="h-4 w-24 bg-gray-600/50 rounded-lg" />
            </div>
            <div className="h-4 w-32 bg-gray-600/50 rounded-lg" />
            <div className="h-4 w-28 bg-gray-600/50 rounded-lg" />
          </div>
        </div>

        {/* Driver Section */}
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded-lg mb-2" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-gray-600/50 rounded-lg" />
            <div className="h-4 w-48 bg-gray-600/50 rounded-lg" />
            <div className="h-4 w-36 bg-gray-600/50 rounded-lg" />
          </div>
        </div>

        {/* Passengers Section */}
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded-lg mb-2" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="p-2 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex justify-between">
                  <div className="space предмет: y-2">
                    <div className="h-4 w-32 bg-gray-600/50 rounded-lg" />
                    <div className="h-3 w-40 bg-gray-600/50 rounded-lg" />
                    <div className="h-3 w-28 bg-gray-600/50 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-600/50 rounded-lg" />
                    <div className="h-3 w-24 bg-gray-600/50 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  const router = useRouter(); // Add useRouter hook
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

  const handleCopyRideId = () => {
    navigator.clipboard.writeText(rideId);
    toast.success("Ride ID copied to clipboard", { duration: 2000 });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error(error);
    toast.error("Failed to load ride details", { duration: 2000 });
    return <div className="text-red-400 text-center mt-10">Error loading ride details</div>;
  }

  if (!ride) {
    return <div className="text-gray-400 text-center mt-10">Ride not found</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border-gray-700/30 max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b border-gray-700/20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Ride Details
          </CardTitle>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-gray-200 cursor-pointer flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50 rounded-lg px-3 py-1 transition-all duration-200"
            onClick={() => router.push("/")}
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <MapPin className="h-6 w-6 text-blue-400" />
            <span className="text-xl sm:text-2xl font-semibold text-white">
              <span className="text-blue-400">
                From: {ride.startingLocation?.name || "N/A"}
              </span>{" "}
              <span className="text-yellow-400">→</span>{" "}
              <span className="text-green-400">
                To: {ride.destinationLocation?.name || "N/A"}
              </span>
            </span>
          </div>
          <button
            onClick={handleCopyRideId}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
            title="Copy Ride ID"
          >
            <span className="text-sm">{rideId}</span>
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Ride Overview */}
          <div>
            <h3 className="text-lg font-medium text-emerald-300 border-b border-emerald-400/30 pb-2">
              Overview
            </h3>
            <div className="mt-4 space-y-3 text-gray-200 text-base">
              <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>
                  {utcIsoToLocalDate(ride.startingTime)}{" "}
                  {utcIsoToLocalTime12(ride.startingTime)}
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <Car className="h-5 w-5 text-gray-400" />
                <span>
                  Vehicle:{" "}
                  {ride.vehicle
                    ? `${ride.vehicle.type} (${ride.vehicle.model}) - ${ride.vehicle.vehicleNumber}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <span>Status: </span>
                <Badge
                  className={`text-white ${getStatusColor(ride.status)} p-2 rounded-full`}
                  variant="outline"
                >
                  {ride.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <span>Max Passengers: {ride.maxPassengers}</span>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 border-b border-gray-400/30 pb-2">
              Driver
            </h3>
            <div className="mt-4 space-y-2 text-gray-200 text-base">
              <div className="p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <p>Name: {ride?.driver?.name || "N/A"}</p>
              </div>
              <div className="p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <p>Email: {ride?.driver?.email}</p>
              </div>
              <div className="p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                <p>Phone: {ride?.driver?.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 border-b border-gray-400/30 pb-2">
              Passengers
            </h3>
            <ScrollArea className="h-[250px] w-full mt-4 mb-20 pr-4">
              {ride.bookings.length > 0 ? (
                <div className="space-y-2">
                  {ride.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 bg-gray-700/20 rounded-lg border border-white/10 hover:bg-gray-600/20 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-sm sm:text-base">
                          <p className="text-gray-200 font-medium">
                            {booking.user.name || "N/A"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {booking.user.email}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            Phone: {booking.user.phone || "N/A"}
                          </p>
                        </div>
                        <Badge
                          className={`text-white text-xs sm:text-sm ${getBookingStatusColor(
                            booking.status
                          )} p-1 rounded-full`}
                          variant="outline"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm sm:text-base text-center py-4">
                  No passengers found
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideDetailsPage;