-- Epic 2, Story 2.4: Rate Limiting
-- Add message quota tracking to usage_limits table

ALTER TABLE usage_limits ADD COLUMN IF NOT EXISTS messages_sent_today INT DEFAULT 0;
ALTER TABLE usage_limits ADD COLUMN IF NOT EXISTS message_reset_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day';

-- Add index for efficient daily reset queries
CREATE INDEX IF NOT EXISTS idx_usage_limits_message_reset ON usage_limits(message_reset_date);

-- Add comments
COMMENT ON COLUMN usage_limits.messages_sent_today IS 'Number of Reddit messages sent today (resets daily at midnight UTC)';
COMMENT ON COLUMN usage_limits.message_reset_date IS 'When the message quota will reset (next midnight UTC)';
