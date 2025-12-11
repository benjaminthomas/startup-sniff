/**
 * Subscription Notification Email Template
 * Reusable template for all subscription-related events
 */

import { BaseEmailTemplate } from './base';

export interface SubscriptionEmailProps {
  userName: string;
  eventType: 'activated' | 'upgraded' | 'cancelled' | 'payment_failed';
  planName: string;
  amount?: number; // in paise
  currency?: string;
  invoiceUrl?: string;
  nextBillingDate?: string | null;
  prorationCredit?: number; // in paise
}

export function SubscriptionNotificationEmail({
  userName,
  eventType,
  planName,
  amount,
  currency = 'INR',
  invoiceUrl,
  nextBillingDate,
  prorationCredit,
}: SubscriptionEmailProps) {
  const formattedAmount = amount ? (amount / 100).toFixed(2) : '0.00';
  const formattedCredit = prorationCredit ? (prorationCredit / 100).toFixed(2) : null;
  const nextBilling = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Content varies based on event type
  const getContent = () => {
    switch (eventType) {
      case 'activated':
        return {
          preheader: `Welcome to ${planName}!`,
          title: `Welcome to StartupSniff ${planName}! 🎉`,
          intro: `Your subscription to ${planName} is now active. Get ready to discover amazing startup ideas and validate them with real market data!`,
          showPaymentSummary: true,
          features: [
            'Unlimited AI-generated startup ideas',
            'Unlimited market validations',
            'Advanced Reddit trend analysis',
            'Priority support',
          ],
        };

      case 'upgraded':
        return {
          preheader: `Your subscription has been upgraded to ${planName}`,
          title: 'Subscription Upgraded Successfully! 🚀',
          intro: `Great news! Your StartupSniff subscription has been successfully upgraded to ${planName}.`,
          showPaymentSummary: true,
          features: [
            'All Pro features unlocked',
            'Better value with yearly billing',
            'Uninterrupted access to all tools',
            'Priority support',
          ],
        };

      case 'cancelled':
        return {
          preheader: 'Your subscription has been cancelled',
          title: "We're Sad to See You Go 😢",
          intro: `Your ${planName} subscription has been cancelled. You'll continue to have access until the end of your billing period.`,
          showPaymentSummary: false,
          features: [],
        };

      case 'payment_failed':
        return {
          preheader: 'Payment failed - Action required',
          title: 'Payment Failed ⚠️',
          intro: `We couldn't process your payment for ${planName}. Please update your payment method to continue enjoying StartupSniff Pro.`,
          showPaymentSummary: true,
          features: [],
        };
    }
  };

  const content = getContent();

  return (
    <BaseEmailTemplate
      preheader={content.preheader}
      footerText={
        eventType === 'cancelled'
          ? "We're sorry to see you go. You can reactivate anytime from your billing dashboard."
          : 'Thank you for being a valued StartupSniff member!'
      }
    >
      <h1>{content.title}</h1>

      <p>Hi {userName},</p>

      <p>{content.intro}</p>

      {content.showPaymentSummary && amount && (
        <>
          <h2>Payment Summary</h2>

          <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 0', color: '#6b7280' }}>Plan</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>{planName}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 0', color: '#6b7280' }}>Amount Charged</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>
                  {currency} {formattedAmount}
                </td>
              </tr>
              {formattedCredit && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 0', color: '#6b7280' }}>Proration Credit</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#059669' }}>
                    - {currency} {formattedCredit}
                  </td>
                </tr>
              )}
              {nextBilling && (
                <tr>
                  <td style={{ padding: '12px 0', color: '#6b7280' }}>Next Billing Date</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>{nextBilling}</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {invoiceUrl && eventType !== 'payment_failed' && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href={invoiceUrl} className="button">
            Download Invoice
          </a>
        </div>
      )}

      {content.features.length > 0 && (
        <>
          <h2>
            {eventType === 'activated' ? "What's Included?" : 'Your Benefits'}
          </h2>

          <ul style={{ color: '#374151', lineHeight: 1.8 }}>
            {content.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </>
      )}

      {eventType === 'payment_failed' && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a href="https://startupsniff.com/dashboard/billing" className="button">
            Update Payment Method
          </a>
        </div>
      )}

      {eventType === 'cancelled' && nextBilling && (
        <div className="highlight-box">
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Access Until: {nextBilling}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
            You can reactivate your subscription anytime before this date.
          </p>
        </div>
      )}

      {(eventType === 'activated' || eventType === 'upgraded') && (
        <p style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
          You can view your billing history and manage your subscription anytime from your{' '}
          <a href="https://startupsniff.com/dashboard/billing" style={{ color: '#2563eb' }}>
            billing dashboard
          </a>
          .
        </p>
      )}

      <p style={{ marginTop: '32px' }}>
        {eventType === 'cancelled' ? 'We hope to see you again soon!' : 'Thanks for being a valued member!'}
        <br />
        <strong>The StartupSniff Team</strong>
      </p>
    </BaseEmailTemplate>
  );
}
