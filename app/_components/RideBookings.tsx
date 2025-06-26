import { MyRides } from "./MyRides";

interface Booking {
  id: string;
  userEmail: string;
  status: string;
}

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: string;
  maxPassengers: number;
  bookings?: Booking[];
}

interface RideBookingsProps {
  rides: Ride[];
  onManageBooking: (bookingId: string, action: "confirm" | "deny") => Promise<void>;
  onDataUpdate?: () => Promise<void>;
}

// This component now acts as a wrapper that forwards data to MyRides component
export function RideBookings({ rides, onManageBooking, onDataUpdate }: RideBookingsProps) {
  // Since bookings management has been moved to MyRides component,
  // we simply pass the rides with bookings as createdRides to MyRides
  
  return (
    <MyRides 
      createdRides={rides} 
      bookedRides={[]} 
      onManageBooking={onManageBooking}
      onDataUpdate={onDataUpdate}
    />
  );
}