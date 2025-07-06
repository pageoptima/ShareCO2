"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
    MapPin,
    Users
} from "lucide-react";
import {
    createRide,
    getUserVehicles,
    getLocations,
} from "./actions";
import { PublicVehicleType } from "./types";
import { localToUtcIso } from "@/utils/time";

interface CreateRideFormProps {
    startingLocation   ?: string;
    destinationLocation?: string;
    startingTime       ?: string
    onSuccess          ?: () => void;
}

// Form schema with validation
const createRideSchema = z.object({
    startingLocationId   : z.string().min(1, "Starting Location is required"),
    destinationLocationId: z.string().min(1, "Destination Location is required"),
    startingTime         : z.string().min(1, "Starting time is required"),
    vehicleId            : z.string().min(1, "Vehicle is required"),
    maxPassengers        : z.string().min(1, "Number of passengers is required"),
}).refine((data) => {
    // Ensure starting point and destination are different
    return data.startingLocationId !== data.destinationLocationId;
}, {
    message: "Starting point and destination must be different",
    path: ["destination"],
});

type CreateRideFormValues = z.infer<typeof createRideSchema>;

export default function CreateRideForm({
    startingLocation,
    destinationLocation,
    startingTime,
    onSuccess,
}: CreateRideFormProps) {

    // State variable for vehicle type
    const [vehicleType, setVehicleType] = useState<PublicVehicleType>();

    // Fetch vehicles via react-query
    const {
        data     : vehicles = [],
        isLoading: isVehicleFetching,
        isError  : isVehicleFetchingError,
        error    : vehicleFetchingError,
    } = useQuery({
        queryKey: ['vehicles'],
        queryFn: getUserVehicles,
    });

    // Fetch location via react-query
    const {
        data     : locations = [],
        isLoading: isLocationFetching,
        isError  : isLocationFetchingError,
        error    : locationFetchingError,
    } = useQuery({
        queryKey: ['location'],
        queryFn: getLocations,
    });

    // Mutation function for create ride
    const { mutate: mutateRide, isPending: isCreating } = useMutation({
        mutationFn: (vals: CreateRideFormValues) =>  {

            // Convert starting time to utc iso before send to backend
            const startingTimeUtcISO = localToUtcIso( vals.startingTime );

            return createRide(
                vals.startingLocationId,
                vals.destinationLocationId,
                startingTimeUtcISO,
                Number(vals.maxPassengers),
                vals.vehicleId
            )

        },
        onSuccess: () => {
            toast.success( "Ride created successfully!" );
            onSuccess?.();
        },
        onError: (error) => {
            console.error( error );
            toast.error( "Failed to create ride", {
                description: error?.message ?? "Unknown error",
            });
        },
    });

    // Handle error
    if (isVehicleFetchingError) { console.error(vehicleFetchingError) }
    if (isLocationFetchingError) { console.error(locationFetchingError) }

    // Initialize form
    const form = useForm<CreateRideFormValues>({
        resolver: zodResolver(createRideSchema),
        defaultValues: {
            startingLocationId   : startingLocation || "",
            destinationLocationId: destinationLocation || "",
            startingTime         : startingTime || "",
            vehicleId            : "",
            maxPassengers        : "",
        },
    });

    // Watch form values for filtering and dynamic updates
    const watchedStartingPoint = form.watch("startingLocationId");
    const watchedDestination   = form.watch("destinationLocationId");


    // Filter locations based on selection
    const getFilteredLocationsForStarting = () => {
        return locations.filter( location => location.id !== watchedDestination );
    };

    const getFilteredLocationsForDestination = () => {
        return locations.filter( location => location.id !== watchedStartingPoint );
    };

    // Handle vehicle selection
    const handleVehicleSelect = (vehicleId: string) => {

        // Check if it's a user vehicle ID
        const selectedVehicle = vehicles.find(v => v.id === vehicleId);

        if (selectedVehicle) {
            // User selected their own vehicle
            form.setValue("vehicleId", selectedVehicle.id);
        } else {
            // User selected a generic vehicle type (2 Wheeler or 4 Wheeler)
            form.setValue("vehicleId", "");
        }

        const maxedPassengers = form.getValues('maxPassengers');

        // Set default passenger count based on vehicle type
        const vehicleType = selectedVehicle?.type;
        setVehicleType(vehicleType);

        if (vehicleType === 'Wheeler2') {
            form.setValue("maxPassengers", "1");
        } else if (vehicleType === "Wheeler4" && !maxedPassengers) {
            form.setValue("maxPassengers", "1");
        }
    };

    // Submit handler
    const submitRide = async (data: CreateRideFormValues) => {
        if ( isCreating ) return;
        mutateRide(data);
    };

    return (
        <div className="bg-[#1A3C34] rounded-xl p-6 shadow-lg">
            <div className="mb-4">
                <h2 className="text-lg font-medium text-white">Create a Ride</h2>
                <p className="text-sm text-white/60 mt-1">
                    Note: Either starting point or destination must be Office. Choose your vehicle and passenger count.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitRide)} className="space-y-4">
                    <div className="space-y-4">
                        {/* Starting point input */}
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
                                        disabled={ isLocationFetching || isCreating }
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            // If destination is the same as selected starting point, clear destination
                                            if ( watchedDestination === value ) {
                                                form.setValue( "startingLocationId", "" );
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
                                        disabled={isLocationFetching || isCreating}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            // If starting point is the same as selected destination, clear starting point
                                            if ( watchedStartingPoint === value ) {
                                                form.setValue( "startingLocationId", "" );
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

                        {/* Vehicle type input */}
                        <FormField
                            control={form.control}
                            name="vehicleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white mb-1 block">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-red-400 mr-1" />
                                            Vehicle
                                        </div>
                                    </FormLabel>
                                    <Select
                                        disabled={ isVehicleFetching || isCreating }
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleVehicleSelect(value);
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                                                <SelectValue placeholder="Select vehicle" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                                            {vehicles.map((vehicle, index) => (
                                                <SelectItem key={index} value={vehicle.id}>
                                                    { vehicle.model || vehicle.type }
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

                        {/* Max Passenger input */}
                        <FormField
                            control={form.control}
                            name="maxPassengers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white mb-1 block">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                                            Number of Passengers
                                        </div>
                                    </FormLabel>
                                    <Select
                                        disabled={ isVehicleFetching || isCreating }
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                                                <SelectValue placeholder="Select number of passengers" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                                            { vehicleType === "Wheeler2" && 
                                                <SelectItem value="1">1</SelectItem>
                                            }
                                            {
                                                ( vehicleType === "Wheeler4" || !vehicleType ) &&
                                                <>
                                                    <SelectItem value="1">1</SelectItem>
                                                    <SelectItem value="2">2</SelectItem>
                                                    <SelectItem value="3">3</SelectItem>
                                                </>
                                            }
                                        </SelectContent>
                                    </Select>
                                    { !vehicleType &&
                                        <p className="text-xs text-amber-300 mt-1">Please select a vehicle first</p>
                                    }
                                    { vehicleType === "Wheeler2" &&
                                        <p className="text-xs text-amber-300 mt-1">2 Wheeler vehicles can only have 1 passenger</p>
                                    }
                                    <FormMessage className="text-red-300" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Submit button */}
                    <Button
                        type="submit"
                        className="w-full bg-[#2E7D32] hover:bg-[#388E3C] mt-6"
                        disabled={isCreating}
                    >
                        { isCreating ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Ride...
                            </span>
                        ) : (
                            "Create Ride"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
} 