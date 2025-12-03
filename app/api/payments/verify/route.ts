import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: VerifyPaymentRequest = await req.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.error('Payment signature verification failed', {
        paymentId: razorpay_payment_id,
        subscriptionId: razorpay_subscription_id,
        userId: session.userId,
      });

      return NextResponse.json(
        { error: 'Invalid payment signature', verified: false },
        { status: 400 }
      );
    }

    // Log successful verification
    console.log('Payment verified successfully', {
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      userId: session.userId,
    });

    // Optionally: Store payment verification in database
    try {
      const supabase = createServerAdminClient();
      await supabase
        .from('payment_transactions' as any)
        .insert({
          user_id: session.userId,
          razorpay_payment_id,
          razorpay_subscription_id,
          status: 'verified',
          amount: 0, // Will be updated by webhook
          verified_at: new Date().toISOString(),
        });
    } catch (dbError) {
      // Log but don't fail verification if DB insert fails
      console.warn('Failed to log payment verification:', dbError);
    }

    return NextResponse.json({
      verified: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Payment verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Payment verification failed', details: errorMessage, verified: false },
      { status: 500 }
    );
  }
}
