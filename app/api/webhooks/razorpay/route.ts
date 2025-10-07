import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { PRICING_PLANS } from '@/constants';

// Create Supabase admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    subscription: {
      entity: {
        id: string;
        plan_id: string;
        status: string;
        quantity: number;
        notes: {
          user_id?: string;
          user_email?: string;
          plan_type?: string;
        };
        current_start?: number;
        current_end?: number;
        ended_at?: number;
        charge_at?: number;
      };
    };
    payment: {
      entity: {
        id: string;
        amount: number;
        status: string;
        subscription_id?: string;
        order_id?: string;
        method?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body) as RazorpayWebhookPayload;
  const eventType = payload.event;

  console.log('Razorpay webhook event:', eventType);

  try {
    switch (eventType) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload.payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload.payload.subscription.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.payload.subscription.entity);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(payload.payload.subscription.entity);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload.payload.subscription.entity);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(payload.payload.subscription.entity);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(payload.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payload.payment.entity);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  const userId = subscription.notes.user_id;

  if (!userId) {
    throw new Error('User ID not found in subscription notes');
  }

  // Find the plan type based on plan ID
  const plan = PRICING_PLANS.find(p => p.priceId === subscription.plan_id);

  if (!plan) {
    throw new Error(`Plan not found for plan ID: ${subscription.plan_id}`);
  }

  // Check if subscription already exists
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (existingSub) {
    // Update existing subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: plan.id,
        current_period_start: subscription.current_start
          ? new Date(subscription.current_start * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: subscription.current_end
          ? new Date(subscription.current_end * 1000).toISOString()
          : new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  } else {
    // Create new subscription record
    const { error } = await supabaseAdmin.from('subscriptions').insert({
      user_id: userId,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: subscription.plan_id,
      status: 'active',
      plan_type: plan.id,
      current_period_start: subscription.current_start
        ? new Date(subscription.current_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Update user's plan and subscription status
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      plan_type: plan.id,
    })
    .eq('id', userId);

  // Update usage limits
  await supabaseAdmin
    .from('usage_limits')
    .update({
      plan_type: plan.id,
      monthly_limit_ideas: plan.limits.ideas === -1 ? 999999 : plan.limits.ideas,
      monthly_limit_validations: plan.limits.validations === -1 ? 999999 : plan.limits.validations,
    })
    .eq('user_id', userId);

  console.log(`Subscription activated for user ${userId}: ${subscription.id}`);
}

async function handleSubscriptionCharged(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  // Update subscription period dates
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: subscription.current_start
        ? new Date(subscription.current_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);

  console.log(`Subscription charged: ${subscription.id}`);
}

async function handleSubscriptionCancelled(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  // Update user's subscription status
  const userId = subscription.notes.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'cancelled',
      })
      .eq('id', userId);
  }

  console.log(`Subscription cancelled: ${subscription.id}`);
}

async function handleSubscriptionCompleted(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'completed',
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to complete subscription: ${error.message}`);
  }

  // Revert user to free plan
  const userId = subscription.notes.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'cancelled',
        plan_type: 'free',
      })
      .eq('id', userId);

    // Reset to free plan limits
    const freePlan = PRICING_PLANS.find(p => p.id === 'free');
    if (freePlan) {
      await supabaseAdmin
        .from('usage_limits')
        .update({
          plan_type: 'free',
          monthly_limit_ideas: freePlan.limits.ideas,
          monthly_limit_validations: freePlan.limits.validations,
        })
        .eq('user_id', userId);
    }
  }

  console.log(`Subscription completed: ${subscription.id}`);
}

async function handleSubscriptionPaused(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'paused',
    })
    .eq('razorpay_subscription_id', subscription.id);

  // Update user status
  const userId = subscription.notes.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'paused',
      })
      .eq('id', userId);
  }

  console.log(`Subscription paused: ${subscription.id}`);
}

async function handleSubscriptionResumed(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
    })
    .eq('razorpay_subscription_id', subscription.id);

  // Update user status
  const userId = subscription.notes.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'active',
      })
      .eq('id', userId);
  }

  console.log(`Subscription resumed: ${subscription.id}`);
}

async function handlePaymentCaptured(payment: RazorpayWebhookPayload['payload']['payment']['entity']) {
  if (payment.subscription_id) {
    // Update subscription status to active
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('razorpay_subscription_id', payment.subscription_id);

    console.log(`Payment captured for subscription: ${payment.subscription_id}`);
  }
}

async function handlePaymentFailed(payment: RazorpayWebhookPayload['payload']['payment']['entity']) {
  if (payment.subscription_id) {
    // Update subscription status to past_due
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('razorpay_subscription_id', payment.subscription_id);

    console.log(`Payment failed for subscription: ${payment.subscription_id}`);
  }
}
