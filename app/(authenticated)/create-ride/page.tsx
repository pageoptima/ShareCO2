"use client";

import React, { useState } from "react";
import CreateRideForm from "./components/CreateRideForm";
import RideRequestList from "./components/RideRequestList";

export default function CreateRidePage() {
  // State to hold selected route details
  const [selectedRoute, setSelectedRoute] = useState<{
    startingLocationId: string;
    destinationLocationId: string;
    startingTime: string;
  } | null>(null);

  // Handler for when a route is selected
  const handleSelectRoute = (
    startingLocationId: string,
    destinationLocationId: string,
    startingTime: string
  ) => {
    setSelectedRoute({
      startingLocationId,
      destinationLocationId,
      startingTime,
    });

    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto p-4">
      <CreateRideForm
        startingLocationId={selectedRoute?.startingLocationId}
        destinationLocationId={selectedRoute?.destinationLocationId}
        startingTime={selectedRoute?.startingTime}
      />
      <RideRequestList
        highlightedRequestId={null}
        setHighlightedRequestId={() => {}} // If needed, implement logic for highlighting
        onSelectRoute={handleSelectRoute}
      />
    </div>
  );
}
