"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, Home } from "lucide-react";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { toast } from "sonner";
import { getPaymentDetails } from "../actions";
import { ScrollArea } from "@/components/ui/scroll-area";

// Shimmer Component for Loading State
const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`;
const Loading = () => {
  return (
    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border-gray-700/30 max-w-2xl mx-auto shadow-lg h-auto">
      <CardHeader className="border-b border-gray-700/20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Title Placeholder */}
          <div className={`${shimmer} h-8 w-48 bg-gray-700/50 rounded-md`} />
          {/* Home Button Placeholder */}
          <Button
            variant="ghost"
            className="text-gray-400 flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1"
            disabled
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
          {/* Amount Placeholder */}
          <div className="flex items-center gap-3">
            <div className={`${shimmer} h-8 w-8 bg-gray-700/50 rounded-full`} />
            <div className={`${shimmer} h-6 w-32 bg-gray-700/50 rounded-md`} />
          </div>
          {/* Payment ID Button Placeholder */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
            <div className={`${shimmer} h-5 w-40 bg-gray-700/50 rounded-md`} />
            <Copy className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        {/* Conversion Rate Placeholder */}
        <div className={`${shimmer} h-5 w-64 bg-gray-700/50 rounded-md mt-2`} />
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              {/* Overview Title Placeholder */}
              <div className={`${shimmer} h-6 w-32 bg-gray-700/50 rounded-md mb-2`} />
              <div className="mt-4 space-y-3">
                {/* Amount Placeholder */}
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg">
                  <div className={`${shimmer} h-5 w-48 bg-gray-600/50 rounded-md`} />
                </div>
                {/* Coin Amount Placeholder */}
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg">
                  <div className={`${shimmer} h-5 w-48 bg-gray-600/50 rounded-md`} />
                </div>
                {/* Currency Placeholder */}
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg">
                  <div className={`${shimmer} h-5 w-48 bg-gray-600/50 rounded-md`} />
                </div>
                {/* Date/Time Placeholder */}
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div className={`${shimmer} h-5 w-48 bg-gray-600/50 rounded-md`} />
                </div>
                {/* Status Placeholder */}
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg">
                  <div className={`${shimmer} h-5 w-24 bg-gray-600/50 rounded-md`} />
                  <Badge className="p-2 rounded-full bg-gray-700/50" variant="outline">
                    <div className={`${shimmer} h-4 w-20 bg-gray-600/50 rounded-md`} />
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

/**
 * Get the color of the payment status
 */
const getStatusColor = (status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED") => {
  switch (status) {
    case "PENDING":
      return "text-amber-400";
    case "COMPLETED":
      return "text-emerald-400";
    case "CANCELLED":
      return "text-red-400";
    case "FAILED":
      return "text-orange-400";
    default:
      return "";
  }
};

const PaymentDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;

  const {
    data: payment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payment-details", paymentId],
    queryFn: () => getPaymentDetails(paymentId),
  });

  const handleCopyPaymentId = () => {
    navigator.clipboard.writeText(paymentId);
    toast.success("Payment ID copied to clipboard", { duration: 2000 });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error(error);
    toast.error("Failed to load payment details", { duration: 2000 });
    return <div className="text-red-400 text-center mt-10">Error loading payment details</div>;
  }

  if (!payment) {
    return <div className="text-gray-400 text-center mt-10">Payment not found</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border-gray-700/30 max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 h-auto">
      <CardHeader className="border-b border-gray-700/20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Payment Details
          </CardTitle>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-gray-200 cursor-pointer flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50 rounded-lg px-3 py-1 transition-all duration-200"
            onClick={() => router.push("/")}
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-3xl text-emerald-400">₹</span>
            <span className="text-xl sm:text-2xl font-semibold text-white">
              Amount: {payment.amount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleCopyPaymentId}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
            title="Copy Payment ID"
          >
            <span className="text-sm">{paymentId}</span>
            <Copy className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-green-500 mt-2 animate-pulse-slow">
          Conversion Rate: {payment.conversionRate ? `₹${payment.conversionRate.toFixed(2)} = 1 CP` : "N/A"}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-emerald-300 border-b border-emerald-400/30 pb-2">
                Overview
              </h3>
              <div className="mt-4 space-y-3 text-gray-200 text-base">
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                  <span>Amount: ₹{payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                  <span>Coin Amount: {payment.coinAmount.toFixed(2)} CP</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                  <span>Currency: {payment.currency}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span>
                    {utcIsoToLocalDate(payment.createdAt)}{" "}
                    {utcIsoToLocalTime12(payment.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-700/20 rounded-lg hover:bg-gray-600/20 transition-colors">
                  <span>Status: </span>
                  <Badge
                    className={`text-white ${getStatusColor(payment.status)} p-2 rounded-full`}
                    variant="outline"
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PaymentDetailsPage;