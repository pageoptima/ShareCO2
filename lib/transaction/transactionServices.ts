import { prisma } from "@/config/prisma";
import { TransactionType } from "@prisma/client";
import { creditUserTopup } from "@/lib/wallet/walletServices";

/**
 * Create a new transaction
 */
export async function createTransaction( data: {
    userId      : string;
    paymentId   : string,
    type        : TransactionType;
    amount      : number;
    coinAmount  : number;
    metadata   ?: object;
    description : string;
}) {

    await prisma.$transaction(async (tx) => {
        
        // Create a new transection entry
        const transaction = await tx.transaction.create({ data });

        // Insert new wallet entry for this transection
        await creditUserTopup({
            tx,
            userId: transaction.userId,
            transactionId: transaction.id,
            amount: transaction.coinAmount
        });

    });

    return true;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
    id: string,
    updateData: Partial<{
        type       : TransactionType;
        amount     : number;
        coinAmount : number;
        metadata   : object;
        description: string;
        paymentId  : string | null;
    }>
) {
    return await prisma.transaction.update({
        where: { id },
        data : updateData,
    });
}

/**
 * Get a transaction by ID
 */
export async function getTransactionById(id: string) {
    return await prisma.transaction.findUnique({
        where: { id },
    });
}

/**
 * Get multiple transactions with optional filters
 */
export async function getTransactions( filters?: {
    userId   ?: string;
    type     ?: TransactionType;
    paymentId?: string;
}) {
    return await prisma.transaction.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
    });
}
