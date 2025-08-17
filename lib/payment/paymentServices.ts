import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { createTransaction } from "../transaction/transactionServices";

/**
 * Create a new payment record
 */
export async function createPayment( data: {
    userId         : string;
    orderId        : string;
    amount         : number;
    coinAmount     : number;
    conversionRate?: number;
}) {
    return await prisma.payment.create({
        data: {
            userId        : data.userId,
            orderId       : data.orderId,
            amount        : data.amount,
            coinAmount    : data.coinAmount,
            conversionRate: data.conversionRate,
            status        : PaymentStatus.PENDING,
        },
    });
}

/**
 * Update an existing payment
 */
export async function updatePayment(
    id        : string,
    updateData: Partial<{
        paymentId     : string;
        signature     : string;
        status        : PaymentStatus;
        conversionRate: number;
    }>
) {
    return await prisma.payment.update({
        where: { id },
        data: updateData,
    });
}

/**
 * Update only the status of a payment
 */
export async function updatePaymentStatus(
    {
        id,
        status
    } : {
        id    : string,
        status: PaymentStatus
    }
) {
    return await prisma.payment.update({
        where: { id },
        data: { status },
    });
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string) {
    return await prisma.payment.findUnique({
        where: { id },
        include: {
            user       : true,
            Transaction: true,
        },
    });
}

/**
 * Get payment by  order ID
 */
export async function getPaymentByOrder(orderId: string) {
    return await prisma.payment.findFirst({
        where: { orderId: orderId },
        include: {
            user       : true,
            Transaction: true,
        },
    });
}

/**
 * Get all payments for a user
 */
export async function getPaymentsByUser(userId: string) {
    return await prisma.payment.findMany({
        where  : { userId },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Handle the paiment success
 */
export async function handlePaymentCapture(
    {
        orderId,
        paymentId,
        signature
    }:{
        orderId: string,
        paymentId: string,
        signature: string,
    }
) {
    // create transection in databases ( Payment is successfull ).
    try{

        // Get the payment id
        const payment = await getPaymentByOrder( orderId );

        // Validate payment exist
        if ( ! payment ) {
            logger.error(`There is no payment in database.`);
            throw new Error('There is no payment in database.');
        }

        if ( payment.status === 'COMPLETED' ) {
            return true;
        }

        // Create payment transection
        await createTransaction({
            userId     : payment.userId,
            paymentId  : payment.id,
            type       : TransactionType.CREDIT,
            amount     : payment.amount,
            coinAmount : payment.coinAmount,
            metadata   : { conversionRate: payment.conversionRate },
            description: `Razorpay transection`
        })

        // Update the payment
        await updatePayment(
            payment.id,
            {
                status:    PaymentStatus.COMPLETED,
                paymentId: paymentId,
                signature: signature,
            }
        );

    } catch (error) {
        logger.error(`Database manupulation error when create transection. ${error}`);
        throw new Error('Database manupulation error when create transection.');
    }

    return true;
}

/**
 * Handle the payment failer
 */
export async function handlePaymentFailed(
    {
        orderId,
        paymentId,
        signature
    }:{
        orderId: string,
        paymentId: string,
        signature: string,
    }
) {
    // Update the payment status in payment failed
    try{

        // Get the payment id
        const payment = await getPaymentByOrder( orderId );

        // Validate payment exist
        if ( ! payment ) {
            logger.error(`There is no payment in database.`);
            throw new Error('There is no payment in database.');
        }

        // Update the payment
        await updatePayment(
            payment.id,
            {
                status:    PaymentStatus.FAILED,
                paymentId: paymentId,
                signature: signature,
            }
        );

    } catch (error) {
        logger.error(`Database manupulation error when handle payment failed. ${error}`);
        throw new Error('Database manupulation error when handle payment failed.');
    }

    return true;
}