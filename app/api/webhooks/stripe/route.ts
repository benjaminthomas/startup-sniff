import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/stripe';
import { PRICING_PLANS } from '@/constants';

// Create Supabase admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
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

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  
  if (!userId) {
    throw new Error('User ID not found in subscription metadata');
  }

  // Find the plan type based on price ID
  const priceId = subscription.items.data[0].price.id;
  const plan = PRICING_PLANS.find(p => p.priceId === priceId);
  
  if (!plan) {
    throw new Error(`Plan not found for price ID: ${priceId}`);
  }

  // Create subscription record
  const { error } = await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status === 'active' ? 'active' : 'trial',
    plan_type: plan.id,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  // Update user's plan and subscription status
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: subscription.status === 'active' ? 'active' : 'trial',
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

  console.log(`Subscription created for user ${userId}: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : 
              subscription.status === 'canceled' ? 'cancelled' : 
              subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // Update user's subscription status
  const userId = subscription.metadata.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: subscription.status === 'active' ? 'active' : 
                           subscription.status === 'canceled' ? 'cancelled' : 
                           subscription.status,
      })
      .eq('id', userId);
  }

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }

  // Update user's subscription status and revert to free plan
  const userId = subscription.metadata.user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'cancelled',
        plan_type: 'explorer',
      })
      .eq('id', userId);

    // Reset to free plan limits
    const freePlan = PRICING_PLANS.find(p => p.id === 'explorer');
    if (freePlan) {
      await supabaseAdmin
        .from('usage_limits')
        .update({
          plan_type: 'explorer',
          monthly_limit_ideas: freePlan.limits.ideas,
          monthly_limit_validations: freePlan.limits.validations,
        })
        .eq('user_id', userId);
    }
  }

  console.log(`Subscription deleted: ${subscription.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Update subscription status to active
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('stripe_subscription_id', invoice.subscription);

    console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Update subscription status to inactive
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'inactive' })
      .eq('stripe_subscription_id', invoice.subscription);

    console.log(`Payment failed for subscription: ${invoice.subscription}`);
  }
}