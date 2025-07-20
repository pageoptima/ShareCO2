"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { addVehicle, updateVehicle } from "../actions";
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
import { PublicVehicleType } from "../types";

// Options array with value + label
const vehicleOptions: { value: PublicVehicleType; label: string }[] = [
  { value: "Wheeler2", label: "2 Wheeler" },
  { value: "Wheeler4", label: "4 Wheeler" },
];

// Zod schema uses backend values
const vehicleSchema = z.object({
  type: z.enum(
    vehicleOptions.map((o) => o.value) as [
      PublicVehicleType,
      PublicVehicleType
    ],
    { required_error: "Vehicle type is required" }
  ),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  model: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: {
    id: string;
    type: PublicVehicleType;
    vehicleNumber: string;
    model?: string;
  };
  onSuccess?: () => void;
}

export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
  const isEditing = Boolean(vehicle);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: vehicle?.type ?? "Wheeler4",
      vehicleNumber: vehicle?.vehicleNumber ?? "",
      model: vehicle?.model ?? "",
    },
  });

  // Add mutation hook
  const addMutation = useMutation({
    mutationFn: addVehicle, // Simplified, assuming addVehicle is already defined correctly
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Vehicle added successfully");
        form.reset({ type: "Wheeler4", vehicleNumber: "", model: "" });
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleFormData }) =>
      updateVehicle(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Vehicle updated successfully");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (isEditing && vehicle) {
      updateMutation.mutate({ id: vehicle.id, data });
    } else {
      addMutation.mutate(data);
    }
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Vehicle Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Vehicle Type</FormLabel>
              <Select
                onValueChange={(val) =>
                  field.onChange(val as PublicVehicleType)
                }
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="bg-black/30 text-white border-gray-700">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#1A3C34] text-white border-gray-700">
                  {vehicleOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Vehicle Number */}
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

        {/* Model */}
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

        {/* Submit */}
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
