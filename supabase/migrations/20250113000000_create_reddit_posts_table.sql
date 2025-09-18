-- Create Reddit posts table for trend analysis
CREATE TABLE IF NOT EXISTS reddit_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_id TEXT UNIQUE NOT NULL,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    author TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_utc TIMESTAMPTZ NOT NULL,
    hash TEXT NOT NULL,
    sentiment DECIMAL(3,2), -- -1.00 to 1.00
    intent_flags TEXT[] DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    analysis_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_created_utc ON reddit_posts(created_utc);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_score ON reddit_posts(score);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_hash ON reddit_posts(hash);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_sentiment ON reddit_posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_intent_flags ON reddit_posts USING GIN(intent_flags);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reddit_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_reddit_posts_updated_at
    BEFORE UPDATE ON reddit_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_reddit_posts_updated_at();

-- Add RLS policies
ALTER TABLE reddit_posts ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (for trend data)
CREATE POLICY "Allow read access to reddit posts" ON reddit_posts
    FOR SELECT TO authenticated
    USING (true);

-- Only allow insert/update from service role (for data collection)
CREATE POLICY "Allow service to manage reddit posts" ON reddit_posts
    FOR ALL TO service_role
    USING (true);