"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, DollarSign } from "lucide-react";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { toast } from "sonner";
import { getPaymentDetails } from "../actions";

// Shimmer Component for Loading State
const Loading = () => (
  <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
    <CardHeader>
      <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <div>
          <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-48 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-64 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-600/50 rounded-full animate-pulse" />
              <div className="h-4 w-56 bg-gray-600/50 rounded animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-gray-600/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

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
    toast.success("Payment ID copied to clipboard");
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error(error);
    toast.error("Failed to load payment details");
    return <div>Error loading payment details</div>;
  }

  if (!payment) {
    return <div>Payment not found</div>;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-white">
          Payment Details
        </CardTitle>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-lg sm:text-xl">
              Top Up: {payment.coinAmount.toFixed(2)} CP
            </span>
          </div>
          <button
            onClick={handleCopyPaymentId}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-sm sm:text-base"
            title="Copy Payment ID"
          >
            <span>{paymentId}</span>
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Payment Overview */}
          <div>
            <h3 className="text-md font-medium text-emerald-300">Overview</h3>
            <div className="mt-2 space-y-2 text-gray-200 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {utcIsoToLocalDate(payment.createdAt)}{" "}
                  {utcIsoToLocalTime12(payment.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Status: </span>
                <Badge
                  className={`text-white ${getStatusColor(payment.status)}`}
                  variant="outline"
                >
                  {payment.status}
                </Badge>
              </div>
              <div>Amount: ₹{payment.amount.toFixed(2)}</div>
              <div>Coin Amount: {payment.coinAmount.toFixed(2)} CP</div>
              <div>
                Conversion Rate: {payment.conversionRate ? `₹${payment.conversionRate.toFixed(2)} = 1 CP` : "N/A"}
              </div>
              <div>Currency: {payment.currency}</div>
              <div>Order ID: {payment.orderId}</div>
              {payment.paymentId && <div>Payment ID: {payment.paymentId}</div>}
              {payment.signature && <div>Signature: {payment.signature}</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentDetailsPage;