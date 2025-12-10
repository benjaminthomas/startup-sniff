/**
 * Subscription Email Notifications
 * Sends emails for subscription-related events
 */

import { sendEmail } from './mailgun-client';
import { renderEmailToHtml } from './render';
import { SubscriptionNotificationEmail } from './templates/subscription-notification';
import { log } from '@/lib/logger'

export interface SubscriptionEmailData {
  to: string;
  userName: string;
  planName: string;
  amount?: number; // in paise
  currency?: string;
  invoiceUrl?: string;
  nextBillingDate?: string | null;
  prorationCredit?: number; // in paise
}

/**
 * Send subscription activated email
 * For initial subscriptions or reactivations
 */
export async function sendSubscriptionActivatedEmail(
  data: SubscriptionEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await renderEmailToHtml(
      SubscriptionNotificationEmail({
        userName: data.userName,
        eventType: 'activated',
        planName: data.planName,
        amount: data.amount,
        currency: data.currency || 'INR',
        invoiceUrl: data.invoiceUrl,
        nextBillingDate: data.nextBillingDate,
      })
    );

    const result = await sendEmail({
      to: data.to,
      subject: `🎉 Welcome to ${data.planName}!`,
      html,
      tags: ['subscription', 'activated', 'billing'],
    });

    return result;
  } catch (error) {
    log.error('Failed to send subscription activated email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send subscription upgraded email
 * For plan upgrades (e.g., monthly to yearly)
 */
export async function sendSubscriptionUpgradedEmail(
  data: SubscriptionEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await renderEmailToHtml(
      SubscriptionNotificationEmail({
        userName: data.userName,
        eventType: 'upgraded',
        planName: data.planName,
        amount: data.amount,
        currency: data.currency || 'INR',
        invoiceUrl: data.invoiceUrl,
        nextBillingDate: data.nextBillingDate,
        prorationCredit: data.prorationCredit,
      })
    );

    const result = await sendEmail({
      to: data.to,
      subject: `🚀 Subscription Upgraded to ${data.planName}`,
      html,
      tags: ['subscription', 'upgraded', 'billing'],
    });

    return result;
  } catch (error) {
    log.error('Failed to send subscription upgraded email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send subscription cancelled email
 * For voluntary cancellations
 */
export async function sendSubscriptionCancelledEmail(
  data: SubscriptionEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await renderEmailToHtml(
      SubscriptionNotificationEmail({
        userName: data.userName,
        eventType: 'cancelled',
        planName: data.planName,
        nextBillingDate: data.nextBillingDate,
      })
    );

    const result = await sendEmail({
      to: data.to,
      subject: 'Subscription Cancelled - We\'re Sad to See You Go',
      html,
      tags: ['subscription', 'cancelled', 'billing'],
    });

    return result;
  } catch (error) {
    log.error('Failed to send subscription cancelled email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payment failed email
 * For failed payment attempts
 */
export async function sendPaymentFailedEmail(
  data: SubscriptionEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await renderEmailToHtml(
      SubscriptionNotificationEmail({
        userName: data.userName,
        eventType: 'payment_failed',
        planName: data.planName,
        amount: data.amount,
        currency: data.currency || 'INR',
      })
    );

    const result = await sendEmail({
      to: data.to,
      subject: '⚠️ Payment Failed - Action Required',
      html,
      tags: ['subscription', 'payment_failed', 'billing'],
    });

    return result;
  } catch (error) {
    log.error('Failed to send payment failed email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
