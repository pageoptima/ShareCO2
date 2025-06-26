"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRideRequests } from "../_contexts/RideRequestContext";
import { useLocations } from "../_contexts/LocationContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, MapPin } from "lucide-react";

// Form schema
const requestFormSchema = z.object({
  startingPoint: z.string().min(1, "Starting point is required"),
  destination: z.string().min(1, "Destination is required"),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
}).refine((data) => {
  // Ensure one of starting point or destination is "office"
  return data.startingPoint.toLowerCase() === "office" || data.destination.toLowerCase() === "office";
}, {
  message: "Either starting point or destination must be Office",
  path: ["destination"], // Show error on destination field
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RideRequestForm() {
  const { createNewRideRequest } = useRideRequests();
  const { locations, isLoading: locationsLoading } = useLocations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hourOptions, setHourOptions] = useState<string[]>([]);
  const [minuteOptions, setMinuteOptions] = useState<string[]>([]);
  
  // Initialize form first
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      startingPoint: "",
      destination: "",
      hour: "",
      minute: "",
    },
  });
  
  // Create a stable submit handler with useCallback
  const submitRequest = useCallback(async (data: RequestFormValues) => {
    if (isSubmitting) return;
    
    // Validate destination is not the same as starting point
    if (data.startingPoint === data.destination) {
      toast.error("Starting point and destination cannot be the same");
      return;
    }
    
    // Additional validation for office requirement
    if (data.startingPoint.toLowerCase() !== "office" && data.destination.toLowerCase() !== "office") {
      toast.error("Either starting point or destination must be Office");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const startingTime = `${data.hour}:${data.minute}`;
      
      const result = await createNewRideRequest(
        data.startingPoint,
        data.destination,
        startingTime
      );
      
      if (result.success) {
        // Reset form after successful submission
        form.reset();
        // Note: Success toast is already shown in RideRequestContext
        // Don't need to call refreshRideRequests here since
        // createNewRideRequest already does it internally
      }
    } catch (error) {
      console.error("Error submitting ride request:", error);
      toast.error(error instanceof Error ? error.message :"Something went wrong", {
        description: "There was an error submitting your request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [createNewRideRequest, isSubmitting, form]);

  // Watch form values for filtering
  const watchedStartingPoint = form.watch("startingPoint");
  const watchedDestination = form.watch("destination");
  const watchedHour = form.watch("hour");

  // Filter locations based on selection
  const getFilteredLocationsForStarting = () => {
    return locations.filter(location => location !== watchedDestination);
  };

  const getFilteredLocationsForDestination = () => {
    return locations.filter(location => location !== watchedStartingPoint);
  };

  // Generate hour and minute options
  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
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

  // Update minute options based on selected hour
  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
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