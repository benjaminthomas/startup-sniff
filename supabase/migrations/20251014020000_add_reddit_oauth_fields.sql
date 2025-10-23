-- Epic 2, Story 2.2: Reddit OAuth Integration
-- Add Reddit OAuth token fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_connected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_username TEXT;

-- Create index for efficient lookups by Reddit username
CREATE INDEX IF NOT EXISTS idx_users_reddit_username ON users(reddit_username) WHERE reddit_username IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.reddit_access_token IS 'Reddit OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN users.reddit_refresh_token IS 'Reddit OAuth refresh token (encrypted at rest by Supabase)';
COMMENT ON COLUMN users.reddit_token_expires_at IS 'When the Reddit access token expires (1 hour from issue)';
COMMENT ON COLUMN users.reddit_connected_at IS 'When the user first connected their Reddit account';
COMMENT ON COLUMN users.reddit_username IS 'Reddit username of the connected account';
