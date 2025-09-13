import logger from "@/config/logger";
import { prisma } from "@/config/prisma";

/**
 * Get order details by external order ID
 */
export async function getOrderByExtId(extOrderId: string, userId: string) {
    try {
        const order = await prisma.externalOrder.findUnique({
            where: { extOrderId, userId },
            select: {
                id: true,
                userId: true,
                status: true,
                amount: true,
                coinAmount: true,
                conversionRate: true,
                extOrderId: true,
                extUserId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!order) {
            throw new Error("Order not found or not authorized");
        }

        return order;
    } catch (error) {
        logger.error(
            `Error fetching order by external ID ${extOrderId}: ${error}`
        );
        throw error;
    }
}
