"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RideRequest as RideRequestContext } from "../_contexts/RideRequestContext";
import { MapPin, Clock, User, CheckCircle, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createRide } from "../_actions/createRide";
import { useState } from "react";
import { toast } from "sonner";
import { useRideRequests } from "../_contexts/RideRequestContext";
import { useAuth } from "../_contexts/AuthContext";
import { cancelRideRequest } from "../_actions/cancelRideRequest";
import formatTime, { formatDate } from "@/lib/formatTime";

interface RideRequestCardProps {
  rideRequest: RideRequestContext;
  isUserOwned?: boolean;
}

export default function RideRequestCard({ rideRequest, isUserOwned = false }: RideRequestCardProps) {
  const [isCreatingRide, setIsCreatingRide] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { refreshRideRequests } = useRideRequests();
  const { refreshUserData } = useAuth();
  
  // Handle create ride from request
  const handleCreateRide = async () => {
    try {
      setIsCreatingRide(true);
      
      // Create a ride with the request details
      const result = await createRide(
        rideRequest.from,
        rideRequest.to,
        rideRequest.time,
        3, // Default to 3 max passengers
        "4 Wheeler" // Default vehicle type
      );
      
      // Refresh ride requests
      await refreshRideRequests();
      
      // Refresh user data
      await refreshUserData();
      
      // Show appropriate toast based on result
      if (result.success) {
        toast.success("Success", {
          description: result.message
        });
      } else {
        toast.error("Error", {
          description: result.message
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create ride.";
      toast.error("Error", {
        description: errorMessage
      });
    } finally {
      setIsCreatingRide(false);
    }
  };

  // Handle cancel ride request
  const handleCancelRequest = async () => {
    try {
      setIsCancelling(true);
      
      // Cancel the ride request
      const result = await cancelRideRequest(rideRequest.id);
      
      // Refresh ride requests
      await refreshRideRequests();
      
      // Show appropriate toast based on result
      if (result.success) {
        toast.success("Success", {
          description: result.message
        });
      } else {
        toast.error("Error", {
          description: result.message
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel ride request.";
      toast.error("Error", {
        description: errorMessage
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden w-full max-w-full">
      <CardHeader className="pb-2 border-b border-white/10 px-4 py-3">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base sm:text-lg font-medium">
            <div className="flex flex-col gap-2">
              {/* Route information */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 min-w-0">
                <div className="flex items-center min-w-0">
                  <MapPin className="h-4 w-4 text-emerald-400 mr-1 flex-shrink-0" />
                  <span className="text-white/90 truncate">{rideRequest.from}</span>
                </div>
                <span className="hidden sm:inline mx-1 flex-shrink-0">→</span>
                <div className="flex items-center min-w-0">
                  <MapPin className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                  <span className="text-white/90 truncate">{rideRequest.to}</span>
                </div>
              </div>
              
              {/* Status badge - separate row on mobile */}
              <div className="flex justify-start">
                <Badge variant="outline" className={`
                  ${rideRequest.status === 'Pending' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : rideRequest.status === 'Matched'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                  } text-xs px-2 py-1 flex-shrink-0`
                }>
                  {rideRequest.status}
                </Badge>
              </div>
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Time and Date information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="truncate">
                {formatTime(rideRequest.time)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="truncate">
                {formatDate(rideRequest.date)}
              </span>
            </div>
          </div>
          
          {/* Requested by information */}
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">Requested by: {isUserOwned ? 'You' : rideRequest.userEmail.split('@')[0]}</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            {!isUserOwned && rideRequest.status === 'Pending' && (
              <Button
                onClick={handleCreateRide}
                disabled={isCreatingRide}
                variant="default"
                size="sm"
                className="w-full justify-center bg-[#2E7D32] hover:bg-[#388E3C]"
              >
                {isCreatingRide ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Ride...
                  </span>
                ) : (
                  "Create Ride From This Request"
                )}
              </Button>
            )}

            {isUserOwned && rideRequest.status === 'Pending' && (
              <Button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                variant="destructive"
                size="sm"
                className="w-full bg-red-700 hover:bg-red-800 justify-center"
              >
                {isCancelling ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Request
                  </span>
                )}
              </Button>
            )}

            {isUserOwned && rideRequest.status !== 'Pending' && (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 w-full justify-center py-2">
                <CheckCircle className="h-4 w-4 mr-2" /> Your Request
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 