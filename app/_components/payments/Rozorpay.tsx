"use client";

import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRazorpay } from 'react-razorpay';
import { CurrencyCode } from 'react-razorpay/dist/constants/currency';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';

interface CreateOrderPayload {
    carbonCoin: number;
}

interface CreateOrderResponse {
    id: string;
    amount: number;
    currency: string;
}

/**
 * Create payment order
 */
const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Create order failed: ${response.status} ${response.statusText}`);
    return response.json();
};

/**
 * Varify payment
 */
const verifyPayment = async (payload: void) => {
    const response = await fetch('/api/payments/razorpay/varify-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Verify payment failed: ${response.status} ${response.statusText}`);
    return response.json();
};

const RazorpayButton = ({
    carbonCoin,
    onError,
    onSuccess,
}: {
    carbonCoin: number;
    onError: (error: string) => void;
    onSuccess: () => void;
}) => {
    const { data: session } = useSession();
    const { error, isLoading, Razorpay } = useRazorpay();
    const [isProcessing, setIsProcessing] = useState(false);

    // Mutation hook for create order
    const { mutateAsync: createOrderMute } = useMutation({
        mutationFn: (option: CreateOrderPayload) => createOrder(option),
    });

    // Mutation hook for varify payment
    const { mutateAsync: verifyPaymentMute } = useMutation({
        mutationFn: (option) => verifyPayment(option),
    });

    // Reset isProcessing on component unmount
    useEffect(() => {
        return () => {
            setIsProcessing(false); // Cleanup when component unmounts
        };
    }, []);

    /**
     * Handle payment processing
     */
    const handlePayment = async () => {
        if (isProcessing || carbonCoin <= 0) return;
        setIsProcessing(true);

        try {
            const order = await createOrderMute(
                { carbonCoin },
                {
                    onError: (error) => {
                        onError(error.message);
                        setIsProcessing(false);
                    },
                    onSuccess: () => {
                        console.log('Order create successfull.');
                    },
                }
            );

            const razorpayInstance = new Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY as string,
                currency: order.currency as CurrencyCode,
                amount: order.amount,
                order_id: order.id,
                name: 'Share-CO2',
                description: 'Payment for Carbon Coin',
                prefill: {
                    name: session?.user?.name as string,
                    email: session?.user?.email as string,
                },
                theme: { color: '#2E7D32' },
                handler: async function (response) {
                    // response from razor pay SDK
                    // {
                    //     "razorpay_payment_id": "pay_PA6SwFaFTdxufV",
                    //     "razorpay_order_id": "order_PA6RQ8FwV7oUQs",
                    //     "razorpay_signature": "3ea1bf0bc5d5a76b8ed9e072b2570857d3684fdef295504a625d63aa3f87d09e"
                    // }
                    await verifyPaymentMute(response as unknown as void, {
                        onError: (error) => {
                            onError(error.message);
                            setIsProcessing(false);
                        },
                        onSuccess: () => {
                            onSuccess();
                            setIsProcessing(false);
                        },
                    });
                },
            });

            razorpayInstance.open();
            razorpayInstance.on('payment.failed', (error) => {
                console.log(error.error.reason);
                onError(error.error.reason);
                setIsProcessing(false);
            });
        } catch (error) {
            onError(error instanceof Error ? error.message : 'An error occurred');
            setIsProcessing(false);
        }
    };

    if (error) {
        return (
            <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md text-center flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Error loading Razorpay: {error}
            </div>
        );
    }

    if (isLoading || isProcessing) {
        return (
            <Button disabled className="w-full bg-[#2E7D32]/50">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading ? 'Loading...' : 'Processing...'}
            </Button>
        );
    }

    return (
        <Button
            onClick={handlePayment}
            disabled={carbonCoin <= 0}
            className={`w-full ${carbonCoin <= 0 ? 'bg-gray-600' : 'bg-[#2E7D32] hover:bg-[#388E3C]'} cursor-pointer`}
        >
            <CreditCard className="mr-2 h-4 w-4" />
            Pay with Razorpay
        </Button>
    );
};

export default RazorpayButton;