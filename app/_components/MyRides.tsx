import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cancelRide } from "../_actions/cancelRide";
import { completeRide } from "../_actions/completeRide";
import { cancelBooking } from "../_actions/cancelBooking";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Clock, AlertCircle, CheckCircle, MessageCircle, UserCircle, ShieldCheck, ShieldX } from "lucide-react";
import formatTime, { formatDate } from "@/lib/formatTime";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { RideChatModal } from "./RideChatModal";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

interface Booking {
  id: string;
  userEmail: string;
  status: string;
}

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  status: string;
  time: string;
  startingTime?: string;
  bookings?: Booking[];
  maxPassengers?: number;
  createdAt?: string;
  rideStatus?: string; // For booked rides - the actual ride status
  bookingId?: string; // For booked rides - the booking ID for cancellation
}

interface MyRidesProps {
  createdRides: Ride[];
  bookedRides: Ride[];
  onManageBooking?: (bookingId: string, action: "confirm" | "deny") => Promise<void>;
  onDataUpdate?: () => Promise<void>; // Callback to refresh data from parent
}

export function MyRides({ createdRides, bookedRides, onManageBooking, onDataUpdate }: MyRidesProps) {
  const [completingRideId, setCompletingRideId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  
  // Local state for optimistic updates
  const [localCreatedRides, setLocalCreatedRides] = useState(createdRides);
  const [localBookedRides, setLocalBookedRides] = useState(bookedRides);

  // Update local state when props change
  useEffect(() => {
    setLocalCreatedRides(createdRides);
    setLocalBookedRides(bookedRides);
  }, [createdRides, bookedRides]);

  // Filter rides to show recent rides (past 7 days) - data is already sorted by createdAt desc from database
  const filterRides = (rides: Ride[]) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return rides.filter(ride => {
      if (!ride.createdAt) return true; // Show rides without createdAt for backward compatibility
      const rideCreatedAt = new Date(ride.createdAt);
      return rideCreatedAt >= sevenDaysAgo;
    });
  };

  // Apply filtering to both ride arrays (no sorting needed as data comes pre-sorted from database)
  const filteredCreatedRides = filterRides(localCreatedRides);
  const filteredBookedRides = filterRides(localBookedRides);

  const handleCancelRide = async (rideId: string) => {
    try {
      // Optimistic update - immediately update UI
      setLocalCreatedRides(prev => 
        prev.map(ride => 
          ride.id === rideId 
            ? { ...ride, status: "Cancelled" }
            : ride
        )
      );

      const result = await cancelRide(rideId);
      
      if (result.success) {
        toast.success("Success", {
          description: result.message
        });
        
        // Refresh data from parent if callback provided
        if (onDataUpdate) {
          await onDataUpdate();
        }
      } else {
        toast.error("Error", {
          description: result.message
        });
        
        // Revert optimistic update on error
        setLocalCreatedRides(createdRides);
      }
    } catch (err) {
      console.error("Failed to cancel ride:", err);
      toast.error("Error", {
        description: "Failed to cancel ride."
      });
      
      // Revert optimistic update on error
      setLocalCreatedRides(createdRides);
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    try {
      setCompletingRideId(rideId);
      
      // Optimistic update - immediately update UI
      setLocalCreatedRides(prev => 
        prev.map(ride => 
          ride.id === rideId 
            ? { ...ride, status: "Completed" }
            : ride
        )
      );

      const result = await completeRide(rideId);
      toast.success("Success", {
        description: result?.message || "Ride completed successfully"
      });
      
      // Refresh data from parent if callback provided
      if (onDataUpdate) {
        await onDataUpdate();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete ride.";
      toast.error("Error", {
        description: errorMessage
      });
      
      // Revert optimistic update on error
      setLocalCreatedRides(createdRides);
    } finally {
      setCompletingRideId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // Optimistic update - remove booking from UI
      setLocalBookedRides(prev => 
        prev.filter(ride => ride.bookingId !== bookingId)
      );

      const result = await cancelBooking(bookingId);
      
      if (result.success) {
        toast.success("Success", {
          description: result.message
        });
        
        // Refresh data from parent if callback provided
        if (onDataUpdate) {
          await onDataUpdate();
        }
      } else {
        toast.error("Error", {
          description: result.message
        });
        
        // Revert optimistic update on error
        setLocalBookedRides(bookedRides);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel booking.";
      toast.error("Error", {
        description: errorMessage
      });
      
      // Revert optimistic update on error
      setLocalBookedRides(bookedRides);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-emerald-400';
      case 'pending':
        return 'text-amber-400';
      case 'completed':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "denied":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case "denied":
        return <ShieldX className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const handleOpenChat = (ride: Ride) => {
    setCurrentRide(ride);
    setIsChatOpen(true);
  };

  return (
    <Card className="bg-gradient-to-br from-[#1A3C34] to-[#2C5046] text-white border-none shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">My Rides</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-[calc(100%-2rem)] grid-cols-2 bg-black/20 rounded-md p-1 mx-4 mb-4">
            <TabsTrigger 
              value="created" 
              className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300"
            >
              Created
            </TabsTrigger>
            <TabsTrigger 
              value="booked" 
              className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white text-gray-300"
            >
              Booked
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="created">
            <ScrollArea className="h-[500px] w-full px-4 pb-4">
              <div className="space-y-3">
                {filteredCreatedRides.length > 0 ? (
                  filteredCreatedRides.map((ride) => (
                    <div 
                      key={ride.id} 
                      className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                                <p className="font-medium">{ride.from}</p>
                              </div>
                              <span className="hidden sm:inline mx-1">→</span>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-red-400 mr-1" />
                                <p className="font-medium">{ride.to}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                            <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                              <Calendar className="h-3 w-3 mr-1 opacity-70" />
                              {formatDate(ride.date)}
                            </div>
                            <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                              <Clock className="h-3 w-3 mr-1 opacity-70" />
                              {formatTime(ride.time)}
                            </div>
                            <div className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(ride.status)}`}>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {ride.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {ride.status === "Active" && (
                            <Button
                              onClick={() => handleCompleteRide(ride.id)}
                              disabled={completingRideId === ride.id}
                              className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30"
                            >
                              {completingRideId === ride.id ? "Completing..." : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete Ride
                                </>
                              )}
                            </Button>
                          )}
                          
                          {(ride.status === "Pending" || ride.status === "Active") && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelRide(ride.id)}
                              className="px-3 py-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30"
                            >
                              Cancel Ride
                            </Button>
                          )}

                          {ride.status === "Active" && (
                            <Button
                              onClick={() => handleOpenChat(ride)}
                              className="px-3 py-1 h-8 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border border-blue-500/30"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                          )}
                        </div>
                        
                        {ride.bookings && ride.bookings.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-white/10">
                            <p className="text-sm font-medium mb-2">Ride Bookings</p>
                            <div className="space-y-3">
                              {ride.bookings.map((booking) => (
                                <div 
                                  key={booking.id} 
                                  className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border border-emerald-600/30 flex justify-center items-center">
                                      <UserCircle className="h-5 w-5" />
                                    </Avatar>
                                    
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{booking.userEmail}</p>
                                      <Badge 
                                        className={`mt-1.5 text-xs px-2 py-0.5 border ${getBookingStatusColor(booking.status)} flex w-fit items-center`}
                                        variant="outline"
                                      >
                                        {getBookingStatusIcon(booking.status)}
                                        {booking.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {booking.status === "Pending" && onManageBooking && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      <Button
                                        onClick={() => onManageBooking(booking.id, "confirm")}
                                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-xs border border-emerald-500/30 text-emerald-300 flex-1 sm:flex-initial"
                                        size="sm"
                                      >
                                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                                        Accept
                                      </Button>
                                      <Button
                                        onClick={() => onManageBooking(booking.id, "deny")}
                                        className="bg-red-500/20 hover:bg-red-500/40 text-xs border border-red-500/30 text-red-300 flex-1 sm:flex-initial"
                                        size="sm"
                                      >
                                        <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-gray-400 mt-2">No created rides in the past 7 days</p>
                    <p className="text-xs text-gray-500">Your recent created rides will appear here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="booked">
            <ScrollArea className="h-[500px] w-full px-4 pb-4">
              <div className="space-y-3">
                {filteredBookedRides.length > 0 ? (
                  filteredBookedRides.map((ride) => (
                    <div 
                      key={ride.id} 
                      className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                              <p className="font-medium">{ride.from}</p>
                            </div>
                            <span className="hidden sm:inline mx-1">→</span>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-red-400 mr-1" />
                              <p className="font-medium">{ride.to}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                            <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                              <Calendar className="h-3 w-3 mr-1 opacity-70" />
                              {formatDate(ride.date)}
                            </div>
                            <div className="flex items-center bg-white/10 rounded-3xl px-2 py-1">
                              <Clock className="h-3 w-3 mr-1 opacity-70" />
                              {formatTime(ride.time)}
                            </div>
                            <div className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(ride.status)}`}>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {ride.status}
                            </div>
                            {ride.rideStatus && (
                              <div className={`flex items-center bg-white/10 rounded-3xl px-2 py-1 ${getStatusColor(ride.rideStatus)}`}>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Ride: {ride.rideStatus}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {(ride.status === "Confirmed" && ride.rideStatus === "Active") && (
                            <Button
                              onClick={() => handleCompleteRide(ride.id)}
                              disabled={completingRideId === ride.id}
                              className="px-3 py-1 h-8 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30"
                            >
                              {completingRideId === ride.id ? "Completing..." : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete Ride
                                </>
                              )}
                            </Button>
                          )}

                          {(ride.status === "Confirmed" && ride.rideStatus === "Active") && (
                            <Button
                              onClick={() => handleOpenChat(ride)}
                              className="px-3 py-1 h-8 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 border border-blue-500/30"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                          )}

                          {ride.status === "Confirmed" && ride.bookingId && (
                            <Button
                              onClick={() => handleCancelBooking(ride.bookingId!)}
                              className="px-3 py-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30"
                            >
                              Cancel Booking
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-gray-400 mt-2">No booked rides in the past 7 days</p>
                    <p className="text-xs text-gray-500">Your recent booked rides will appear here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {currentRide && (
        <RideChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)} 
          ride={currentRide}
        />
      )}
    </Card>
  );
}