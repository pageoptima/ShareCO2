"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addVehicle, updateVehicle } from "@/app/_actions/manageVehicles";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Define the vehicle types
const vehicleTypes = ["2 Wheeler", "4 Wheeler"] as const;
type VehicleType = typeof vehicleTypes[number];

// Vehicle validation schema
const vehicleSchema = z.object({
  type: z.enum(vehicleTypes, {
    required_error: "Vehicle type is required",
  }),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  model: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: {
    id: string;
    type: string;
    vehicleNumber: string;
    model?: string;
  };
  onSuccess?: () => void;
}

export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      // Cast the type to ensure it's one of the allowed values
      type: (vehicle?.type as VehicleType) || "4 Wheeler",
      vehicleNumber: vehicle?.vehicleNumber || "",
      model: vehicle?.model || "",
    },
  });

  async function onSubmit(data: VehicleFormData) {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateVehicle(vehicle.id, data)
        : await addVehicle(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditing ? "Vehicle updated successfully" : "Vehicle added successfully"
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!isEditing) {
        form.reset({
          type: "4 Wheeler",
          vehicleNumber: "",
          model: "",
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Vehicle Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="bg-black/30 text-white border-gray-700">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                  <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                  <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Vehicle Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., AB12 CDE" 
                  {...field} 
                  disabled={isSubmitting}
                  className="bg-black/30 border-gray-700 text-white"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Model (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Toyota Camry" 
                  {...field} 
                  disabled={isSubmitting}
                  className="bg-black/30 border-gray-700 text-white"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Vehicle"
            : "Add Vehicle"}
        </Button>
      </form>
    </Form>
  );
} 