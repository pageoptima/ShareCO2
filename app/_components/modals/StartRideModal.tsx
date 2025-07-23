// components/modals/StartRideModal.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { UserCircle, CheckCircle, XCircle } from "lucide-react";

interface Booking {
  id: string;
  user: {
    name?: string | null;
    email: string | null;
  };
  status: string;
}

interface StartRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedRiders: string[], rejectedRiders: string[]) => void;
  bookings: Booking[];
}

export const StartRideModal: React.FC<StartRideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookings,
}) => {
  const [riderStatuses, setRiderStatuses] = useState<{
    [key: string]: "reached" | "rejected" | null;
  }>(Object.fromEntries(bookings.map((booking) => [booking.id, null])));
  const [phase, setPhase] = useState<"selection" | "final">("selection");

  const handleRiderAction = (
    bookingId: string,
    action: "reached" | "rejected"
  ) => {
    setRiderStatuses((prev) => ({ ...prev, [bookingId]: action }));
  };

  const handleConfirm = () => {
    if (phase === "selection") {
      setPhase("final");
    } else {
      const confirmedRiders = Object.entries(riderStatuses)
        .filter(([, status]) => status === "reached")
        .map(([bookingId]) => bookingId);
      const rejectedRiders = Object.entries(riderStatuses)
        .filter(([, status]) => status === "rejected")
        .map(([bookingId]) => bookingId);
      onConfirm(confirmedRiders, rejectedRiders);
    }
  };

  const handleClose = () => {
    setPhase("selection");
    setRiderStatuses(
      Object.fromEntries(bookings.map((booking) => [booking.id, null]))
    );
    onClose();
  };

  const isConfirmDisabled = Object.values(riderStatuses).some(
    (status) => status === null
  );

  const rejectedRiders = Object.entries(riderStatuses)
    .filter(([, status]) => status === "rejected")
    .map(([bookingId]) => bookings.find((booking) => booking.id === bookingId));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A3C34] text-white border-none">
        <DialogHeader>
          <DialogTitle className="text-white">
            {phase === "final" ? "Final Confirmation" : "Rider Confirmation"}
          </DialogTitle>
          {phase === "final" && (
            <DialogDescription className="text-gray-400">
              {rejectedRiders.length > 0 ? (
                <>
                  {rejectedRiders.map((booking) => (
                    <p key={booking!.id}>
                      Are you sure you want to cancel this rider&apos;s booking?
                      You won&apos;t be able to undo this action. A fine will be
                      charged from{" "}
                      <span className="font-bold text-red-500">
                        {booking!.user.name || booking!.user.email}
                      </span>
                      .
                    </p>
                  ))}
                </>
              ) : (
                <p>
                  Are you sure you want to proceed with the selected riders?
                </p>
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        {phase === "selection" && (
          <div className="space-y-4 py-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border border-emerald-600/30 flex justify-center items-center">
                    <UserCircle className="h-5 w-5" />
                  </Avatar>
                  <span className="text-sm font-medium text-white">
                    {booking.user.name || booking.user.email}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={`${
                      riderStatuses[booking.id] === "reached"
                        ? "bg-emerald-500/40"
                        : "bg-emerald-500/20 hover:bg-emerald-500/40"
                    } text-emerald-300 border border-emerald-500/30 cursor-pointer`}
                    onClick={() => handleRiderAction(booking.id, "reached")}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Reached
                  </Button>
                  <Button
                    size="sm"
                    className={`${
                      riderStatuses[booking.id] === "rejected"
                        ? "bg-red-500/40"
                        : "bg-red-500/20 hover:bg-red-500/40"
                    } text-red-300 border border-red-500/30 cursor-pointer`}
                    onClick={() => handleRiderAction(booking.id, "rejected")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="cursor-pointer bg-gray-800 text-emerald-400 border-emerald-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={phase === "selection" && isConfirmDisabled}
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
