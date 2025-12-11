# Scripts Directory

This directory contains various utility scripts organized by purpose.

## Directory Structure

### `admin/` - Manual Admin Operations
Scripts for manual administrative tasks (use with caution in production):

- `activate-subscription-manual.ts` - Manually activate a user's subscription
- `clear-database.ts` - Clear all database tables
- `clear-database-safe.ts` - Safe database clearing with confirmations
- `clear-billing-data.ts` - Clear billing-related data only
- `fix-missing-subscription.ts` - Fix missing subscription records
- `manual-activate-subscription.ts` - Alternative manual activation script
- `process-expired-subscriptions.ts` - Process and handle expired subscriptions
- `sync-from-razorpay.ts` - Sync payment data from Razorpay

### `dev/` - Development Utilities
Scripts for development, testing, and debugging:

- `check-recent-payment.ts` - Check recent payment transactions
- `check-rls-policies.ts` - Verify Row Level Security policies
- `check-rls-simple.ts` - Simple RLS policy check
- `check-schema.ts` - Verify database schema
- `check-subscription-status.ts` - Check user subscription status
- `check-user-status.ts` - Check user account status
- `check-webhooks.ts` - Verify webhook configurations
- `get-db-schema.ts` - Export database schema
- `test-fetch-api.sh` - Test API endpoints
- `analyze-top-posts.ts` - Analyze Reddit post engagement
- `analyze-with-openai.ts` - Run AI analysis on content
- `detect-trends.ts` - Detect trending topics
- `score-all-posts.sh` - Score all Reddit posts
- `verify-migrations.ts` - Verify database migrations
- `start-ngrok.bat` - Start ngrok tunnel (Windows)
- `start-ngrok.sh` - Start ngrok tunnel (Unix)

### `migration/` - One-Time Migrations
Scripts for one-time database migrations and updates (completed):

- `apply-analytics-migration.ts` - Apply analytics schema changes
- `apply-migration.ts` - Generic migration applier
- `migrate-console-to-log.ts` - Migrate console.log to Winston logger (Phase 6 - COMPLETED)
- `update-all-client-logger.ts` - Update all client logger implementations
- `update-client-logger.ts` - Update single client logger

## Usage

### Running TypeScript Scripts

```bash
npx tsx scripts/admin/activate-subscription-manual.ts
npx tsx scripts/dev/check-schema.ts
npx tsx scripts/migration/verify-migrations.ts
```

### Running Shell Scripts

```bash
./scripts/dev/test-fetch-api.sh
./scripts/dev/score-all-posts.sh
```

## Safety Notes

- **Admin scripts** should only be run by administrators
- Always backup data before running destructive operations
- Test scripts in development environment first
- Migration scripts are meant to be run once and archived

## Environment Requirements

Most scripts require:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- Other environment variables as needed (check individual scripts)
