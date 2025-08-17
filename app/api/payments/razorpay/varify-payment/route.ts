import logger from '@/config/logger';
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { getPaymentDetailsById, verifyPayment } from '@/services/razorpay';
import { handlePaymentCapture } from '@/lib/payment/paymentServices';

export async function POST(req: Request) {

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the device information from request body
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = await req.json();

    if ( !razorpay_payment_id || !razorpay_order_id || !razorpay_signature ) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the razorpay payment
    const isValidPayment = verifyPayment(
        {
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId:   razorpay_order_id,
            razorpaySignature: razorpay_signature,
        }
    );

    if ( !isValidPayment ) {
        return NextResponse.json({ error: 'Payment verification failed!' }, { status: 401 });
    }

    // Verify payment success
    try {
        const payment = await getPaymentDetailsById( razorpay_payment_id );

        if ( payment.status === 'failed' ) {
            return NextResponse.json({ error: 'Payment transection failed!' }, { status: 401 });
        }

        if ( payment.status !== 'captured' ) {
            return NextResponse.json({ error: 'Payment transection incomplete!' }, { status: 401 });
        }

    } catch (error) {
        logger.error(`Unable varify payment status. ${error}`);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }

    try{
        // Handle payment capture
        await handlePaymentCapture({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true }, { status: 201 });
}
