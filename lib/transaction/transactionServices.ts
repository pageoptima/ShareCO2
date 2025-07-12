import logger from "@/config/logger";
import { prisma } from "@/config/prisma";

/**
 * Get all transaction for the user
 */
export async function getUserTransactions( userId: string, limits: number = 20 ) {
    try {
        // Get user's transaction
        const transactions = await prisma.transaction.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
            take: limits,
        });

        return transactions;

    } catch ( error ) {
        logger.error( `Error fetching transaction: ${error}`);
        throw error;
    }
}