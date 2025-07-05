import { VehicleType, Vehicle } from "@prisma/client";

/**
 * Interface for vehicle argument data for frontend
 */
export interface PublicVehicleArgs {
    type          : VehicleType;
    vehicleNumber : string;
    model        ?: string;
};

/**
 * Type for public vehicle type's type
 */
export type PublicVehicleType = VehicleType;

/**
 * Type for public vehicle
 */
export type PublicVehicle = Vehicle;

/**
 * Vahicle type label map
 */
export const vehicleTypeLabels: Record<PublicVehicleType, string> = {
  Wheeler2: "2 Wheeler",
  Wheeler4: "4 Wheeler",
};