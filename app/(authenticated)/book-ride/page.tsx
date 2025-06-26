"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookRide } from "../../_actions/bookRide";
import { getAvailableRides } from "../../_actions/getAvailableRides";
import { MapPin, Clock, Users, User, CheckCircle, AlertCircle, Coins, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "../../_contexts/AuthContext";
import { useRideRequests } from "../../_contexts/RideRequestContext";
import RideRequestForm from "../../_components/RideRequestForm";
import RideRequestCard from "../../_components/RideRequestCard";
import { useRouter } from "next/navigation";
import { formatCarbonPointsForUI } from "@/lib/carbonPointsConversion";
import formatTime, { formatDate } from "@/lib/formatTime";

// Define the Ride interface with booking status
interface Ride {
  id: string;
  from: string;
  to: string;
  seatsLeft: number;
  driverName: string;
  startingTime: string;
  vehicleType?: string | null;
}

// Interface for aggregated ride requests
interface AggregatedRideRequest {
  key: string;
  from: string;
  to: string;
  time: string;
  date: string;
  count: number;
  requestIds: string[];
}

export default function BookRidePage() {
  const { data: session } = useSession();
  const { userData, refreshUserData } = useAuth();
  const { rideRequests, userRideRequests, refreshRideRequests } = useRideRequests();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("available-rides");
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingRides, setIsRefreshingRides] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  // Get user carbon points from shared context
  const userCarbonPoints = userData?.carbonPoints || 0;

  // Add a memoized version of the refresh function with useCallback
  const memoizedRefreshRequests = useCallback(() => {
    if (session?.user?.id) {
      refreshRideRequests();
    }
  }, [session?.user?.id, refreshRideRequests]);

  // Function to refresh available rides
  const refreshAvailableRides = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsRefreshingRides(true);
      const rides = await getAvailableRides(session.user.id);
      setAvailableRides(rides);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh rides.");
    } finally {
      setIsRefreshingRides(false);
    }
  }, [session?.user?.id]);

  // Handle tab change with refresh for available rides
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "available-rides") {
      refreshAvailableRides();
    }
  }, [refreshAvailableRides]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch available rides
        const rides = await getAvailableRides(session.user.id);
        setAvailableRides(rides);

        // Refresh ride requests
        await refreshRideRequests();

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rides.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [session?.user?.id, refreshRideRequests]);

  // Memoized aggregated ride requests for today and future times
  const aggregatedRideRequests = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDate = formatDate(now);

    // Filter requests for today and future time
    const currentAndFutureRequests = rideRequests.filter(request => {
      if (request.date !== currentDate) return false;

      const [requestHour, requestMinute] = request.time.split(':').map(Number);

      // Check if request time is in the future
      return (requestHour > currentHour) ||
             (requestHour === currentHour && requestMinute > currentMinute);
    });

    // Group by starting point, destination, and time
    const groupedRequests: Record<string, AggregatedRideRequest> = {};

    currentAndFutureRequests.forEach(request => {
      const key = `${request.from}|${request.to}|${request.time}`;

      if (!groupedRequests[key]) {
        groupedRequests[key] = {
          key,
          from: request.from,
          to: request.to,
          time: request.time,
          date: request.date,
          count: 1,
          requestIds: [request.id]
        };
      } else {
        groupedRequests[key].count += 1;
        groupedRequests[key].requestIds.push(request.id);
      }
    });

    return Object.values(groupedRequests).sort((a, b) => {
      // First sort by time
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);

      if (aHour !== bHour) return aHour - bHour;
      if (aMinute !== bMinute) return aMinute - bMinute;

      // Then by starting point
      if (a.from !== b.from) return a.from.localeCompare(b.from);

      // Then by destination
      return a.to.localeCompare(b.to);
    });
  }, [rideRequests]);

  // Calculate carbon points required for a ride based on vehicle type
  const calculateRequiredPoints = (ride: Ride): number => {
    // Fixed carbon points based on vehicle type
    // Car/4 Wheeler = 2 CP, Bike/2 Wheeler = 1 CP
    if (!ride.vehicleType) {
      return 2; // Default to car cost if vehicle type is not specified
    }
    
    const vehicleType = ride.vehicleType.toLowerCase();
    if (vehicleType.includes('2') || vehicleType.includes('bike') || vehicleType.includes('two')) {
      return 1; // 2 Wheeler/Bike
    } else {
      return 2; // 4 Wheeler/Car (default)
    }
  };

  const handleBookRide = async (rideId: string) => {
    const ride = availableRides.find(r => r.id === rideId);
    if (!ride) return;
    
    try {
      setBookingInProgress(rideId);
      const result = await bookRide(rideId);
      
      if (result.success) {
        setSuccess(result.message);
        setError(null);
        toast.success("Success", {
          description: result.message
        });

        // Refresh rides and user data after booking
        if (session?.user?.id) {
          const rides = await getAvailableRides(session.user.id);
          setAvailableRides(rides);
          await refreshUserData(); // Refresh user data including carbon points
        }
      } else {
        setError(result.message);
        setSuccess(null);
        toast.error("Error", {
          description: result.message
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to book ride.";
      setError(errorMessage);
      setSuccess(null);
      toast.error("Error", {
        description: errorMessage
      });
    } finally {
      setBookingInProgress(null);
    }
  };

  // Navigate to create-ride page with the parameters
  const handleCreateRideForRoute = (from: string, to: string, time: string) => {
    router.push(`/create-ride?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&time=${encodeURIComponent(time)}`);
  };

  // No need for client-side filtering since it's done in the database
  const availableRidesFiltered = availableRides;

  // Loading skeletons for better UX during loading
  if (isLoading) {
    return (
      <div className="p-4 pb-20 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-60 bg-white/10 rounded-md mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-white/10 rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2 bg-white/10 rounded-md" />
                  <Skeleton className="h-4 w-1/3 bg-white/10 rounded-md" />
                  <Skeleton className="h-4 w-2/5 bg-white/10 rounded-md" />
                  <Skeleton className="h-9 w-28 bg-white/10 rounded-md mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-white mb-6">Book a Ride</h1>
      
      <div className="mb-4 bg-gradient-to-br from-[#1A3C34] to-[#2C5046] p-3 rounded-lg flex items-center">
        <Coins className="h-5 w-5 text-amber-400 mr-3" />
        <p className="text-white">Your Carbon Points: <span className="font-bold text-amber-400">{formatCarbonPointsForUI(userCarbonPoints)}</span></p>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-emerald-400 mr-2 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{success}</p>
        </div>
      )}
      
      <Tabs defaultValue="available-rides" value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-[#1A3C34] border-white/10 border w-full mb-4">
          <TabsTrigger value="available-rides" className="data-[state=active]:bg-[#2E7D32]  text-white flex-1">
            Available Rides
          </TabsTrigger>
          <TabsTrigger value="ride-requests" className="data-[state=active]:bg-[#2E7D32] text-white flex-1">
            My Ride Requests
          </TabsTrigger>
          {/* <TabsTrigger value="popular-routes" className="data-[state=active]:bg-[#2E7D32] text-white flex-1">
            Popular Routes
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="available-rides" className="mt-0">
          {/* Refresh Available Rides Button */}
          <Button
            onClick={refreshAvailableRides}
            disabled={isRefreshingRides}
            className="mb-4 bg-[#2E7D32] hover:bg-emerald-800"
          >
            {isRefreshingRides ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              "Refresh Available Rides"
            )}
          </Button>
          
          <div className="space-y-4">
            {availableRidesFiltered.length > 0 ? (
              availableRidesFiltered.map((ride) => {
                const hasSeats = ride.seatsLeft > 0;
                const requiredPoints = calculateRequiredPoints(ride);
                const isBookingThis = bookingInProgress === ride.id;

                return (
                  <Card
                    key={ride.id}
                    className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden"
                  >
                    <CardHeader className="pb-2 border-b border-white/10">
                      <div className="flex flex-col gap-2">
                        <CardTitle className="text-base sm:text-lg font-medium flex items-center">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 w-full">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-emerald-400 mr-1 flex-shrink-0" />
                              <span className="text-white/90 truncate">{ride.from}</span>
                            </div>
                            <span className="hidden sm:inline mx-1">→</span>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                              <span className="text-white/90 truncate">{ride.to}</span>
                            </div>
                          </div>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>{formatTime(ride.startingTime)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Driver: {ride.driverName}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Seats: {ride.seatsLeft} available</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Coins className="h-4 w-4 text-amber-400 mr-2 flex-shrink-0" />
                          <span>Cost: <span className="font-medium text-amber-400">{requiredPoints}</span> carbon points</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleBookRide(ride.id)}
                        disabled={!hasSeats || isBookingThis}
                        variant="default"
                        size="sm"
                        className={`w-full justify-center ${
                          !hasSeats 
                            ? "bg-red-700/50 hover:bg-red-700/60" 
                            : "bg-[#2E7D32]"
                        }`}
                      >
                        {isBookingThis ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : !hasSeats ? (
                          "No seats available"
                        ) : (
                          "Book Ride"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="rounded-full bg-[#1A3C34] p-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No rides available</h3>
                  <p className="text-gray-400 text-center">There are currently no available rides after the current time. Please check back later or raise a ride request from Ride Requests Tab!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ride-requests" className="mt-0">
          <div className="mb-6">
            <div className="mb-6">
              <RideRequestForm />
            </div>

            {/* Refresh Requests Button */}
            <Button
                onClick={memoizedRefreshRequests}
                className="mb-2 bg-[#2E7D32] hover:bg-emerald-800"
              >
                Refresh Requests
              </Button>

            {/* User's Own Ride Requests */}
            {userRideRequests && userRideRequests.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold tracking-tight text-white mb-4">Your Ride Requests</h2>
                <div className="space-y-4">
                  {userRideRequests.map((request) => (
                    <RideRequestCard key={request.id} rideRequest={request} isUserOwned={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Users' Ride Requests */}
            {/* {rideRequests && rideRequests.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold tracking-tight text-white mb-4">Ride Requests From Others</h2>
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <RideRequestCard key={request.id} rideRequest={request} />
                  ))}
                </div>
              </div>
            )} */}

            {(!userRideRequests || userRideRequests.length === 0) && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white mt-4">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="rounded-full bg-[#1A3C34] p-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No ride requests</h3>
                  <p className="text-gray-400 text-center">There are currently no ride requests. Create one by filling the form above!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Popular Routes Tab - Shows Aggregated Ride Requests */}
        <TabsContent value="popular-routes" className="mt-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white mb-4">Popular Routes Today</h2>
            <p className="text-gray-300 mb-4">These are the most requested routes for today. Create a ride to help multiple riders at once!</p>

            {aggregatedRideRequests.length > 0 ? (
              <div className="space-y-4">
                {aggregatedRideRequests.map((aggregatedRequest) => (
                  <Card
                    key={aggregatedRequest.key}
                    className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden"
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
                        onClick={() => handleCreateRideForRoute(aggregatedRequest.from, aggregatedRequest.to, aggregatedRequest.time)}
                        className="w-full justify-center bg-[#2E7D32]"
                      >
                        Create a Ride for This Route
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="rounded-full bg-[#1A3C34] p-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No popular routes</h3>
                  <p className="text-gray-400 text-center">There are currently no ride requests after the current time today.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 