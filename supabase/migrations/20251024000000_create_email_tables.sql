-- Story 2.9: Email Notifications and Engagement
-- Create tables for email tracking and scheduling

-- Email logs table: Track all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'onboarding_day_1', 'onboarding_day_3', 'onboarding_day_7', 'weekly_summary', etc.
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mailgun_id TEXT, -- Mailgun message ID for tracking
  opened_at TIMESTAMPTZ, -- If tracking email opens
  clicked_at TIMESTAMPTZ, -- If tracking link clicks
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled emails table: Queue for future emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ, -- NULL until sent
  cancelled_at TIMESTAMPTZ, -- If user cancels before sending
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add email_preferences column to users table (if not exists)
-- This will store user email preferences as JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'email_preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN email_preferences JSONB DEFAULT '{
      "onboarding": true,
      "weekly_summary": true,
      "product_updates": true,
      "marketing": false
    }'::jsonb;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_sent_at ON scheduled_emails(sent_at);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own scheduled emails
CREATE POLICY "Users can view own scheduled emails"
  ON scheduled_emails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update email logs
CREATE POLICY "Service role can manage email logs"
  ON email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Only service role can manage scheduled emails
CREATE POLICY "Service role can manage scheduled emails"
  ON scheduled_emails
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comment documentation
COMMENT ON TABLE email_logs IS 'Tracks all emails sent to users for analytics and debugging';
COMMENT ON TABLE scheduled_emails IS 'Queue for future emails (onboarding drips, weekly summaries, etc.)';
COMMENT ON COLUMN users.email_preferences IS 'User email notification preferences (JSONB)';
