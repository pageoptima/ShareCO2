import React from 'react'
import { useQuery } from '@tanstack/react-query';
import RideRequestForm from './components/RideRequestForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import RideRequestCard from './components/RideRequestCard';
import { getUserRideRequests } from './actions';

const RideRequest = () => {

    // Hook for fetching the ride request for user
    const {
        data     : rideRequests = [],
        isLoading: isRideRequestsFetching,
        isError  : isRideRequestsFetchingError,
        error    : rideRequestsFetchingError,
        refetch  : refechRideRequests,
    } = useQuery({
        queryKey: ['rideRequests'],
        queryFn: getUserRideRequests,
    });

    if ( isRideRequestsFetchingError ) {
        console.error(rideRequestsFetchingError);
    }

    if ( isRideRequestsFetching ) {
        return (
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
        );
    }

    return (
        <div className="mb-6">
            <div className="mb-6">
                <RideRequestForm
                    onSuccess={() => { refechRideRequests() }}
                    onError={() => { refechRideRequests() }}
                />
            </div>

            {/* Refresh Requests Button */}
            <Button
                onClick={() => refechRideRequests()}
                className="mb-2 bg-[#2E7D32] hover:bg-emerald-800"
            >
                Refresh Requests
            </Button>

            {/* User's Own Ride Requests */}
            {rideRequests && rideRequests.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold tracking-tight text-white mb-4">Your Ride Requests</h2>
                    <div className="space-y-4">
                        {rideRequests.map((request) => (
                            <RideRequestCard
                                key={request.id}
                                rideRequest={request}
                                isUserOwned={true}
                                onSuccess={() => { refechRideRequests() }}
                                onError={() => { refechRideRequests() }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {(!rideRequests || rideRequests.length === 0) && (
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
    )
}

export default RideRequest;