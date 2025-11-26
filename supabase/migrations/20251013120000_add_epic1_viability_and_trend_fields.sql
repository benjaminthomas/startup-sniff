-- Epic 1: Add Commercial Viability Scoring and Trend Analysis Fields
-- Migration to enhance reddit_posts table for Magical Reddit Extraction Engine

-- Add viability scoring fields
ALTER TABLE reddit_posts
ADD COLUMN IF NOT EXISTS viability_score INTEGER CHECK (viability_score >= 1 AND viability_score <= 10),
ADD COLUMN IF NOT EXISTS viability_explanation TEXT;

-- Add trend analysis fields
ALTER TABLE reddit_posts
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
ADD COLUMN IF NOT EXISTS trend_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS is_emerging BOOLEAN DEFAULT FALSE;

-- Create indexes for performance (filtering by viability score and trend)
CREATE INDEX IF NOT EXISTS idx_reddit_posts_viability_score
ON reddit_posts(viability_score DESC)
WHERE viability_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reddit_posts_trend_direction
ON reddit_posts(trend_direction)
WHERE trend_direction IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reddit_posts_created_utc_subreddit
ON reddit_posts(created_utc DESC, subreddit);

CREATE INDEX IF NOT EXISTS idx_reddit_posts_is_emerging
ON reddit_posts(is_emerging)
WHERE is_emerging = TRUE;

-- Add full-text search support
ALTER TABLE reddit_posts
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_reddit_posts_search
ON reddit_posts USING GIN(search_vector);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_reddit_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_reddit_posts_search_vector ON reddit_posts;
CREATE TRIGGER trigger_reddit_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, content ON reddit_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_reddit_posts_search_vector();

-- Backfill search_vector for existing posts (if any)
UPDATE reddit_posts
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
WHERE search_vector IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN reddit_posts.viability_score IS 'AI-generated commercial viability score (1-10 scale)';
COMMENT ON COLUMN reddit_posts.viability_explanation IS '2-3 sentence explanation of viability score factors';
COMMENT ON COLUMN reddit_posts.weekly_frequency IS 'Number of mentions this week for trend analysis';
COMMENT ON COLUMN reddit_posts.trend_direction IS 'Trend direction: up (growing), down (declining), stable';
COMMENT ON COLUMN reddit_posts.trend_percentage IS 'Week-over-week percentage change in mentions';
COMMENT ON COLUMN reddit_posts.is_emerging IS 'True if >50% growth with <10 mentions (emerging pain point)';
COMMENT ON COLUMN reddit_posts.search_vector IS 'Full-text search vector for title and content';
