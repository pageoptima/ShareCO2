import logger from '@/config/logger';
import { NextResponse } from 'next/server';
import { getConversionRate, rupeesToCarbonPoints } from '@/utils/carbonPointsConversion';
import { createExternalOrder } from '@/lib/externalOrder/externalOrderServices';
import { OrderStatus } from '@prisma/client';
import { getUserByEmail } from '@/lib/user/userServices';


const MART_SECRET_KEY = process.env.MART_SECRET_KEY;

/**
 * Requires: Authorization: Bearer <signed-token>
 */
export async function POST(req: Request) {
    try {
        // Check if mart secret key is present or not
        if ( ! MART_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Mart secret key not configured' },
                { status: 500 }
            );
        }

        // Verify Authorization header
        const authHeader = req.headers.get( 'authorization' );
        if ( !authHeader?.startsWith( 'Bearer ' )) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        // Verify secret key
        const secret = authHeader.split(' ')[1];
        if ( secret !== MART_SECRET_KEY ) {
            return NextResponse.json(
                { error: 'Invalid secret key' },
                { status: 403 }
            );
        }

        // Get the order information from request body
        const {
            email  ,    // Email of the user
            orderId,    // External order id
            userId ,    // External user id
            amount ,    // Amount in actual currency
        } = await req.json();

        // Varify param
        if (!email) {
            return NextResponse.json(
                { error: "Missing email parameter" },
                { status: 400 }
            );
        }

        if (!orderId) {
            return NextResponse.json(
                { error: "Missing order id parameter" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Missing user id parameter" },
                { status: 400 }
            );
        }

        if (!amount) {
            return NextResponse.json(
                { error: "Missing amount parameter" },
                { status: 400 }
            );
        }

        // Get the user by email
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get the conversion rate
        const conversionRate = getConversionRate();

        // Convert the amount to carbon point
        const carbonPoint = rupeesToCarbonPoints(amount);

        // Craete external order
        const externalOrder = await createExternalOrder({
            userId        : user.id,
            extOrderId    : orderId,
            extUserId     : userId,
            amount        : amount,
            coinAmount    : carbonPoint,
            conversionRate: conversionRate,
            status        : OrderStatus.PROCESSING,
        });

        if ( ! externalOrder ) {
            return NextResponse.json(
                { error: 'Unable to create order' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            order: {
                id            : externalOrder.id,
                userId        : externalOrder.userId,
                amount        : externalOrder.amount,
                coinAmount    : externalOrder.coinAmount,
                conversionRate: externalOrder.conversionRate,
                createdAt     : externalOrder.createdAt
            },
        });

    } catch (error) {
        logger.error( 'GET /api/mart/order/create error:', error );
        return NextResponse.json(
            { error: 'Unable to create order' },
            { status: 500 }
        );
    }
}