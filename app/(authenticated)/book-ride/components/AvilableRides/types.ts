import { VehicleType } from "@prisma/client";

export interface PublicAvialableRides {
  id: string;
  startingLocationId: string | null;
  destinationLocationId: string | null;
  startingLocationName: string | undefined;
  destinationLocationName: string | undefined;
  availableSets: number;
  driverName: string | null;
  driverEmail: string;
  driverPhone: string | null;
  startingTime: Date;
  vehicleId: string | undefined;
  vehicleNumber: string | null | undefined;
  vehicleName: string | null | undefined;
  vehicleType: VehicleType | undefined;
}
