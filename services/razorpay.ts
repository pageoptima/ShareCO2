import Razorpay from 'razorpay';
import {
    validatePaymentVerification,
    validateWebhookSignature
} from "razorpay/dist/utils/razorpay-utils";

/**
 * Define rozorpay server instent
 */
let razorpayInstance: Razorpay | null = null;

/**
 * Get the razorpay
 */
export function getRazorpay() {

    if (razorpayInstance) return razorpayInstance;

    const key_id     = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
        throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Cannot initialize Razorpay.");
    }

    razorpayInstance = new Razorpay({ key_id, key_secret });

    return razorpayInstance;
}

/**
 * Creates a Razorpay order.
 * @param option - Order creation options like amount, currency, receipt, notes, etc.
 * @returns The created Razorpay order object.
 */
export async function createOrder(
    option: {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, any>;
        payment_capture?: number;
        [key: string]: any;
    }
) {
    if (!option) {
        throw new Error("Invalid options");
    }

    const razorpay = getRazorpay();
    const order    = await razorpay.orders.create({ ...option, payment_capture: true });

    return order;
}

/**
 * Retrieves Razorpay order details by ID.
 * @param orderId - The Razorpay order ID.
 * @returns The full Razorpay order details.
 */
export async function getOrderDetailsById(orderId: string) {
    if (!orderId) {
        throw new Error("Order id required");
    }

    const razorpay     = getRazorpay();
    const orderDetails = await razorpay.orders.fetch(orderId);
    
    return orderDetails;
}

/**
 * Retrives Razorpay payment details by ID.
 * @param paymentId - The Razorpay payment ID 
 * @returns The full Razorpay payment details
 */
export async function getPaymentDetailsById(paymentId: string) {
    if (!paymentId) {
        throw new Error("Payment id required");
    }

    const razorpay = getRazorpay();
    const payment  = await razorpay.payments.fetch(paymentId);
    
    return payment;
}

/**
 * Verify the payment made by a user using Razorpay's signature.
 * @param razorpay_payment_id - The Razorpay payment ID
 * @param razorpay_order_id - The Razorpay order ID
 * @param razorpay_signature - The signature received from Razorpay
 * @returns True if the payment is verified, false otherwise
 */
export const verifyPayment = (
    {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature
    }: {
        razorpayPaymentId: string,
        razorpayOrderId: string,
        razorpaySignature: string
    }
): boolean => {

    return validatePaymentVerification(
        {
            payment_id: razorpayPaymentId,
            order_id: razorpayOrderId
        },
        razorpaySignature,
        process.env.RAZORPAY_SECRET_KEY as string
    );
};

/**
 * Verifies a Razorpay webhook request.
 * @param params.body - The raw request body (JSON-parsed or raw)
 * @param params.signature - The X-Razorpay-Signature header value
 * @param params.secret - Your webhook secret key
 * @returns boolean indicating whether the request is valid
 */
export function verifyWebhook(
    {
        body,
        signature,
    }: {
        body: unknown;
        signature: string;
    }
): boolean {

    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    return validateWebhookSignature(
        payload,
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET as string
    )
}

/**
 * @param {float} amount
 * @returns converted amount in paisa (razorpay amount format)
 * @example 5.999 converted into 600 or, 500 will convert into 50000
 */
export const convertToRazorpayAmount = (amount: number) => {
    return Math.round(amount * 100);
};

/**
 * @param {float} razorpayAmount
 * @returns converted paisa to rupise
 */
export const convertToAmount = (razorpayAmount: number) => {
    return Math.round(razorpayAmount / 100);
};