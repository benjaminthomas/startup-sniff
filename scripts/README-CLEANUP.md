# Database Cleanup Scripts

This directory contains scripts to clean up test data from your Supabase database.

## Available Scripts

### 1. `cleanup-billing-data.ts` - Billing Data Only ✨ RECOMMENDED

**What it deletes:**
- ✅ Webhook events
- ✅ Payment transactions
- ✅ Subscriptions
- ✅ Razorpay customer IDs from users
- ✅ Resets users to free plan
- ✅ Resets usage limits

**What it preserves:**
- ✅ User accounts
- ✅ Startup ideas
- ✅ Reddit data
- ✅ Messages
- ✅ All other data

**Usage:**
```bash
npx tsx scripts/cleanup-billing-data.ts
```

**When to use:** When you want to test the payment flow from scratch but keep your user accounts and other data.

---

### 2. `cleanup-all-data.ts` - Complete Database Wipe ⚠️ DANGEROUS

**What it deletes:**
- ❌ **EVERYTHING** - All tables will be emptied
- ❌ Users, sessions, subscriptions, payments
- ❌ Startup ideas, messages, contacts
- ❌ Reddit data, analytics
- ❌ Email logs and queue

**Usage:**
```bash
npx tsx scripts/cleanup-all-data.ts
```

**When to use:** When you want a completely fresh database for testing or development reset.

---

### 3. `get-db-schema.ts` - Schema Analysis 📊

**What it does:**
- Lists all tables and row counts
- Shows foreign key relationships
- Displays deletion order for safe cleanup

**Usage:**
```bash
npx tsx scripts/get-db-schema.ts
```

**When to use:** Before cleanup to understand what data exists.

---

## Quick Start Guide

### For Payment Testing Issues

If you're getting Razorpay errors like "Customer already exists":

```bash
# 1. Check current data
npx tsx scripts/get-db-schema.ts

# 2. Clean billing data only (RECOMMENDED)
npx tsx scripts/cleanup-billing-data.ts

# 3. Test payment flow again
```

### For Complete Reset

If you want to start completely fresh:

```bash
# 1. Backup important data if needed
# (No automated backup - do this manually!)

# 2. Full cleanup (waits 3 seconds, press Ctrl+C to cancel)
npx tsx scripts/cleanup-all-data.ts

# 3. Verify empty database
npx tsx scripts/get-db-schema.ts
```

---

## Safety Features

### Billing Data Cleanup
- ✅ Waits 2 seconds before starting
- ✅ Shows what will be deleted
- ✅ Preserves user accounts and app data
- ✅ Safe to run multiple times

### Full Database Cleanup
- ⚠️ Waits 3 seconds with cancellation option
- ⚠️ Clear warning about data loss
- ⚠️ No automated backup
- ⚠️ Irreversible operation

---

## Foreign Key Deletion Order

The scripts follow this order to respect database constraints:

1. `webhook_events` (no dependencies)
2. `payment_transactions` (→ users)
3. `subscriptions` (→ users)
4. `generated_content` (→ startup_ideas)
5. `messages` (→ users, reddit_contacts)
6. `reddit_contacts` (→ users, reddit_posts)
7. `startup_ideas` (→ users)
8. `analytics_events` (→ users)
9. `email_logs` (→ users)
10. `reddit_posts` (no user dependency)
11. `usage_limits` (→ users)
12. `user_sessions` (→ users)
13. `users` (CASCADE handles remaining)

---

## Environment Requirements

All scripts require these environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

These are automatically loaded from `.env.local`.

---

## Troubleshooting

### Script fails with "permission denied"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Service role bypasses RLS policies

### Some tables show errors
- Table might not exist in your schema
- Check with `get-db-schema.ts` first

### Need to restore data
- These scripts don't create backups
- Use Supabase dashboard for manual backups before cleanup

---

## Pro Tips

1. **Before cleanup:** Run `get-db-schema.ts` to see current data
2. **During testing:** Use `cleanup-billing-data.ts` to reset payment state
3. **For demos:** Use `cleanup-all-data.ts` then seed fresh demo data
4. **Production:** Never run these on production databases!

---

## Support

These scripts are part of the Razorpay payment integration fixes.
Created during debugging of payment flow issues.

For issues, check the main project README or commit history.
