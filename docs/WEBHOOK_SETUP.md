# Webhook Setup Guide - Razorpay + ngrok

This guide explains how to set up Razorpay webhooks for local development using ngrok.

## Why Webhooks?

Webhooks are critical for:
- ✅ Automatic subscription activation after payment
- ✅ Handling subscription renewals
- ✅ Processing refunds and cancellations
- ✅ Handling delayed payments (UPI, net banking)

Without webhooks, payments succeed but your database never gets updated.

## Setup Steps

### 1. Install ngrok

**Windows/Mac/Linux:**
```bash
npm install -g ngrok
```

Or download from: https://ngrok.com/download

### 2. Sign Up for ngrok (Optional but Recommended)

Free account gives you:
- Longer session timeouts
- More tunnels
- Static subdomain (paid)

Sign up at: https://dashboard.ngrok.com/signup

After signup, authenticate:
```bash
ngrok config add-authtoken <your-auth-token>
```

### 3. Start Your Development Server

```bash
npm run dev
```

Your app should be running at `http://localhost:3000`

### 4. Start ngrok Tunnel

In a **new terminal window**, run:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.3.0
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

Copy the **Forwarding URL**: `https://abc123xyz.ngrok-free.app`

### 5. Configure Razorpay Webhook

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click **"Create Webhook"** or **"Add New Webhook"**
3. Enter webhook details:
   - **Webhook URL**: `https://abc123xyz.ngrok-free.app/api/webhooks/razorpay`
   - **Secret**: Copy from your `.env.local` file (`RAZORPAY_WEBHOOK_SECRET`)
4. Select events to trigger:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `subscription.completed`
   - ✅ `subscription.updated`
5. Click **"Create Webhook"**

### 6. Test the Webhook

You can test the webhook from Razorpay dashboard:
1. Go to your webhook settings
2. Click **"Send Test Webhook"**
3. Select event type (e.g., `subscription.activated`)
4. Click **"Send"**

Check your terminal logs to see if the webhook was received.

### 7. View ngrok Request Inspector

Open `http://127.0.0.1:4040` in your browser to see:
- All incoming webhook requests
- Request headers and body
- Response status codes
- Useful for debugging

## Helper Scripts

### Quick Start Script

Run this instead of steps 3-4:

```bash
npm run dev:webhooks
```

This will:
1. Start your Next.js dev server
2. Start ngrok tunnel
3. Display the webhook URL to configure

### Check Webhook Status

```bash
npm run webhook:check
```

Shows recent webhook events and their processing status.

## Troubleshooting

### ngrok URL Changes Every Time

**Problem:** Free ngrok URLs change on every restart.

**Solution:**
- Update Razorpay webhook URL each time
- Or upgrade to ngrok paid plan for static subdomain

### Webhook Not Receiving Events

**Checklist:**
1. ✅ Is ngrok running? Check terminal
2. ✅ Is dev server running? Check `http://localhost:3000`
3. ✅ Is webhook URL correct in Razorpay dashboard?
4. ✅ Is webhook secret correct?
5. ✅ Are the right events selected in Razorpay?

### Webhook Signature Verification Failed

**Problem:** `Invalid signature` error in logs.

**Solution:**
- Make sure `RAZORPAY_WEBHOOK_SECRET` in `.env.local` matches Razorpay dashboard
- Re-generate webhook secret if needed

### 403 Forbidden from ngrok

**Problem:** ngrok shows warning page before forwarding.

**Solution:**
- Authenticate with ngrok: `ngrok config add-authtoken <token>`
- Or add `--scheme=http` flag (not recommended for production)

## Production Setup

For production, **DO NOT use ngrok**. Instead:

1. Deploy to Vercel/production
2. Configure webhook with production URL:
   ```
   https://your-app.vercel.app/api/webhooks/razorpay
   ```
3. Use production webhook secret
4. Test with small payment first

## Security Notes

- ✅ Always verify webhook signatures
- ✅ Use HTTPS (ngrok provides this)
- ✅ Keep webhook secret confidential
- ✅ Log all webhook events for debugging
- ✅ Implement idempotency (check if already processed)

## Monitoring

Check webhook health:
```bash
npx tsx scripts/diagnose-subscription.ts <user-email>
```

View recent webhook events in database:
```bash
npx tsx scripts/check-webhooks.ts
```

## Need Help?

- ngrok docs: https://ngrok.com/docs
- Razorpay webhooks: https://razorpay.com/docs/webhooks/
- Our webhook route: `app/api/webhooks/razorpay/route.ts`
