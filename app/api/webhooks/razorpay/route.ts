import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { PRICING_PLANS } from '@/constants';
import { log } from '@/lib/logger'

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
          upgraded_from?: string;
          proration_credit?: string;
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
        currency?: string;
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
    log.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body) as RazorpayWebhookPayload;
  const eventType = payload.event;

  // Extract event ID from payload (Razorpay includes this in webhook payload)
  const eventId = (payload as unknown as { event_id?: string }).event_id;

  if (!eventId) {
    log.error('No event_id in webhook payload');
    return NextResponse.json({ error: 'No event_id in payload' }, { status: 400 });
  }

  log.info('[WEBHOOK] Received Razorpay webhook:', {
    eventType,
    eventId,
    timestamp: new Date().toISOString()
  });

  // Idempotency check: Has this event been processed before?
  const { data: existingEvent } = await supabaseAdmin
    .from('webhook_events')
    .select('id, processed, error_message')
    .eq('event_id', eventId)
    .single();

  if (existingEvent) {
    if (existingEvent.processed) {
      log.info(`Event ${eventId} already processed, returning success (idempotent)`);
      return NextResponse.json({ received: true, idempotent: true });
    } else {
      log.info(`Event ${eventId} found but not processed, will retry`);
    }
  } else {
    // Store new event for idempotency tracking
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload: payload,
        processed: false,
      });
  }

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
        log.info(`Unhandled event type: ${eventType}`);
    }

    // Mark event as successfully processed
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('event_id', eventId);

    log.info(`Event ${eventId} processed successfully`);
    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('Webhook handler error:', error);

    // Mark event as failed for retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Get current retry count and increment it
    const { data: currentEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('retry_count')
      .eq('event_id', eventId)
      .single();

    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: false,
        error_message: errorMessage,
        retry_count: (currentEvent?.retry_count || 0) + 1,
      })
      .eq('event_id', eventId);

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(subscription: RazorpayWebhookPayload['payload']['subscription']['entity']) {
  log.info('[WEBHOOK] Processing subscription.activated:', {
    subscriptionId: subscription.id,
    planId: subscription.plan_id,
    status: subscription.status,
    notes: subscription.notes
  });

  const userId = subscription.notes.user_id;

  if (!userId) {
    log.error('[WEBHOOK] ❌ User ID not found in subscription notes');
    throw new Error('User ID not found in subscription notes');
  }

  log.info('[WEBHOOK] User ID from notes', { userId });

  // Find the plan type based on plan ID
  const plan = PRICING_PLANS.find(p => p.priceId === subscription.plan_id);

  if (!plan) {
    log.error('[WEBHOOK] ❌ Plan not found for plan ID:', subscription.plan_id);
    throw new Error(`Plan not found for plan ID: ${subscription.plan_id}`);
  }

  log.info('[WEBHOOK] Mapped to plan', { planId: plan.id, planName: plan.name });

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
  log.info('[WEBHOOK] Updating user plan:', { userId, planType: plan.id });

  const { error: userUpdateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      plan_type: plan.id,
    })
    .eq('id', userId);

  if (userUpdateError) {
    log.error('[WEBHOOK] ❌ Failed to update user:', userUpdateError);
    throw new Error(`Failed to update user: ${userUpdateError.message}`);
  }

  log.info('[WEBHOOK] ✅ User updated successfully');

  // Update usage limits
  log.info('[WEBHOOK] Updating usage limits:', {
    userId,
    planType: plan.id,
    ideas: plan.limits.ideas === -1 ? 'unlimited' : plan.limits.ideas,
    validations: plan.limits.validations === -1 ? 'unlimited' : plan.limits.validations
  });

  const { error: limitsError } = await supabaseAdmin
    .from('usage_limits')
    .update({
      plan_type: plan.id,
      monthly_limit_ideas: plan.limits.ideas === -1 ? 999999 : plan.limits.ideas,
      monthly_limit_validations: plan.limits.validations === -1 ? 999999 : plan.limits.validations,
    })
    .eq('user_id', userId);

  if (limitsError) {
    log.error('[WEBHOOK] ⚠️  Failed to update usage limits:', limitsError);
    // Don't throw - this is not critical
  } else {
    log.info('[WEBHOOK] ✅ Usage limits updated');
  }

  // Send activation/upgrade email
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (user?.email) {
      // Get most recent payment transaction
      const { data: payment } = await supabaseAdmin
        .from('payment_transactions')
        .select('razorpay_invoice_url, amount')
        .eq('razorpay_subscription_id', subscription.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Determine event type
      const isUpgrade = subscription.notes.upgraded_from === 'pro_monthly';

      // Import appropriate email function
      const { sendSubscriptionActivatedEmail, sendSubscriptionUpgradedEmail } = await import('@/lib/email/subscription-emails');
      const emailFunction = isUpgrade ? sendSubscriptionUpgradedEmail : sendSubscriptionActivatedEmail;

      await emailFunction({
        to: user.email,
        userName: user.full_name || user.email.split('@')[0],
        planName: plan.name,
        amount: payment?.amount || 0,
        currency: 'INR',
        invoiceUrl: payment?.razorpay_invoice_url || 'https://startupsniff.com/dashboard/billing',
        nextBillingDate: subscription.current_end
          ? new Date(subscription.current_end * 1000).toISOString()
          : null,
        prorationCredit: subscription.notes.proration_credit
          ? parseInt(subscription.notes.proration_credit)
          : undefined,
      });

      log.info(`${isUpgrade ? 'Upgrade' : 'Activation'} email sent to ${user.email}`);
    }
  } catch (emailError) {
    log.error('Email notification failed:', emailError);
    // Don't throw - email failure shouldn't block activation
  }

  log.info('[WEBHOOK] ✅ Subscription activation complete:', {
    userId,
    subscriptionId: subscription.id,
    planType: plan.id,
    status: 'active'
  });
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

  log.info(`Subscription charged: ${subscription.id}`);
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

    // Send cancellation email
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name, plan_type')
        .eq('id', userId)
        .single();

      if (user?.email) {
        const plan = PRICING_PLANS.find(p => p.id === user.plan_type);

        if (plan) {
          const { sendSubscriptionCancelledEmail } = await import('@/lib/email/subscription-emails');

          await sendSubscriptionCancelledEmail({
            to: user.email,
            userName: user.full_name || user.email.split('@')[0],
            planName: plan.name,
            nextBillingDate: subscription.current_end
              ? new Date(subscription.current_end * 1000).toISOString()
              : null,
          });

          log.info(`Cancellation email sent to ${user.email}`);
        }
      }
    } catch (emailError) {
      log.error('Cancellation email failed:', emailError);
      // Don't throw - email failure shouldn't block cancellation
    }
  }

  log.info(`Subscription cancelled: ${subscription.id}`);
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

  log.info(`Subscription completed: ${subscription.id}`);
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

  log.info(`Subscription paused: ${subscription.id}`);
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

  log.info(`Subscription resumed: ${subscription.id}`);
}

