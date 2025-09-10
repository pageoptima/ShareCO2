import logger from '@/config/logger';
import { NextResponse } from 'next/server';
import { cancelExternalOrder } from '@/lib/externalOrder/externalOrderServices';


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
        const { orderId } = await req.json();

        // Varify params
        if (!orderId) {
            return NextResponse.json(
                { error: "Missing order id parameter" },
                { status: 400 }
            );
        }

        // Cancel the external order
        const success = await cancelExternalOrder(orderId);

        if ( ! success ) {
            return NextResponse.json(
                { error: 'Unable to cancel order' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error( 'GET /api/mart/order/cancel error:', error );
        return NextResponse.json(
            { error: 'Unable to cancel order' },
            { status: 500 }
        );
    }
}