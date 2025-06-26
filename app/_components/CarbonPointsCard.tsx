"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { requestTopUp } from "@/app/_actions/requestTopUp";
import { rupeesToCarbonPoints, RUPEES_PER_CARBON_POINT, formatCarbonPointsForUI } from "@/lib/carbonPointsConversion";

interface CarbonPointsCardProps {
  carbonPoints: number;
}

export function CarbonPointsCard({ carbonPoints }: CarbonPointsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate preview of carbon points
  const getPointsPreview = () => {
    const amountNum = parseInt(amount) || 0;
    if (amountNum <= 0) return "0.00";
    return formatCarbonPointsForUI(rupeesToCarbonPoints(amountNum));
  };

  const handleTopUpRequest = async () => {
    // Validate inputs
    if (!amount || parseInt(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        amount: parseInt(amount),
        phoneNumber,
      };

      const result = await requestTopUp(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Top-up request submitted");
        setIsModalOpen(false);
        // Reset form
        setAmount("");
        setPhoneNumber("");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="bg-[#1A3C34] text-white border-none">
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-300 text-center">Carbon Points</p>
            <p className="text-2xl font-semibold text-center">{formatCarbonPointsForUI(carbonPoints)} CP</p>
          </div>
          <Button 
            className="w-full bg-[#2E7D32] hover:bg-[#388E3C]"
            onClick={() => setIsModalOpen(true)}
          >
            Top Up
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1A3C34] text-white border-none">
          <DialogHeader>
            <DialogTitle className="text-white">Top Up Carbon Points</DialogTitle>
            <p className="text-sm text-gray-400 mt-2">
              Conversion Rate: ₹{RUPEES_PER_CARBON_POINT} = 1 Carbon Point (Precise decimal calculation)
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">Amount (INR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
                min="1"
              />
              <p className="text-xs text-gray-400">Any positive amount accepted (₹{RUPEES_PER_CARBON_POINT} = 1.00 CP)</p>
              {amount && parseInt(amount) > 0 && (
                <div className="text-sm text-emerald-400 bg-emerald-500/10 p-2 rounded">
                  ₹{amount} → {getPointsPreview()} Carbon Points
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  // Limit to 10 digits
                  if (value.length <= 10) {
                    setPhoneNumber(value);
                  }
                }}
                className="bg-black/30 border-gray-700 text-white"
                maxLength={10}
                pattern="[0-9]{10}"
              />
              <p className="text-xs text-gray-400">Enter a 10-digit phone number</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              onClick={handleTopUpRequest}
              className="bg-[#2E7D32] hover:bg-[#388E3C]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Top Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}