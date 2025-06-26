"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRideRequests } from "../../_contexts/RideRequestContext";
import { MapPin, Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CreateRideForm from "../../_components/CreateRideForm";

/**
 * Create ride components
 */
export default function CreateRidePage() {
  

  const searchParams = useSearchParams();
  const { rideRequests, aggregatedRideRequests } = useRideRequests();

  // Get parameters from URL if they exist
  const fromParam  = searchParams.get( 'from' );
  const toParam    = searchParams.get( 'to' );
  const timeParam  = searchParams.get( 'time' );

  console.log( fromParam, toParam, timeParam );

  const [ highlightedRequestId, setHighlightedRequestId ] = useState<string | null>(null);
  const [ selectedRoute, setSelectedRoute ] = useState<{ from: string, to: string, time: string } | null>(null);

  // If form was pre-filled from URL params, show a toast notification
  useEffect(() => {

    if ( fromParam && toParam && timeParam ) {

      toast.info( 'Pre-filled ride details', {
        description: `Creating a ride from ${fromParam} to ${toParam} at ${timeParam}`,
        duration: 5000
      });

      // Find matching ride requests and highlight them
      if ( rideRequests && rideRequests.length > 0 ) {
        const matchingRequests = rideRequests.filter(
          request => 
            request.from === fromParam &&
            request.to === toParam &&
            request.time === timeParam &&
            request.status === 'Pending'
        );

        if (matchingRequests.length > 0) {
          // Set timeout to allow the ride requests section to render
          setTimeout(() => {
            // Scroll to the ride requests section
            const element = document.getElementById('popular-routes-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }

            // Highlight the matching requests
            matchingRequests.forEach(request => {
              setHighlightedRequestId(request.id);
            });
          }, 500);
        }
      }
    }
  }, [fromParam, toParam, timeParam, rideRequests]);

  // Create a handler for creating rides from popular routes
  const handleCreateRideForRoute = (from: string, to: string, time: string) => {
    // Update the selected route to trigger form update
    setSelectedRoute({ from, to, time });

    // Scroll to the top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.info("Route selected", {
      description: `Form updated with route from ${from} to ${to} at ${time}`,
      duration: 3000
    });

    // Set highlighted request id for visual feedback
    const matchingRequest = rideRequests?.find(
      request => request.from === from && request.to === to && request.time === time
    );
    if (matchingRequest) {
      setHighlightedRequestId(matchingRequest.id);
    }
  };

  const handleFormSuccess = () => {
    // Clear highlighted request and selected route after successful form submission
    setHighlightedRequestId(null);
    setSelectedRoute(null);

    // Scroll to popular routes section to show the impact
    setTimeout(() => {
      const element = document.getElementById('popular-routes-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1000);
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-semibold text-white mb-6">Create a Ride</h1>

      {/* Create Ride Form */}
      <CreateRideForm
        initialFrom={fromParam || undefined}
        initialTo={toParam || undefined}
        initialTime={timeParam || undefined}
        selectedRoute={selectedRoute}
        onSuccess={handleFormSuccess}
      />

      {/* Popular Routes Section */}
      {aggregatedRideRequests.length > 0 && (
        <div className="mt-10" id="popular-routes-section">
          <h2 className="text-xl font-semibold text-white mb-4">Popular Routes Today</h2>
          <p className="text-gray-300 mb-4">These are the most requested routes. Select one to fill the form above.</p>
          <div className="space-y-4">
            {aggregatedRideRequests.map((aggregatedRequest) => (
              <Card
                key={aggregatedRequest.key}
                className={`bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer hover:scale-[1.01] ${highlightedRequestId && aggregatedRequest.requestIds.includes(highlightedRequestId)
                    ? "ring-2 ring-green-500 ring-opacity-75 animate-pulse"
                    : ""
                  }`}
                onClick={() => handleCreateRideForRoute(aggregatedRequest.from, aggregatedRequest.to, aggregatedRequest.time)}
              >
                <CardHeader className="pb-2 border-b border-white/10">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-base sm:text-lg font-medium flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-emerald-400 mr-1 flex-shrink-0" />
                          <span className="text-white/90 truncate">{aggregatedRequest.from}</span>
                        </div>
                        <span className="hidden sm:inline mx-1">→</span>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                          <span className="text-white/90 truncate">{aggregatedRequest.to}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                        {aggregatedRequest.count} {aggregatedRequest.count === 1 ? 'Request' : 'Requests'}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{aggregatedRequest.time}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{aggregatedRequest.date}</span>
                    </div>
                    <div className="flex items-center text-sm sm:col-span-2">
                      <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{aggregatedRequest.count} {aggregatedRequest.count === 1 ? 'rider' : 'riders'} waiting</span>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateRideForRoute(aggregatedRequest.from, aggregatedRequest.to, aggregatedRequest.time);
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
      )}

      {/* If no ride requests and no popular routes */}
      {aggregatedRideRequests.length === 0 && (
        <div className="mt-10">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="rounded-full bg-[#1A3C34] p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No ride requests</h3>
              <p className="text-gray-400 text-center">There are currently no ride requests. Create a ride and be the first to offer a ride today!</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 