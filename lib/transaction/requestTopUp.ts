"use server";

import { prisma } from "@/config/prisma";
import { z } from "zod";
import logger from "@/config/logger";

const topUpSchema = z.object({
    amount: z.number().positive( 'Amount must be positive' ),
});

/**
 * Submit a top-up request for carbon points
 */
export async function requestTopUp(
    {
        userId,
        amount,
    }: {
        userId: string;
        amount: number;
}) {
    const validation = topUpSchema.safeParse({
        amount,
    });

    if ( ! validation.success ) {
        throw new Error( 'Invalid input data' );
    }

    // Find the user first
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if ( ! user ) {
        throw new Error( 'User not found' );
    }

    try {
        await prisma.topUpRequest.create({
            data: {
                amount,
                phoneNumber: user.phone || '',
                status: "PENDING",
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });
    } catch ( error ) {
        logger.error( `Error on creating topUpRequest. ${error}` );
        throw error;
    }

    return true;
} 