export type RideStatus = "Active" | "Pending" | "Completed" | "Cancelled";
export type RideBookingStatus =
  | "Active"
  | "Confirmed"
  | "CancelledUser"
  | "CancelledDriver"
  | "Completed"
  | "Denied";

export interface RideDetails {
  id: string;
  driver: {
    id: string;
    name: string;
    email: string;
  };
  startingTime: Date;
  startingLocation: { id: string; name: string } | null;
  destinationLocation: { id: string; name: string } | null;
  status: RideStatus;
  vehicle: { id: string; type: string; model: string } | null;
  carbonCost: number;
  maxPassengers: number;
  createdAt: Date;
  bookings: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    carbonCost: number;
    status: RideBookingStatus;
    createdAt: Date;
  }[];
}

export type PublicRideStatus = "Active" | "Pending" | "Completed" | "Cancelled";

export type PublicRideBookingStatus =
  | "Active"
  | "Confirmed"
  | "CancelledUser"
  | "CancelledDriver"
  | "Completed"
  | "Denied";