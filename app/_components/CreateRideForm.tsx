"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { createRide } from "../_actions/createRide";
import { toast } from "sonner";
import { useAuth } from "../_contexts/AuthContext";
import { useLocations } from "../_contexts/LocationContext";
import { MapPin, Clock, Users } from "lucide-react";

interface Vehicle {
  id: string;
  type: string;
  vehicleNumber: string;
  model?: string;
}

interface CreateRideFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialTime?: string;
  onSuccess?: () => void;
  selectedRoute?: {
    from: string;
    to: string;
    time: string;
  } | null;
}

// Form schema with validation
const createRideSchema = z.object({
  startingPoint: z.string().min(1, "Starting point is required"),
  destination: z.string().min(1, "Destination is required"),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  vehicleType: z.string().min(1, "Vehicle is required"),
  vehicleId: z.string().optional(),
  maxPassengers: z.string().min(1, "Number of passengers is required"),
}).refine((data) => {
  // Ensure one of starting point or destination is "office"
  return data.startingPoint.toLowerCase() === "office" || data.destination.toLowerCase() === "office";
}, {
  message: "Either starting point or destination must be Office",
  path: ["destination"],
}).refine((data) => {
  // Ensure starting point and destination are different
  return data.startingPoint !== data.destination;
}, {
  message: "Starting point and destination must be different",
  path: ["destination"],
});

type CreateRideFormValues = z.infer<typeof createRideSchema>;

