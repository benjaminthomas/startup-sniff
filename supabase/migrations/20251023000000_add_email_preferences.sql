-- Email Preferences Migration
-- Epic 2, Story 2.9: Email Notifications and Engagement
-- Created: 2025-10-23

-- Add email preference fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "marketing": true,
  "product_updates": true,
  "weekly_summary": true,
  "message_confirmations": true,
  "onboarding": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_onboarding_email VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS onboarding_day1_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS onboarding_day3_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS onboarding_day7_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS last_weekly_summary_sent_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index on email_unsubscribed for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email_unsubscribed ON users(email_unsubscribed);

-- Add index on onboarding email fields for scheduled job queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_emails ON users(
  created_at,
  onboarding_day1_sent_at,
  onboarding_day3_sent_at,
  onboarding_day7_sent_at
) WHERE email_unsubscribed = false;

-- Add comment explaining email preferences structure
COMMENT ON COLUMN users.email_preferences IS 'User email notification preferences: {
  "marketing": boolean,           -- Marketing emails
  "product_updates": boolean,      -- Product updates and news
  "weekly_summary": boolean,       -- Weekly engagement summary
  "message_confirmations": boolean, -- Reddit message confirmations
  "onboarding": boolean            -- Onboarding drip campaign
}';

COMMENT ON COLUMN users.email_unsubscribed IS 'Master unsubscribe flag - overrides all email preferences';
COMMENT ON COLUMN users.last_onboarding_email IS 'Last onboarding email sent: day1, day3, or day7';
COMMENT ON COLUMN users.last_weekly_summary_sent_at IS 'Timestamp of last weekly summary email sent';
