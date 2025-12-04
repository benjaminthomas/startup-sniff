# 🚀 Quick Start: Webhook Testing with ngrok

Follow these steps to test Razorpay webhooks locally using ngrok.

## Prerequisites

- ✅ Your app is working on `http://localhost:3000`
- ✅ You have a Razorpay account (test mode)
- ✅ Node.js installed

## Step 1: Install ngrok

```bash
npm install -g ngrok
```

Or download from: https://ngrok.com/download

## Step 2: Start Your App

```bash
npm run dev
```

Keep this terminal open. Your app should be at `http://localhost:3000`

## Step 3: Start ngrok

Open a **NEW terminal window** and run:

```bash
npm run ngrok
```

Or manually:

```bash
ngrok http 3000
```

You'll see output like this:

```
Session Status                online
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000

Web Interface                 http://127.0.0.1:4040
```

**Copy the HTTPS URL**: `https://abc123xyz.ngrok-free.app`

⚠️ **IMPORTANT:** Keep this terminal open! Closing it will stop the tunnel.

## Step 4: Configure Razorpay Webhook

1. Open: https://dashboard.razorpay.com/app/webhooks

2. Click **"Create Webhook"** or **"+ Add New Webhook"**

3. Fill in the form:

   **Webhook URL:**
   ```
   https://abc123xyz.ngrok-free.app/api/webhooks/razorpay
   ```
   *(Replace `abc123xyz` with your actual ngrok URL)*

   **Secret:**
   Copy from your `.env.local` file:
   ```
   8gAKJ*cJAcT9L3EQz^%A#VWF
   ```

   **Active:**
   ✅ Enabled

4. **Select Events:** Check these boxes:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.paused
   - ✅ subscription.resumed

5. Click **"Create Webhook"**

## Step 5: Test It!

### Option A: Test with Razorpay Dashboard

1. In Razorpay dashboard, go to your webhook
2. Click **"Send Test Webhook"**
3. Select `subscription.activated`
4. Click **"Send"**

### Option B: Make a Real Test Payment

1. Go to your app: `http://localhost:3000/dashboard/billing`
2. Click **"Upgrade to Pro"**
3. Use test card: `4111 1111 1111 1111`
4. CVV: `123`, Any future date

### Monitor Webhook Requests

Open in your browser:
```
http://127.0.0.1:4040
```

This shows all incoming webhook requests with:
- Headers
- Request body
- Response status
- Timing

### Check Your Terminal

You should see logs like:
```
[WEBHOOK] Received Razorpay webhook: {
  eventType: 'subscription.activated',
  eventId: 'evt_...',
  timestamp: '...'
}
[WEBHOOK] Processing subscription.activated: { ... }
[WEBHOOK] User ID from notes: e5e2f60e-9067-4eb3-b6a7-25163ff79493
[WEBHOOK] Mapped to plan: pro_monthly (Pro)
[WEBHOOK] Updating user plan: { ... }
[WEBHOOK] ✅ User updated successfully
[WEBHOOK] ✅ Subscription activation complete
```

## Step 6: Verify Subscription Activated

Check the database:

```bash
npm run webhook:diagnose benji_thomas@live.com
```

You should see:
- ✅ Plan Type: `pro_monthly`
- ✅ Subscription Status: `active`
- ✅ Payment recorded

Log out and log back in - you should see:
- ✅ "Growth" badge in sidebar
- ✅ Conversations unlocked
- ✅ No "Upgrade" button

## Troubleshooting

### Webhook not received?

**Check:**
1. Is ngrok still running? (Check the terminal)
2. Is the URL correct in Razorpay dashboard?
3. Is your dev server running?
4. Check ngrok inspector: http://127.0.0.1:4040

### Signature verification failed?

**Fix:**
- Make sure webhook secret in Razorpay matches `.env.local`
- Current secret: `8gAKJ*cJAcT9L3EQz^%A#VWF`

### ngrok URL keeps changing?

**Why:** Free ngrok generates new URLs on restart

**Solutions:**
1. Update Razorpay webhook URL each time (30 seconds)
2. Upgrade to ngrok paid ($8/month) for static subdomain

### Payment succeeded but subscription not activated?

**Debug:**

Check webhook events:
```bash
npm run webhook:check
```

Check specific user:
```bash
npm run webhook:diagnose your@email.com
```

View webhook logs in terminal

## Helper Commands

```bash
# Start ngrok
npm run ngrok

# Check recent webhooks
npm run webhook:check

# Diagnose subscription issue
npm run webhook:diagnose <email>

# Sync from Razorpay (if webhooks failed)
npx tsx scripts/sync-from-razorpay.ts <email>

# Manual activation (emergency)
npx tsx scripts/manual-activate-subscription.ts <email> pro_monthly
```

## Production Setup

⚠️ **Do NOT use ngrok in production!**

For production:

1. Deploy to Vercel: `vercel deploy`

2. Update Razorpay webhook to production URL:
   ```
   https://your-app.vercel.app/api/webhooks/razorpay
   ```

3. Use production webhook secret

4. Test with small payment first

## Need Help?

- Check logs in terminal
- View ngrok inspector: http://127.0.0.1:4040
- Check Razorpay webhook logs: https://dashboard.razorpay.com/app/webhooks
- Full documentation: `docs/WEBHOOK_SETUP.md`

---

## Summary

1. `npm run dev` - Start app
2. `npm run ngrok` - Start tunnel (new terminal)
3. Copy ngrok HTTPS URL
4. Configure in Razorpay: `https://YOUR-URL.ngrok-free.app/api/webhooks/razorpay`
5. Test payment or send test webhook
6. Check terminal logs and ngrok inspector
7. Verify with `npm run webhook:diagnose <email>`

✅ Done! Webhooks are now working locally.