export default function CreateRideForm({ 
  initialFrom, 
  initialTo, 
  initialTime, 
  onSuccess,
  selectedRoute
}: CreateRideFormProps) {
  const { userData, refreshUserData } = useAuth();
  const { locations, isLoading: locationsLoading } = useLocations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hourOptions, setHourOptions] = useState<string[]>([]);
  const [minuteOptions, setMinuteOptions] = useState<string[]>([]);

  // Get user vehicles
  const userVehicles: Vehicle[] = userData?.vehicles || [];

  // Parse initial time if provided
  const getInitialHour = () => {
    if (initialTime) {
      const [hour] = initialTime.split(':');
      return hour?.padStart(2, '0') || "";
    }
    return "";
  };

  const getInitialMinute = () => {
    if (initialTime) {
      const [, minute] = initialTime.split(':');
      return minute?.padStart(2, '0') || "";
    }
    return "";
  };

  // Initialize form
  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      startingPoint: initialFrom || "",
      destination: initialTo || "",
      hour: getInitialHour(),
      minute: getInitialMinute(),
      vehicleType: "",
      vehicleId: "",
      maxPassengers: "",
    },
  });

  // Watch form values for filtering and dynamic updates
  const watchedStartingPoint = form.watch("startingPoint");
  const watchedDestination = form.watch("destination");
  const watchedHour = form.watch("hour");
  const watchedVehicleType = form.watch("vehicleType");
  const watchedMaxPassengers = form.watch("maxPassengers");

  // Filter locations based on selection
  const getFilteredLocationsForStarting = () => {
    return locations.filter(location => location !== watchedDestination);
  };

  const getFilteredLocationsForDestination = () => {
    return locations.filter(location => location !== watchedStartingPoint);
  };

  // Generate hour and minute options (client-side only to avoid hydration mismatch)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const minHour = oneHourFromNow.getHours();
    const hours: string[] = [];
    for (let h = minHour; h <= 23; h++) {
      hours.push(h.toString().padStart(2, "0"));
    }
    setHourOptions(hours);

    // Generate 15-minute intervals: 00, 15, 30, 45
    const minutes: string[] = [];
    for (let m = 0; m < 60; m += 15) {
      minutes.push(m.toString().padStart(2, "0"));
    }
    setMinuteOptions(minutes);
  }, []);

  // Update minute options based on selected hour (client-side only)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const minHour = oneHourFromNow.getHours();
    const minMinute = oneHourFromNow.getMinutes();

    if (watchedHour && parseInt(watchedHour) === minHour) {
      // For the current hour, only show 15-minute intervals that are in the future
      const restrictedMinutes: string[] = [];
      for (let m = 0; m < 60; m += 15) {
        if (m > minMinute) {
          restrictedMinutes.push(m.toString().padStart(2, "0"));
        }
      }
      setMinuteOptions(restrictedMinutes);
    } else {
      // For future hours, show all 15-minute intervals
      const allMinutes: string[] = [];
      for (let m = 0; m < 60; m += 15) {
        allMinutes.push(m.toString().padStart(2, "0"));
      }
      setMinuteOptions(allMinutes);
    }
  }, [watchedHour]);

  // Update form when route is selected from parent component
  useEffect(() => {
    if (selectedRoute) {
      const [hour, minute] = selectedRoute.time.split(':');
      form.setValue("startingPoint", selectedRoute.from);
      form.setValue("destination", selectedRoute.to);
      form.setValue("hour", hour?.padStart(2, '0') || "");
      form.setValue("minute", minute?.padStart(2, '0') || "");
    }
  }, [selectedRoute, form]);

  // Handle vehicle selection
  const handleVehicleSelect = (value: string) => {
    // Check if it's a user vehicle ID
    const selectedVehicle = userVehicles.find(v => v.id === value);
    
    if (selectedVehicle) {
      // User selected their own vehicle
      form.setValue("vehicleId", selectedVehicle.id);
      form.setValue("vehicleType", selectedVehicle.type);
    } else {
      // User selected a generic vehicle type (2 Wheeler or 4 Wheeler)
      form.setValue("vehicleId", "");
      form.setValue("vehicleType", value);
    }

    // Set default passenger count based on vehicle type
    const vehicleType = selectedVehicle ? selectedVehicle.type : value;
    if (vehicleType === "2 Wheeler") {
      form.setValue("maxPassengers", "1");
    } else if (vehicleType === "4 Wheeler" && !watchedMaxPassengers) {
      form.setValue("maxPassengers", "1");
    }
  };

  // Submit handler
  const submitRide = useCallback(async (data: CreateRideFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startingTime = `${data.hour}:${data.minute}`;
      const maxPassengers = parseInt(data.maxPassengers);
      
      const result = await createRide(
        data.startingPoint,
        data.destination,
        startingTime,
        maxPassengers,
        data.vehicleType,
        data.vehicleId || undefined
      );

      if (result.success) {
        toast.success("Success", {
          description: result.message,
        });

        // Reset form
        form.reset({
          startingPoint: "",
          destination: "",
          hour: "",
          minute: "",
          vehicleType: "",
          vehicleId: "",
          maxPassengers: "",
        });

        // Refresh user data and call success callback
        await refreshUserData();
        onSuccess?.();
      } else {
        toast.error("Error", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error creating ride:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create ride.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, form, refreshUserData, onSuccess]);

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
            <FormField
              control={form.control}
              name="startingPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white mb-1 block">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-emerald-400 mr-1" />
                      Starting Point
                    </div>
                  </FormLabel>
                  <Select
                    disabled={locationsLoading || isSubmitting}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // If destination is the same as selected starting point, clear destination
                      if (watchedDestination === value) {
                        form.setValue("destination", "");
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
                      {getFilteredLocationsForStarting().map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white mb-1 block">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-red-400 mr-1" />
                      Destination
                    </div>
                  </FormLabel>
                  <Select
                    disabled={locationsLoading || isSubmitting}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // If starting point is the same as selected destination, clear starting point
                      if (watchedStartingPoint === value) {
                        form.setValue("startingPoint", "");
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
                      {getFilteredLocationsForDestination().map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white mb-1 block">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        Hour
                      </div>
                    </FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1A3C34] text-white border-gray-700 max-h-[200px]">
                        {hourOptions.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white mb-1 block">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        Minute
                      </div>
                    </FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1A3C34] text-white border-gray-700 max-h-[200px]">
                        {minuteOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white mb-1 block">Your Vehicle</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleVehicleSelect(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                        <SelectValue placeholder="Select your vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                      {/* Show user vehicles first if they exist */}
                      {userVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.type} - {vehicle.vehicleNumber} {vehicle.model ? `(${vehicle.model})` : ''}
                        </SelectItem>
                      ))}
                      {/* Always show generic vehicle options */}
                      <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                      <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

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
                    disabled={isSubmitting || !watchedVehicleType}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-black/30 text-white border-gray-700">
                        <SelectValue placeholder="Select number of passengers" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                      {watchedVehicleType === "2 Wheeler" ? (
                        <SelectItem value="1">1</SelectItem>
                      ) : watchedVehicleType === "4 Wheeler" || (userVehicles.find(v => v.id === watchedVehicleType)?.type === "4 Wheeler") ? (
                        <>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="1" disabled>Select vehicle first</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!watchedVehicleType && (
                    <p className="text-xs text-amber-300 mt-1">Please select a vehicle first</p>
                  )}
                  {(watchedVehicleType === "2 Wheeler" || (userVehicles.find(v => v.id === watchedVehicleType)?.type === "2 Wheeler")) && (
                    <p className="text-xs text-amber-300 mt-1">2 Wheeler vehicles can only have 1 passenger</p>
                  )}
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2E7D32] hover:bg-[#388E3C] mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
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