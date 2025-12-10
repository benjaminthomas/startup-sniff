import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { validateRequestBody, verifyPaymentSchema } from '@/lib/validation/api-schemas';

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

    // ✅ VALIDATION: Validate request body with Zod
    const body = await validateRequestBody(req, verifyPaymentSchema);
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    // Verify payment signature
    // For subscriptions, Razorpay signs: payment_id|subscription_id
    // So we pass payment_id as orderId and subscription_id as paymentId
    const isValid = verifyPaymentSignature({
      orderId: razorpay_payment_id,
      paymentId: razorpay_subscription_id,
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

    // TODO: Store payment verification in database once payment_transactions table is in generated types
    // try {
    //   const supabase = createServerAdminClient();
    //   await supabase
    //     .from('payment_transactions')
    //     .insert({
    //       user_id: session.userId,
    //       razorpay_payment_id,
    //       razorpay_subscription_id,
    //       status: 'verified',
    //       amount: 0, // Will be updated by webhook
    //       verified_at: new Date().toISOString(),
    //     });
    // } catch (dbError) {
    //   // Log but don't fail verification if DB insert fails
    //   console.warn('Failed to log payment verification:', dbError);
    // }

    return NextResponse.json({
      verified: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Payment verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Payment verification failed: ' + errorMessage, verified: false },
      { status: 500 }
    );
  }
}
