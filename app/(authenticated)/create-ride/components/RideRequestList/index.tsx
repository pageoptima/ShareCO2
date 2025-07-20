import React, { useState, Dispatch, SetStateAction } from "react";
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAggregatedRideRequests } from "./actions";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { format } from "date-fns";

const RideRequestList = ({
  highlightedRequestId,
  onSelectRoute,
}: {
  highlightedRequestId: string | null;
  setHighlightedRequestId: Dispatch<SetStateAction<string | null>>;
  onSelectRoute: (a: string, b: string, c: string) => void;
}) => {
  const [expandedWindow, setExpandedWindow] = useState<string | null>(null);

  const {
    data: timeWindows = [],
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
          {[...Array(3)].map((_, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl"
            >
              <CardHeader className="pb-2 border-b border-white/10">
                <div className="h-6 w-48 bg-gray-600/50 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (timeWindows.length === 0) {
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

  return (
    <div className="mt-10" id="popular-routes-section">
      <h2 className="text-xl font-semibold text-white mb-4">
        Popular Routes Today
      </h2>
      <p className="text-gray-300 mb-4">
        These are the most requested time windows. Click to view routes.
      </p>
      <div className="space-y-4">
        {timeWindows.map((window) => {
          const totalRequests = window.requests.reduce(
            (sum, req) => sum + req.requestIds.length,
            0
          );
          const isExpanded =
            expandedWindow === window.timeWindowStart.toISOString();

          return (
            <Card
              key={window.timeWindowStart.toISOString()}
              className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all"
            >
              <CardHeader
                className="pb-2 border-b border-white/10 cursor-pointer"
                onClick={() =>
                  setExpandedWindow(
                    isExpanded ? null : window.timeWindowStart.toISOString()
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-medium">
                    {format(new Date(window.timeWindowStart), "h:00 a")} -{" "}
                    {format(new Date(window.timeWindowEnd), "h:00 a")} (
                    {format(new Date(window.timeWindowStart), "MMM d, yyyy")})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                    >
                      {totalRequests}{" "}
                      {totalRequests === 1 ? "Request" : "Requests"}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="p-2 space-y-2">
                  <div className="space-y-2">
                    {window.requests.map((rideRequest, index) => (
                      <Card
                        key={index}
                        className={`bg-teal-800/50 text-white border-none shadow-md hover:shadow-lg transition-all hover:scale-[1.01] ${
                          highlightedRequestId &&
                          rideRequest.requestIds.includes(highlightedRequestId)
                            ? "ring-2 ring-green-500 ring-opacity-75 animate-pulse"
                            : ""
                        }`}
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
                              <span>
                                {utcIsoToLocalDate(rideRequest.startingTime)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span>
                                {utcIsoToLocalTime12(rideRequest.startingTime)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm sm:col-span-2">
                              <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span>
                                {rideRequest.requestIds.length}{" "}
                                {rideRequest.requestIds.length === 1
                                  ? "rider"
                                  : "riders"}{" "}
                                waiting
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Format startingTime to YYYY-MM-DDTHH:mm for datetime-local input
                              const formattedTime = format(
                                new Date(rideRequest.startingTime),
                                "yyyy-MM-dd'T'HH:mm"
                              );
                              onSelectRoute(
                                rideRequest.startingLocation?.name as string,
                                rideRequest.destinationLocation?.name as string,
                                formattedTime
                              );
                            }}
                            className="w-full justify-center bg-[#2E7D32] hover:bg-green-700 cursor-pointer transition-colors"
                          >
                            Use This Route
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RideRequestList;
