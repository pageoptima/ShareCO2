import logger from '@/config/logger';
import { verifyWebhook } from '@/services/razorpay';
import { NextResponse } from 'next/server';
import { handlePaymentCapture, handlePaymentFailed } from '@/lib/payment/paymentServices';


export async function POST(req: Request) {
    try {
        // Get the body and signature
        const body      = await req.text();
        const signature = req.headers.get( "x-razorpay-signature" ) || "";

        // Verify webhook signature
        const isValid = verifyWebhook({
            body: body,
            signature: signature,
        });

        if (!isValid) {
            logger.error( "Invalid Razorpay webhook signature" );
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(body);
        const event   = payload.event;

        logger.info( `Razorpay webhook received: ${payload.event}` )

        switch (event) {
            // Event for payment success
            case "payment.captured": {
                const orderId    = payload.payload.payment.entity.order_id;
                const paymentId  = payload.payload.payment.entity.id;
                
                await handlePaymentCapture({
                    orderId,
                    paymentId,
                    signature
                });

                break;
            }

            // Event for payment failer
            case "payment.failed" : {
                const orderId    = payload.payload.payment.entity.order_id;
                const paymentId  = payload.payload.payment.entity.id;
                
                await handlePaymentFailed({
                    orderId,
                    paymentId,
                    signature
                });

                break;
            }

            default:
                logger.warn(`Unhandled webhook event: ${event}`);
                break;
        }

        return NextResponse.json({ status: "ok" }, { status: 200 });
    } catch (error) {
        logger.error(`Webhook processing failed: ${error}`);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
