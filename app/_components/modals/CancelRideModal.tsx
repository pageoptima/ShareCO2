"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  amount?: number;
  isThresholdPassed: boolean;
}

export const CancelRideModal: React.FC<CancelRideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  amount,
  isThresholdPassed,
}) => {
  const [phase, setPhase] = React.useState<"threshold" | "reason" | "final">(
    isThresholdPassed ? "threshold" : "reason"
  );
  const [cancelReason, setCancelReason] = React.useState<string>("");

  const handleConfirm = () => {
    if (isThresholdPassed && phase === "threshold") {
      setPhase("reason");
    } else if (phase === "reason") {
      if (cancelReason) {
        setPhase("final");
      }
    } else {
      onConfirm();
    }
  };

  const handleClose = () => {
    setPhase(isThresholdPassed ? "threshold" : "reason");
    setCancelReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A3C34] text-white border-none">
        <DialogHeader>
          <DialogTitle className="text-white">
            {phase === "final"
              ? "Final Confirmation"
              : phase === "reason"
              ? "Reason for Cancellation"
              : "Cancel Ride"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {phase === "final"
              ? "Are you sure you want to cancel this ride? You won't be able to undo this action."
              : phase === "reason"
              ? "Please select a reason for cancelling the ride:"
              : `The threshold time for canceling this ride has passed. A charge of <span className="font-bold text-red-500">${amount} CP</span> will be deducted from your wallet if you proceed.`}
          </DialogDescription>
        </DialogHeader>
        {phase === "reason" && (
          <div className="mt-4 space-y-2">
            <RadioGroup
              value={cancelReason}
              onValueChange={setCancelReason}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vehicle" id="vehicle" />
                <Label htmlFor="vehicle" className="cursor-pointer text-white">
                  Issue with the vehicle
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal" className="cursor-pointer text-white">
                  Personal problem
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="others" />
                <Label htmlFor="others" className="cursor-pointer text-white">
                  Others
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="cursor-pointer bg-gray-800 text-emerald-400 border-emerald-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || (phase === "reason" && !cancelReason)}
            className="cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
