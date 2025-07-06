"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCarbonPoint } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AvilableRides from "./components/AvilableRides";
import RideRequest from "./components/RideRequests";


export default function BookRidePage() {

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hook for fetching the carbon point
  const {
    data: carbonPoint = 0,
    isLoading: isCarbonPointFetching,
    isError: isCarbonPointFetchingError,
    error: carbonPointFetchingError,
    refetch: refechCarbonPoints,
  } = useQuery({
    queryKey: ['carbonpoint'],
    queryFn: getCarbonPoint,
  });

  if (isCarbonPointFetchingError) {
    console.error(carbonPointFetchingError);
  }


  return (
    <div className="p-4 pb-20 max-w-5xl mx-auto">

      <h1 className="text-2xl font-bold tracking-tight text-white mb-6">Book a Ride</h1>

      {/* Carbon point container */}
      <div className="mb-4 bg-gradient-to-br from-[#1A3C34] to-[#2C5046] p-3 rounded-lg flex items-center">
        <Coins className="h-5 w-5 text-amber-400 mr-3" />
        {
          isCarbonPointFetching ?
            <Skeleton className="h-5 w-60 bg-white/10 rounded-md mb-6" />
            :
            <p className="text-white">Your Carbon Points: <span className="font-bold text-amber-400">{carbonPoint}</span></p>
        }
      </div>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-emerald-400 mr-2 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{successMessage}</p>
        </div>
      )}

      <Tabs defaultValue="available-rides" className="mb-6">
        <TabsList className="bg-[#1A3C34] border-white/10 border w-full mb-4">
          <TabsTrigger value="available-rides" className="data-[state=active]:bg-[#2E7D32]  text-white flex-1">
            Available Rides
          </TabsTrigger>
          <TabsTrigger value="ride-requests" className="data-[state=active]:bg-[#2E7D32] text-white flex-1">
            My Ride Requests
          </TabsTrigger>
          {/* 
                    <TabsTrigger value="popular-routes" className="data-[state=active]:bg-[#2E7D32] text-white flex-1">
                            Popular Routes
                    </TabsTrigger>
                    */}
        </TabsList>

        {/* Available ride container */}
        <TabsContent value="available-rides" className="mt-0">
          <AvilableRides
            onSuccess={ message => {
              setSuccessMessage(message);
              refechCarbonPoints();
            }}
            onError={message => {
              setErrorMessage(message);
              refechCarbonPoints();
            }}
          />
        </TabsContent>

        {/* Ride request container */}
        <TabsContent value="ride-requests" className="mt-0">
          <RideRequest />
        </TabsContent>
      </Tabs>
    </div>
  );
} 