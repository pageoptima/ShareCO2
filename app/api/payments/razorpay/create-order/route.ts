import logger from '@/config/logger';
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { convertToRazorpayAmount, createOrder } from '@/services/razorpay';
import { carbonPointsToRupees, getConversionRate } from '@/utils/carbonPointsConversion';
import { createPayment } from '@/lib/payment/paymentServices';
import { formatError } from '@/utils/error';

export async function POST(req: Request) {

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    // Get the device information from request body
    const { carbonCoin } = await req.json();

    if ( !carbonCoin ) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get rupise amount from carbonpoint
    const amount = carbonPointsToRupees(carbonCoin);

    // Get conversion rate
    const conversionRate = getConversionRate();

    // Try to create rozorpay order
    let razorpayOrder = null;
    try {
        razorpayOrder = await createOrder({
            amount: convertToRazorpayAmount(amount),
            currency: "INR",
            receipt: "receipt#1",
            notes: {
                carbonCoin: carbonCoin,
                carbonCost: conversionRate,
            },
        });

    } catch ( error ) {
        logger.error(`Unable to craeate razorpay order: ${formatError(error)}`);
        return NextResponse.json({ error: 'Unable to create razorpay order' }, { status: 500 });
    }

    // Try to register payment in database
    try{
        await createPayment({
            userId        : userId,
            orderId       : razorpayOrder.id,
            amount        : amount,
            coinAmount    : carbonCoin,
            conversionRate: conversionRate,
        });
    } catch( error ) {
        logger.error(`Unable to insert Payment in db: ${formatError(error)}`);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }

    return NextResponse.json(razorpayOrder, { status: 201 });
}
