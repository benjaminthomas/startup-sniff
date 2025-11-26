# Razorpay Payment Integration Setup Guide

This guide will help you configure Razorpay payment integration for StartupSniff.

## Overview

StartupSniff uses Razorpay Subscriptions to handle recurring payments for Pro plans. The integration includes:
- Subscription creation and management
- Webhook handling for payment events
- Paywall enforcement for premium features

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Access to Razorpay Dashboard
3. Test mode enabled for development

## Step 1: Get Razorpay API Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Generate API keys for **Test Mode**
4. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this secure!)

## Step 2: Create Subscription Plans

You need to create two subscription plans in Razorpay for Pro Monthly and Pro Yearly.

### Create Pro Monthly Plan

1. Go to **Subscriptions** → **Plans** in the Razorpay Dashboard
2. Click **Create Plan**
3. Fill in the details:
   - **Plan Name**: `Pro Monthly`
   - **Billing Interval**: `Monthly`
   - **Billing Amount**: `2900` (₹29.00 in paise)
   - **Currency**: `INR`
   - **Description**: `Monthly Pro subscription for StartupSniff`
4. Click **Create**
5. **Copy the Plan ID** (starts with `plan_`)

### Create Pro Yearly Plan

1. Click **Create Plan** again
2. Fill in the details:
   - **Plan Name**: `Pro Yearly`
   - **Billing Interval**: `Yearly`
   - **Billing Amount**: `29000` (₹290.00 in paise)
   - **Currency**: `INR`
   - **Description**: `Yearly Pro subscription for StartupSniff`
3. Click **Create**
4. **Copy the Plan ID** (starts with `plan_`)

## Step 3: Configure Environment Variables

Add the following variables to your `.env` or `.env.local` file:

```bash
# Razorpay API Keys (from Step 1)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Razorpay Plan IDs (from Step 2)
NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_xxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID=plan_yyyyyyyyyyyy

# Webhook Secret (from Step 4)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 4: Set Up Webhooks

Webhooks allow Razorpay to notify your app when payment events occur.

### Local Development (using ngrok)

1. Install ngrok: `npm install -g ngrok` or download from https://ngrok.com
2. Start your Next.js app: `npm run dev`
3. In a new terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Configure Webhook in Razorpay

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click **Add New Webhook**
3. Fill in:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
     - For local dev: `https://abc123.ngrok.io/api/webhooks/razorpay`
   - **Secret**: Generate a strong random string (use this as `RAZORPAY_WEBHOOK_SECRET`)
   - **Alert Email**: Your email
4. Select **Active Events**:
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.completed`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `payment.captured`
   - ✅ `payment.failed`
5. Click **Create Webhook**

## Step 5: Update Constants

The plan IDs are already configured in `/constants/index.ts`:

```typescript
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'pro_monthly',
    priceId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID || 'plan_RQbJW54uNkoMwA',
    // ... other fields
  },
  {
    id: 'pro_yearly',
    priceId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID || 'plan_RQbJzVfk744fiY',
    // ... other fields
  }
];
```

Make sure your environment variables match the plan IDs you created.

## Step 6: Test the Integration

### Test Subscription Creation

1. Start your app in development mode
2. Log in as a free user
3. Go to `/dashboard/billing`
4. Click **Upgrade to Pro**
5. Use Razorpay test card details:
   - **Card Number**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name

### Verify Success

1. Payment should complete successfully
2. You should be redirected to `/dashboard/billing/success`
3. Check your Razorpay Dashboard → Subscriptions to see the new subscription
4. Check your database:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
   SELECT * FROM users WHERE id = 'your-user-id';
   ```
5. User's `plan_type` should be updated to `pro_monthly` or `pro_yearly`
6. User's `subscription_status` should be `active`

### Test Webhook Delivery

1. In Razorpay Dashboard, go to **Webhooks**
2. Click on your webhook
3. Click **View Logs** to see webhook deliveries
4. Verify status is **200 OK**
5. Check your app logs for webhook processing messages

## Troubleshooting

### Error: "The id provided does not exist"

**Cause**: The plan ID in your environment variables doesn't match an actual plan in Razorpay.

**Solution**:
1. Go to Razorpay Dashboard → Subscriptions → Plans
2. Verify your plan IDs match the environment variables
3. Make sure you're using **Test Mode** plan IDs for development
4. Restart your Next.js app after updating environment variables

### Error: "Invalid signature"

**Cause**: Webhook secret mismatch.

**Solution**:
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard
2. Check webhook URL is correct
3. Ensure webhook is active

### Error: "Payment gateway not configured"

**Cause**: Missing `NEXT_PUBLIC_RAZORPAY_KEY_ID` environment variable.

**Solution**:
1. Add the variable to `.env.local`
2. Restart your development server

### Subscription not updating in database

**Cause**: Webhook not firing or failing.

**Solution**:
1. Check webhook logs in Razorpay Dashboard
2. Verify webhook URL is accessible (test with curl)
3. Check your app logs for webhook processing errors
4. Ensure ngrok is running for local development

## Production Deployment

### Switch to Live Mode

1. In Razorpay Dashboard, switch to **Live Mode**
2. Generate new API keys for Live Mode
3. Create new subscription plans in Live Mode
4. Update environment variables with Live Mode credentials:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_live_monthly
   NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID=plan_live_yearly
   ```

### Update Webhook URL

1. Update webhook URL to your production domain
2. Example: `https://startupsniff.com/api/webhooks/razorpay`
3. Generate a new webhook secret for production

### Enable Payment Methods

In Razorpay Dashboard → Settings → Payment Methods:
- Enable Credit Cards
- Enable Debit Cards
- Enable UPI (for Indian customers)
- Enable Net Banking
- Enable Wallets (optional)

## Testing Checklist

- [ ] API keys configured correctly
- [ ] Plans created in Razorpay Dashboard
- [ ] Environment variables set
- [ ] Webhook configured and active
- [ ] Test subscription creation works
- [ ] Test payment completion works
- [ ] Webhook events being received
- [ ] Database updates correctly
- [ ] User can access premium features after payment
- [ ] Free users redirected to billing page for premium features

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Use environment variables**: Don't hardcode keys in code
3. **Validate webhooks**: Always verify webhook signatures
4. **Use HTTPS**: Webhooks must be delivered over HTTPS
5. **Rotate keys**: Periodically rotate API keys and webhook secrets
6. **Monitor logs**: Regularly check for failed payments or webhook errors

## Support

- Razorpay Documentation: https://razorpay.com/docs/subscriptions/
- Razorpay Support: support@razorpay.com
- StartupSniff Issues: Create an issue in your repository

## Related Files

- `/lib/razorpay.ts` - Razorpay SDK wrapper
- `/modules/billing/actions/index.ts` - Subscription management server actions
- `/app/api/webhooks/razorpay/route.ts` - Webhook handler
- `/components/features/billing/pricing-cards.tsx` - Checkout UI
- `/lib/paywall.ts` - Paywall enforcement utilities
- `/constants/index.ts` - Pricing plans configuration
