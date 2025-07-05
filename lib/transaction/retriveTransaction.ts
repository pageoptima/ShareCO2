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
        });

        return transactions;

    } catch ( error: any ) {
        logger.error( `Error fetching transaction: ${error.stack}`);
        throw new Error( 'Failed to fetch transactions.' );
    }
}