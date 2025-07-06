"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    MapPin,
    Clock,
    User,
    CheckCircle,
    Calendar,
    X
} from "lucide-react";
import { cancelRideRequest } from "../actions";
import { PublicRideRequest } from "../types";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";

interface RideRequestCardProps {
    rideRequest: PublicRideRequest;
    isUserOwned?: boolean;
    onSuccess: (message: string) => void,
    onError: (message: string) => void,
}

export default function RideRequestCard({ rideRequest, isUserOwned = false, onSuccess, onError }: RideRequestCardProps) {

    const router = useRouter();

    // Hook for cancell ride request
    const {
        mutateAsync: mutateCancellRideRequest,
        isPending: isRideReqestCancellPending,
    } = useMutation(
        {
            mutationFn: ( rideRequestId: string ) => {
                return cancelRideRequest( rideRequestId );
            },
            onSuccess: async () => {
                toast.success( 'Ride request cancelled successfully' );
                onSuccess?.( 'Ride request cancelled successfully' );
            },
            onError: (error) => {
                toast.error( error.message );
                onError?.( error.message );
            },
        }
    );

    // Handle create ride from request
    const handleCreateRide = async () => {
        router.push(`/create-ride?from=${encodeURIComponent(rideRequest.startingLocationId as string)}&to=${encodeURIComponent(rideRequest.destinationLocationId as string)}&time=${encodeURIComponent( new Date(rideRequest.startingTime).toTimeString())}`);
    };

    // Handle cancel ride request
    const handleCancelRequest = async () => {
        await mutateCancellRideRequest( rideRequest.id );
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
                                    <span className="text-white/90 truncate">{rideRequest.startingLocation?.name}</span>
                                </div>
                                <span className="hidden sm:inline mx-1 flex-shrink-0">→</span>
                                <div className="flex items-center min-w-0">
                                    <MapPin className="h-4 w-4 text-red-400 mr-1 flex-shrink-0" />
                                    <span className="text-white/90 truncate">{rideRequest.destinationLocation?.name}</span>
                                </div>
                            </div>

                            {/* Status badge - separate row on mobile */}
                            <div className="flex justify-start">
                                <Badge variant="outline" className={`
                                        ${rideRequest.status === 'Pending'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : rideRequest.status === "Fulfilled"
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
                                { utcIsoToLocalDate(rideRequest.startingTime) }
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="truncate">
                                { utcIsoToLocalTime12(rideRequest.startingTime) }
                            </span>
                        </div>
                    </div>

                    {/* Requested by information */}
                    <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="truncate">Requested by: {isUserOwned ? 'You' : rideRequest.user.name || rideRequest.user.email }</span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2">
                        {!isUserOwned && rideRequest.status === 'Pending' && (
                            <Button
                                onClick={handleCreateRide}
                                variant="default"
                                size="sm"
                                className="w-full justify-center bg-[#2E7D32] hover:bg-[#388E3C]"
                            >
                                {
                                    "Create Ride From This Request"
                                }
                            </Button>
                        )}

                        { isUserOwned && rideRequest.status === 'Pending' && (
                            <Button
                                onClick={handleCancelRequest}
                                disabled={isRideReqestCancellPending}
                                variant="destructive"
                                size="sm"
                                className="w-full bg-red-700 hover:bg-red-800 justify-center"
                            >
                                {isRideReqestCancellPending ? (
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

                        {isUserOwned && rideRequest.status !== "Pending" && (
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