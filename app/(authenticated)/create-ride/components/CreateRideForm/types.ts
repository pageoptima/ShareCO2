import { RideStatus } from "@prisma/client";
import { VehicleType, Vehicle } from "@prisma/client";

export interface PublicRide {
    id: string;
    vehicleId: string | null;
    maxPassengers: number;
    status: RideStatus;
    createdAt: Date;
    driverId: string;
    startingTime: Date;
    startingLocationId: string | null;
    destinationLocationId: string | null;
    carbonCost: number;

}

export type PublicRideStatus = RideStatus;

export type PublicVehicleType = VehicleType;

export type PublicVehicle = Vehicle;

export const vehicleTypeLabels: Record<PublicVehicleType, string> = {
  Wheeler2: "2 Wheeler",
  Wheeler4: "4 Wheeler",
};

export interface PublicLocation {
    id: string;
    name: string;
    distanceFromOrg: number;
}