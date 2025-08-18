"use server";

import { auth } from "@/lib/auth/auth";
import { getPaymentById } from "@/lib/payment/paymentServices";

/**
 * Fetch payment details by payment ID
 */
export async function getPaymentDetails(paymentId: string): Promise<{
    id: string;
    userId: string;
    orderId: string;
    paymentId?: string | null;
    signature?: string | null;
    status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
    amount: number;
    coinAmount: number;
    conversionRate?: number | null;
    currency: string;
    createdAt: string;
    updatedAt: string;
}> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    const payment = await getPaymentById(paymentId, session.user.id);

    return {
        id: payment.id,
        userId: payment.userId,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        signature: payment.signature,
        status: payment.status,
        amount: payment.amount,
        coinAmount: payment.coinAmount,
        conversionRate: payment.conversionRate,
        currency: payment.currency,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
    };
}