-- Create reddit_contacts table for Epic 2: Human Discovery
-- Stores discovered Reddit users who posted about pain points

CREATE TABLE IF NOT EXISTS reddit_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pain_point_id UUID NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,

  -- Reddit user information
  reddit_username TEXT NOT NULL,
  reddit_user_id TEXT NOT NULL,

  -- Post context
  post_id TEXT NOT NULL,
  post_excerpt TEXT,

  -- User profile metrics
  karma INT NOT NULL DEFAULT 0,
  account_age_days INT NOT NULL DEFAULT 0,
  posting_frequency DECIMAL(5,2) DEFAULT 0, -- Posts per week

  -- Ranking
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Metadata
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reddit_contacts_pain_point_id ON reddit_contacts(pain_point_id);
CREATE INDEX idx_reddit_contacts_engagement_score ON reddit_contacts(engagement_score DESC);
CREATE INDEX idx_reddit_contacts_reddit_username ON reddit_contacts(reddit_username);

-- Unique constraint: One contact record per user per pain point
CREATE UNIQUE INDEX idx_reddit_contacts_unique_user_pain_point
  ON reddit_contacts(pain_point_id, reddit_user_id);

-- RLS Policies
ALTER TABLE reddit_contacts ENABLE ROW LEVEL SECURITY;

-- Users can view contacts for pain points
CREATE POLICY "Users can view reddit contacts"
  ON reddit_contacts FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update contacts
CREATE POLICY "Service role can manage reddit contacts"
  ON reddit_contacts FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reddit_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reddit_contacts_updated_at
  BEFORE UPDATE ON reddit_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_reddit_contacts_updated_at();

-- Comment
COMMENT ON TABLE reddit_contacts IS 'Discovered Reddit users who posted about pain points (Epic 2: Human Discovery)';
