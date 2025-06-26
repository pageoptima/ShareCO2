"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { acceptDisclaimer } from "@/app/_actions/acceptDisclaimer";

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptDisclaimer();
      
      if (result.success) {
        toast.success("Disclaimer accepted successfully");
        onAccept();
      } else {
        toast.error(result.error || "Failed to accept disclaimer");
      }
    } catch (error) {
      console.error("Error accepting disclaimer:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#1A3C34] text-white border-none max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Share CO2 - Terms of Service & Disclaimer
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm text-gray-200">
            <section>
              <h3 className="font-semibold text-white mb-2">1. Acceptance of Terms</h3>
              <p>
                By using Share CO2, you agree to comply with and be bound by these terms and conditions. 
                If you do not agree with any part of these terms, you must not use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">2. Service Description</h3>
              <p>
                Share CO2 is a ride-sharing platform that connects drivers and passengers to reduce carbon 
                emissions through shared transportation. We facilitate connections but are not responsible 
                for the actual transportation services.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">3. Safety Disclaimer</h3>
              <p className="font-medium text-yellow-200">
                ⚠️ Important Safety Notice:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Share CO2 does not verify driver licenses, vehicle conditions, or insurance coverage</li>
                <li>Users ride at their own risk and responsibility</li>
                <li>We recommend verifying driver identity and vehicle details before boarding</li>
                <li>Always trust your instincts and prioritize your safety</li>
                <li>Share trip details with trusted contacts</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">4. Limitation of Liability</h3>
              <p>
                Share CO2 is not liable for any accidents, injuries, damages, or losses that may occur 
                during or as a result of using our platform. Users participate at their own risk.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">5. Carbon Points System</h3>
              <p>
                Carbon points are virtual credits within our platform. They have no monetary value outside 
                the Share CO2 ecosystem and cannot be exchanged for cash.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">6. User Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate information about yourself and your trips</li>
                <li>Respect other users and follow community guidelines</li>
                <li>Ensure you have valid documentation for driving (if you&apos;re a driver)</li>
                <li>Report any safety concerns or inappropriate behavior</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">7. Privacy & Data</h3>
              <p>
                We collect and process personal data in accordance with our Privacy Policy. 
                By using Share CO2, you consent to the collection and use of your information 
                as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-white mb-2">8. Modifications</h3>
              <p>
                Share CO2 reserves the right to modify these terms at any time. 
                Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
              <h3 className="font-semibold text-red-300 mb-2">⚠️ Critical Safety Reminder</h3>
              <p className="text-red-200">
                Your safety is paramount. Share CO2 is a platform that connects users but does not 
                provide transportation services directly. Always exercise caution, verify driver 
                and vehicle information, and trust your instincts when using shared transportation.
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <div className="w-full space-y-3">
            <p className="text-xs text-gray-400 text-center">
              By clicking &quot;I Accept&quot;, you acknowledge that you have read, understood, and agree to these terms.
            </p>
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full bg-[#2E7D32] hover:bg-[#388E3C] py-3"
            >
              {isAccepting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "I Accept - Continue to Share CO2"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 