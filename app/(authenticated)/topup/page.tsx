"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
    rupeesToCarbonPoints,
    formatCarbonPointsForUI,
    carbonPointsToRupees,
} from "@/utils/carbonPointsConversion";
import RazorpayButton from "@/app/_components/payments/Rozorpay";

export default function TopUpPage() {
    const [amount, setAmount] = useState("");
    const [carbonPoints, setCarbonPoints] = useState("");
    const router = useRouter();
    const RUPEES_PER_CARBON_POINT = parseFloat(process.env.NEXT_PUBLIC_RUPEES_PER_CARBON_POINT || "18");

    // Reset states on page mount
    useEffect(() => {
        setAmount("");
        setCarbonPoints("");
    }, []); // Empty dependency array to run only on mount

    // Handle input changes (INR or CP)
    const handleInputChange = (type: "amount" | "carbonPoints", value: string) => {
        const numValue = parseFloat(value) || 0;
        if (type === "amount") {
            setAmount(value);
            setCarbonPoints(numValue >= 0 ? formatCarbonPointsForUI(rupeesToCarbonPoints(numValue)) : "");
        } else {
            setCarbonPoints(value);
            setAmount(numValue >= 0 ? carbonPointsToRupees(numValue).toString() : "");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="bg-[#1A3C34] text-white border-none w-full max-w-md relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-gray-400 cursor-pointer"
                    onClick={() => router.push("/")}
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </Button>
                <CardHeader>
                    <CardTitle>Top Up Carbon Points</CardTitle>
                    <p className="text-sm text-gray-400">
                        Conversion Rate: ₹{RUPEES_PER_CARBON_POINT} = 1 CP
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (INR)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => handleInputChange("amount", e.target.value)}
                            className="bg-black/30 border-gray-700"
                            min="0"
                            step="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="carbonPoints">Carbon Points (CP)</Label>
                        <Input
                            id="carbonPoints"
                            type="number"
                            placeholder="Enter carbon points"
                            value={carbonPoints}
                            onChange={(e) => handleInputChange("carbonPoints", e.target.value)}
                            className="bg-black/30 border-gray-700"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="text-sm text-emerald-400 bg-emerald-500/10 p-2 rounded">
                        {amount && parseFloat(amount) > 0
                            ? `₹${parseFloat(amount).toFixed(2)} → ${carbonPoints} CP`
                            : "Enter an amount to see conversion"}
                    </div>

                    <RazorpayButton
                        carbonCoin={parseFloat(carbonPoints) || 0}
                        onError={(error) => console.log(error)}
                        onSuccess={(paymentId) => router.push(`/paymentDetails/${paymentId}`)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}