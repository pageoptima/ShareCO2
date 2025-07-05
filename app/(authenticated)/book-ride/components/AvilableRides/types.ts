import { VehicleType } from "@prisma/client";

export interface PublicAvialableRides {
    id                     : string,
    startingLocationId     : string | null;
    destinationLocationId  : string | null;
    startingLocationName   : string | undefined;
    destinationLocationName: string | undefined;
    availableSets          : number,
    driverName             : string | null,
    driverEmail            : string,
    startingTime           : Date,
    vehicleId              : string | undefined,
    vehicleName            : string | null | undefined,
    vehicleType            : VehicleType | undefined,
}