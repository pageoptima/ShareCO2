
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

interface CarbonEmissionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    carbonSaved: number; // In grams
}

const CarbonEmissionPopup: React.FC<CarbonEmissionPopupProps> = ({
    isOpen,
    onClose,
    carbonSaved,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white/5 backdrop-blur-sm border border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-400">
                        <Leaf className="h-5 w-5" />
                        Eco-Friendly Ride
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center py-4">
                    <p className="text-gray-200">
                        Congratulations! You saved{" "}
                        <span className="font-bold text-emerald-400">{carbonSaved}gm</span> of carbon
                        emissions by sharing this ride.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Button
                        onClick={onClose}
                        className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 cursor-pointer"
                    >
                        Great!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CarbonEmissionPopup;