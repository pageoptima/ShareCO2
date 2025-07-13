import React, { Dispatch, SetStateAction } from "react";
import { AlertCircle, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAggregatedRideRequests } from "./actions";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";

const RideRequestList = ({
  highlightedRequestId,
  setHighlightedRequestId,
  onSelectRoute,
}: {
  highlightedRequestId: string | null;
  setHighlightedRequestId: Dispatch<SetStateAction<string | null>>;
  onSelectRoute: (a: string, b: string, c: string) => void;
}) => {
  // Hook for getting all ride requests
  const {
    data: rideRequests = [],
    isLoading: isRideRequestsFetching,
    isError: isRideRequestsFetchingError,
    error: rideRequestsFetchingError,
  } = useQuery({
    queryKey: ["aggregatedRideRequests"],
    queryFn: getAggregatedRideRequests,
  });

  if (isRideRequestsFetchingError) {
    console.error(rideRequestsFetchingError);
  }

  if (isRideRequestsFetching) {
    return (
      <div className="mt-10">
        <div className="space-y-4">
          {/* Render 3 skeleton cards to mimic the ride request cards */}
          {[...Array(3)].map((_, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl"
            >
              <CardHeader className="pb-2 border-b border-white/10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                        <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
                      </div>
                      <span className="hidden sm:inline mx-1">→</span>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                        <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="h-4 w-20 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="h-4 w-20 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center text-sm sm:col-span-2">
                    <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render when no aggregated ride request
  if (rideRequests.length === 0) {
    return (
      <div className="mt-10">
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-[#1A3C34] p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No ride requests</h3>
            <p className="text-gray-400 text-center">
              There are currently no ride requests. Create a ride and be the
              first to offer a ride today!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render when aggregated ride is available
  return (
    <div className="mt-10" id="popular-routes-section">
      <h2 className="text-xl font-semibold text-white mb-4">
        Popular Routes Today
      </h2>
      <p className="text-gray-300 mb-4">
        These are the most requested routes. Select one to fill the form above.
      </p>
      <div className="space-y-4">
        {rideRequests.map((rideRequest, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer hover:scale-[1.01] ${
              highlightedRequestId &&
              rideRequest.requestIds.includes(highlightedRequestId)
                ? "ring-2 ring-green-500 ring-opacity-75 animate-pulse"
                : ""
            }`}
            onClick={() => {
              setHighlightedRequestId(rideRequest.requestIds[0]);
              onSelectRoute(
                rideRequest.startingLocationId as string,
                rideRequest.destinationLocationId as string,
                new Date(rideRequest.startingTime).toString()
              );
            }}
          >
            <CardHeader className="pb-2 border-b border-white/10">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-base sm:text-lg font-medium flex items-center justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-emerald-400 mr-1 flex-shrink-0" />
                      <span className="text-white/90 truncate">
                        {rideRequest.startingLocation?.name}
                      </span>
                    </div>
                    <span className="hidden sm:inline mx-1">→</span>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                      <span className="text-white/90 truncate">
                        {rideRequest.destinationLocation?.name}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                  >
                    {rideRequest.requestIds.length}{" "}
                    {rideRequest.requestIds.length === 1
                      ? "Request"
                      : "Requests"}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span>{utcIsoToLocalDate(rideRequest.startingTime)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span>{utcIsoToLocalTime12(rideRequest.startingTime)}</span>
                </div>
                <div className="flex items-center text-sm sm:col-span-2">
                  <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span>
                    {rideRequest.requestIds.length}{" "}
                    {rideRequest.requestIds.length === 1 ? "rider" : "riders"}{" "}
                    waiting
                  </span>
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRoute(
                    rideRequest.startingLocationId as string,
                    rideRequest.destinationLocationId as string,
                    new Date(rideRequest.startingTime).toString()
                  );
                }}
                className="w-full justify-center bg-[#2E7D32]"
              >
                Use This Route
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RideRequestList;
