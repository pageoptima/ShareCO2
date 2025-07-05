"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import CreateRideForm from "./components/CreateRideForm";
import RideRequestList from "./components/RideRequestList";

/**
 * Create ride components
 */
export default function CreateRidePage() {

  const [ highlightedRequestId, setHighlightedRequestId ] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Get parameters from URL if they exist
  const startingLocation    = searchParams.get( 'from' );
  const destinationLocation = searchParams.get( 'to' );
  const startingTime        = searchParams.get( 'time' );

  const [ selectedRoute, setSelectedRoute ] = useState<{
    startingLocation   : string,
    destinationLocation: string,
    startingTime       : string
  } | null>(null);

  useEffect(() => {
    if ( startingLocation && destinationLocation && startingTime ) {
      handleCreateRideForRoute(
        startingLocation,
        destinationLocation,
        startingTime,
      );
    }
  }, [
    startingLocation,
    destinationLocation,
    startingTime,
  ]);

  // Create a handler for creating rides from popular routes
  const handleCreateRideForRoute = (
    startingLocation: string,
    destinationLocation: string,
    startingTime: string
  ) => {

    // Update the selected route to trigger form update
    setSelectedRoute({
      startingLocation: startingLocation as string,
      destinationLocation: destinationLocation as string,
      startingTime: startingTime as string,
    });

    // Scroll to the top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.info("Route selected", {
      description: `Form updated with route from ${startingLocation} to ${destinationLocation} at ${startingTime}`,
      duration: 3000
    });
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
        startingLocation    = {selectedRoute?.startingLocation}
        destinationLocation = {selectedRoute?.destinationLocation}
        startingTime        = {selectedRoute?.startingTime}
        onSuccess           = {handleFormSuccess}
      />

      {/* Ride request list */}
      <RideRequestList
        highlightedRequestId={highlightedRequestId}
        setHighlightedRequestId={setHighlightedRequestId}
        onSelectRoute={handleCreateRideForRoute}
      />
    </div>
  );
} 