async function handlePaymentCaptured(payment: RazorpayWebhookPayload['payload']['payment']['entity']) {
  if (payment.subscription_id) {
    // Update subscription status to active
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('razorpay_subscription_id', payment.subscription_id);

    // Get subscription to find user_id
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', payment.subscription_id)
      .single();

    if (subscription) {
      // Create or update payment transaction record
      const { data: existingPayment } = await supabaseAdmin
        .from('payment_transactions')
        .select('id')
        .eq('razorpay_payment_id', payment.id)
        .single();

      if (existingPayment) {
        // Update existing record
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'captured',
            amount: payment.amount,
            captured_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', payment.id);
      } else {
        // Create new record
        await supabaseAdmin
          .from('payment_transactions')
          .insert({
            user_id: subscription.user_id,
            razorpay_subscription_id: payment.subscription_id,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            amount: payment.amount,
            currency: 'INR',
            status: 'captured',
            payment_method: payment.method,
            captured_at: new Date().toISOString(),
          });
      }

      // Generate or fetch invoice
      let invoiceId: string | null = null;
      let invoiceUrl: string | null = null;

      try {
        const { createInvoice, fetchInvoicesByPayment } = await import('@/lib/razorpay');

        // Try fetching existing invoice first
        const existingInvoices = await fetchInvoicesByPayment(payment.id);

        if (existingInvoices.items && existingInvoices.items.length > 0) {
          const invoice = existingInvoices.items[0];
          invoiceId = invoice.id;
          invoiceUrl = invoice.short_url ?? null;
          log.info(`Found existing invoice ${invoiceId} for payment ${payment.id}`);
        } else {
          // Get user details for invoice generation
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email, full_name, razorpay_customer_id')
            .eq('id', subscription.user_id)
            .single();

          if (user && user.razorpay_customer_id) {
            // Create new invoice
            const newInvoice = await createInvoice({
              customerId: user.razorpay_customer_id,
              amount: payment.amount,
              currency: payment.currency || 'INR',
              description: 'StartupSniff Pro Subscription',
              customer_email: user.email,
              customer_name: user.full_name || user.email.split('@')[0],
              payment_id: payment.id,
            });

            invoiceId = newInvoice.id;
            invoiceUrl = newInvoice.short_url ?? null;
            log.info(`Generated new invoice ${invoiceId} for payment ${payment.id}`);
          }
        }

        // Store invoice ID and URL in payment transaction
        if (invoiceId) {
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              razorpay_invoice_id: invoiceId,
              razorpay_invoice_url: invoiceUrl,
              invoice_generated_at: new Date().toISOString(),
            })
            .eq('razorpay_payment_id', payment.id);
        }
      } catch (invoiceError) {
        log.error('Invoice generation failed:', invoiceError);
        // Continue - non-critical for payment processing
      }
    }

    log.info(`Payment captured for subscription: ${payment.subscription_id}, amount: ${payment.amount}`);
  }
}

async function handlePaymentFailed(payment: RazorpayWebhookPayload['payload']['payment']['entity']) {
  if (payment.subscription_id) {
    // Update subscription status to past_due
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('razorpay_subscription_id', payment.subscription_id);

    // Send payment failed email
    try {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('razorpay_subscription_id', payment.subscription_id)
        .single();

      if (subscription) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, full_name, plan_type')
          .eq('id', subscription.user_id)
          .single();

        if (user?.email) {
          const plan = PRICING_PLANS.find(p => p.id === user.plan_type);

          if (plan) {
            const { sendPaymentFailedEmail } = await import('@/lib/email/subscription-emails');

            await sendPaymentFailedEmail({
              to: user.email,
              userName: user.full_name || user.email.split('@')[0],
              planName: plan.name,
              amount: payment.amount,
              currency: 'INR',
            });

            log.info(`Payment failed email sent to ${user.email}`);
          }
        }
      }
    } catch (emailError) {
      log.error('Payment failed email error:', emailError);
      // Don't throw - email failure shouldn't block webhook processing
    }

    log.info(`Payment failed for subscription: ${payment.subscription_id}`);
  }
}
