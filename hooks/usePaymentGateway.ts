'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { log } from '@/lib/logger/client';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface PaymentOptions {
  subscriptionId: string;
  name: string;
  description: string;
  email: string;
  notes?: Record<string, string>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePaymentGateway() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      setScriptError(true);
      toast.error('Payment gateway failed to load. Please refresh the page.');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const verifyPayment = async (response: RazorpayResponse): Promise<boolean> => {
    try {
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();
      return verifyData.verified;
    } catch (error) {
      log.error('Payment verification error:', error);
      throw new Error('Payment verification failed');
    }
  };

  const openPaymentGateway = async ({
    subscriptionId,
    name,
    description,
    email,
    notes,
    onSuccess,
    onError,
  }: PaymentOptions): Promise<void> => {
    if (scriptError) {
      toast.error('Payment gateway is unavailable. Please try again later.');
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      toast.info('Loading payment gateway...');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!publicKey) {
      toast.error('Payment gateway is not configured.');
      return;
    }

    setIsProcessing(true);

    const options = {
      key: publicKey,
      subscription_id: subscriptionId,
      name,
      description,
      handler: async function (response: RazorpayResponse) {
        try {
          const verified = await verifyPayment(response);

          if (verified) {
            toast.success('Payment successful!');
            if (onSuccess) {
              onSuccess();
            } else {
              router.push('/dashboard/billing/success');
            }
          } else {
            toast.error('Payment verification failed. Please contact support.');
            setIsProcessing(false);
            if (onError) {
              onError(new Error('Payment verification failed'));
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Payment verification failed');
          toast.error('Payment verification failed. Please contact support.');
          setIsProcessing(false);
          if (onError) {
            onError(err);
          }
        }
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          toast.info('Payment cancelled');
        }
      },
      prefill: {
        email,
      },
      theme: {
        color: '#8B5CF6'
      },
      notes,
    };

    if (window.Razorpay) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const razorpay = new (window.Razorpay as any)(options);
      razorpay.open();
    } else {
      toast.error('Payment gateway not loaded. Please refresh and try again.');
      setIsProcessing(false);
    }
  };

  return {
    scriptLoaded,
    scriptError,
    isProcessing,
    openPaymentGateway,
  };
}
