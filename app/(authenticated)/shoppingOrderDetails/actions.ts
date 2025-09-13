"use server";

import { auth } from "@/lib/auth/auth";
import { getOrderByExtId } from "@/lib/shopping/orderService";

/**
 * Fetch order details by external order ID
 */
export async function getOrderDetails(extOrderId: string): Promise<{
    id: string;
    userId: string;
    status: "PROCESSING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
    amount: number;
    coinAmount: number;
    conversionRate: number;
    extOrderId: string;
    extUserId: string;
    createdAt: string;
    updatedAt: string;
}> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    const order = await getOrderByExtId(extOrderId, session.user.id);

    return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        amount: order.amount,
        coinAmount: order.coinAmount,
        conversionRate: order.conversionRate,
        extOrderId: order.extOrderId,
        extUserId: order.extUserId,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    };
}
