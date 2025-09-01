import { RideRequestStatus } from "@prisma/client";

export type PublicRideRequestStatus = RideRequestStatus;

export interface PublicRideRequest {
    id                   : string;
    status               : RideRequestStatus;
    startingLocationId   : string | null;
    destinationLocationId: string | null;
    startingTime         : Date;
    createdAt            : Date;
    userId               : string;
    user                 : {
        name : string | null,
        email: string | null
    }
}

export type PublicAggregatedRideRequests = {
  timeWindowStart: Date;
  timeWindowEnd: Date;
  requests: {
    key: string;
    startingLocationId: string | null;
    destinationLocationId: string | null;
    startingLocation: { id: string; name: string } | null;
    destinationLocation: { id: string; name: string } | null;
    startingTime: Date;
    requestIds: string[];
  }[];
};