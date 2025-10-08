import type { PolicyPage } from '@/types/policy';

export const REFUND_POLICY: PolicyPage = {
  title: "Refund & Cancellation Policy",
  subtitle: "Our commitment to fair billing and cancellation terms",
  lastUpdated: "October 8, 2024",
  content: {
    intro: [
      "This policy applies to all StartupSniff services and subscriptions purchased through our platform.",
      "We believe in transparent, fair billing practices that put our customers first."
    ],
    sections: [
      {
        title: "Subscription Cancellation",
        content: [
          "You can cancel your subscription at any time from your account dashboard under the 'Billing' section.",
          "Cancellation takes effect at the end of your current billing period, ensuring you get full value from your payment.",
          "You'll continue to have access to all premium features until your subscription expires.",
          "No cancellation fees or hidden charges apply."
        ]
      },
      {
        title: "Money-Back Guarantee",
        content: [
          "We offer a 7-day money-back guarantee for all new subscribers.",
          "If you're not satisfied with our service within the first 7 days of your initial subscription, contact us for a full refund.",
          "The guarantee applies to your first payment only and covers all subscription tiers.",
          "Refunds for subsequent renewals are handled on a case-by-case basis."
        ]
      },
      {
        title: "Pro-rated Refunds",
        content: [
          "For annual subscriptions cancelled within the first 30 days, we provide pro-rated refunds for the unused portion.",
          "Monthly subscriptions are eligible for pro-rated refunds in exceptional circumstances.",
          "Processing time is typically 5-10 business days, depending on your payment method.",
          "Refunds are issued to the original payment method used for the subscription."
        ]
      },
      {
        title: "Free Trial Terms",
        content: [
          "Free trials can be cancelled anytime without charge through your account settings.",
          "If not cancelled before the trial ends, you'll be automatically enrolled in the selected paid plan.",
          "We'll send reminder emails 3 days and 1 day before your trial expires.",
          "Trial extensions may be available for educational institutions or non-profit organizations."
        ]
      },
      {
        title: "Refund Process",
        content: [
          "To request a refund, contact our support team at support@startupsniff.com with your account details.",
          "Include your reason for the refund request to help us improve our service.",
          "We'll process approved refunds within 5-10 business days.",
          "You'll receive an email confirmation once the refund has been processed."
        ]
      },
      {
        title: "Non-Refundable Items",
        content: [
          "Usage-based charges for API calls beyond your plan limits are non-refundable.",
          "Custom enterprise features and one-time setup fees are non-refundable.",
          "Third-party integrations and marketplace purchases may have separate refund policies."
        ]
      }
    ]
  }
};