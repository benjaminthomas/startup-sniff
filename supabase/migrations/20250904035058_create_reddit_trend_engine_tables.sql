-- Reddit Trend Engine: Core Tables Migration
-- Creates posts, topics, topic_posts, and topic_stats tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create posts table for Reddit post data
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subreddit TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  author TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  sentiment NUMERIC(3,2) CHECK (sentiment >= -1.00 AND sentiment <= 1.00),
  intent_flags TEXT[] DEFAULT '{}',
  hash TEXT UNIQUE NOT NULL, -- For deduplication
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table for trending topic clusters
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  description TEXT,
  last_seen_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for many-to-many relationship
CREATE TABLE topic_posts (
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  similarity NUMERIC(3,2) DEFAULT 0.00 CHECK (similarity >= 0.00 AND similarity <= 1.00),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (topic_id, post_id)
);

-- Create topic_stats table for pre-calculated analytics
CREATE TABLE topic_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  time_window TEXT CHECK (time_window IN ('24h', '7d', '30d')),
  post_count INTEGER DEFAULT 0,
  velocity NUMERIC(10,2) DEFAULT 0.00, -- posts per hour
  sentiment_avg NUMERIC(3,2) CHECK (sentiment_avg >= -1.00 AND sentiment_avg <= 1.00),
  engagement_score NUMERIC(10,2) DEFAULT 0.00, -- normalized engagement
  final_score NUMERIC(10,2) DEFAULT 0.00, -- weighted final ranking
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (topic_id, time_window)
);

-- Add trend-related columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS keyword_tracks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_trend_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trend_notifications_enabled BOOLEAN DEFAULT false;

-- Add trend integration columns to existing startup_ideas table
ALTER TABLE startup_ideas
ADD COLUMN IF NOT EXISTS source_topic_id UUID REFERENCES topics(id),
ADD COLUMN IF NOT EXISTS trend_context JSONB,
ADD COLUMN IF NOT EXISTS trend_explanation TEXT;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to new tables
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_stats_updated_at 
  BEFORE UPDATE ON topic_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();