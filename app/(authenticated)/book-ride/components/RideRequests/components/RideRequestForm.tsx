"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin } from "lucide-react";
import { createRideRequest, getLocations } from "../actions";
import { localToUtcIso } from "@/utils/time";

// Form schema
const requestFormSchema = z.object({
    startingLocationId   : z.string().min(1, 'Starting point is required'),
    destinationLocationId: z.string().min(1, 'Destination is required'),
    startingTime         : z.string().min(1, 'Hour is required'),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RideRequestForm(
    {
        onSuccess,
        onError,
    }: {
        onSuccess: (message: string) => void,
        onError: (message: string) => void,
    }
) {

    // Fetch location via react-query
    const {
        data: locations = [],
        isLoading: isLocationFetching,
        isError: isLocationFetchingError,
        error: locationFetchingError,
    } = useQuery({
        queryKey: ['location'],
        queryFn: getLocations,
    });

    if( isLocationFetchingError ) {
        console.error( locationFetchingError);
    }

    // Hook for create ride request
    const {
        mutateAsync: mutateCreateRideRequest,
        isPending: isRideReqestPending
    } = useMutation(
        {
            mutationFn: ({
                startingLocationId,
                destinationLocationId,
                startingTime,
            }: {
                startingLocationId: string,
                destinationLocationId: string,
                startingTime: string
            }) => {

                // Convert starting time to utc iso before send to backend
                const startingTimeUtcISO = localToUtcIso( startingTime );
                
                return createRideRequest({
                    startingLocationId,
                    destinationLocationId,
                    startingTime: startingTimeUtcISO,
                })
            },
            onSuccess: async () => {
                toast.success('Ride request created successfully');
                onSuccess?.('Ride request created successfully');
            },
            onError: (error: any) => {
                toast.error(error.message);
                onError?.(error.message);
            },
        }
    );

    // Initialize form first
    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestFormSchema),
        defaultValues: {
            startingLocationId: '',
            destinationLocationId: '',
            startingTime: '',
        },
    });

    // Create a stable submit handler with useCallback
    const submitRequest = async (data: RequestFormValues) => {

        if (isRideReqestPending) return;

        // Validate destination is not the same as starting point
        if (data.startingLocationId === data.destinationLocationId) {
            toast.error('Starting point and destination cannot be the same');
            return;
        }

        // Additional validation for office requirement
        const startingLocationName = locations.find(location => location.id === data.startingLocationId)?.name;
        const destinationLocationName = locations.find(location => location.id === data.destinationLocationId)?.name;

        if (startingLocationName?.toLowerCase() !== 'office' && destinationLocationName?.toLowerCase() !== 'office') {
            toast.error('Either starting point or destination must be Office');
            return;
        }

        await mutateCreateRideRequest(data);
        form.reset();
    };

    // Watch form values for filtering
    const watchedStartingPoint = form.watch('startingLocationId');
    const watchedDestination   = form.watch('destinationLocationId');

    // Filter locations based on selection
    const getFilteredLocationsForStarting = () => {
        return locations.filter(location => location.id !== watchedDestination);
    };

    const getFilteredLocationsForDestination = () => {
        return locations.filter(location => location.id !== watchedStartingPoint);
    };

    // Always show the form regardless of whether user has existing requests

    return (
        <Card className="bg-[#1A3C34] rounded-xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Request a Ride</CardTitle>
                <p className="text-sm text-white/60 mt-1">
                    Note: Either starting point or destination must be Office
                </p>
            </CardHeader>

            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submitRequest)} className="space-y-4">
                        <div className="space-y-4">

                            {/* Starting location input */}
                            <FormField
                                control={form.control}
                                name="startingLocationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white mb-1 block">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                                                Starting Point
                                            </div>
                                        </FormLabel>
                                        <Select
                                            disabled={isLocationFetching || isRideReqestPending}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // If destination is the same as selected starting point, clear destination
                                                if (watchedDestination === value) {
                                                    form.setValue("startingLocationId", "");
                                                }
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                                                    <SelectValue placeholder="Select starting point" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                                                {getFilteredLocationsForStarting().map((location, index) => (
                                                    <SelectItem key={index} value={location.id}>
                                                        {location.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />

                            {/* Destination input */}
                            <FormField
                                control={form.control}
                                name="destinationLocationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white mb-1 block">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-red-400 mr-1" />
                                                Destination
                                            </div>
                                        </FormLabel>
                                        <Select
                                            disabled={isLocationFetching || isRideReqestPending}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // If starting point is the same as selected destination, clear starting point
                                                if (watchedStartingPoint === value) {
                                                    form.setValue("startingLocationId", "");
                                                }
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                                                    <SelectValue placeholder="Select destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                                                {getFilteredLocationsForDestination().map((location, index) => (
                                                    <SelectItem key={index} value={location.id}>
                                                        {location.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />

                            {/* Ride Starting time input */}
                            <FormField
                                control={form.control}
                                name="startingTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white mb-1">
                                            Starting Time
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                                disabled={form.formState.isSubmitting}
                                                className="bg-black/30 text-white border-gray-700"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#2E7D32] hover:bg-[#388E3C] mt-6"
                            disabled={isRideReqestPending}
                        >
                            {isRideReqestPending ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                "Submit Request"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="text-xs text-white/60 px-6 py-3 flex justify-center border-t border-white/10">
                Your request will be visible to other users who can offer a ride. Selected locations are automatically filtered from the other dropdown.
            </CardFooter>
        </Card>
    );
}
