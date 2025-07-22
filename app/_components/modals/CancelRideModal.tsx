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
  const [showFinalConfirmation, setShowFinalConfirmation] =
    React.useState(false);

  const handleConfirm = () => {
    if (isThresholdPassed && !showFinalConfirmation) {
      setShowFinalConfirmation(true);
    } else {
      onConfirm();
    }
  };

  const handleClose = () => {
    setShowFinalConfirmation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {showFinalConfirmation ? "Final Confirmation" : "Cancel Ride"}
          </DialogTitle>
          <DialogDescription>
            {showFinalConfirmation ? (
              "Are you sure you want to cancel this ride? undo can't be done thereafter!"
            ) : isThresholdPassed ? (
              <>
                The threshold time for canceling this ride has passed. A charge
                of <span className="font-bold">₹{amount}</span> will be deducted
                from your wallet if you proceed.
              </>
            ) : (
              "Are you sure you want to cancel this ride? undo can't be done thereafter!"
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
