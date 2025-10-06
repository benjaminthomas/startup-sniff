-- Reddit Trend Engine: Performance Indexes
-- Creates indexes for optimal query performance on trend analysis

-- Posts table indexes for common query patterns
CREATE INDEX idx_posts_subreddit_created_utc ON posts(subreddit, created_utc DESC);
CREATE INDEX idx_posts_created_utc ON posts(created_utc DESC);
CREATE INDEX idx_posts_sentiment ON posts(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX idx_posts_score_comments ON posts(score, comments);
CREATE INDEX idx_posts_intent_flags ON posts USING GIN(intent_flags);
CREATE INDEX idx_posts_hash ON posts(hash); -- For fast deduplication lookups
CREATE INDEX idx_posts_user_id ON posts(user_id) WHERE user_id IS NOT NULL;

-- Topics table indexes
CREATE INDEX idx_topics_label ON topics(label);
CREATE INDEX idx_topics_keywords ON topics USING GIN(keywords);
CREATE INDEX idx_topics_last_seen_utc ON topics(last_seen_utc DESC);
CREATE INDEX idx_topics_user_id ON topics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);

-- Topic_posts junction table indexes for relationships
CREATE INDEX idx_topic_posts_topic_id ON topic_posts(topic_id);
CREATE INDEX idx_topic_posts_post_id ON topic_posts(post_id);
CREATE INDEX idx_topic_posts_similarity ON topic_posts(similarity DESC);
CREATE INDEX idx_topic_posts_created_at ON topic_posts(created_at DESC);

-- Topic_stats table indexes for analytics queries  
CREATE INDEX idx_topic_stats_topic_id_time_window ON topic_stats(topic_id, time_window);
CREATE INDEX idx_topic_stats_final_score ON topic_stats(final_score DESC);
CREATE INDEX idx_topic_stats_velocity ON topic_stats(velocity DESC);
CREATE INDEX idx_topic_stats_post_count ON topic_stats(post_count DESC);
CREATE INDEX idx_topic_stats_updated_at ON topic_stats(updated_at DESC);

-- Composite indexes for complex trend queries
CREATE INDEX idx_posts_subreddit_sentiment_created ON posts(subreddit, sentiment, created_utc DESC) 
  WHERE sentiment IS NOT NULL;

CREATE INDEX idx_posts_score_sentiment_created ON posts(score, sentiment, created_utc DESC) 
  WHERE sentiment IS NOT NULL AND score > 0;

-- Composite index for trending topic rankings
CREATE INDEX idx_topic_stats_time_window_score ON topic_stats(time_window, final_score DESC, velocity DESC);

-- Index for user's tracked keywords (on users table)
CREATE INDEX idx_users_keyword_tracks ON users USING GIN(keyword_tracks) 
  WHERE keyword_tracks IS NOT NULL AND array_length(keyword_tracks, 1) > 0;

-- Index for trend notifications
CREATE INDEX idx_users_trend_notifications ON users(trend_notifications_enabled, last_trend_check) 
  WHERE trend_notifications_enabled = true;

-- Indexes for startup_ideas trend integration  
CREATE INDEX idx_startup_ideas_source_topic_id ON startup_ideas(source_topic_id) 
  WHERE source_topic_id IS NOT NULL;

CREATE INDEX idx_startup_ideas_trend_context ON startup_ideas USING GIN(trend_context) 
  WHERE trend_context IS NOT NULL;

-- Partial indexes for active/recent data to improve performance
CREATE INDEX idx_posts_recent_24h ON posts(created_utc DESC, sentiment) 
  WHERE created_utc > (NOW() - INTERVAL '24 hours');

CREATE INDEX idx_posts_recent_7d ON posts(subreddit, created_utc DESC) 
  WHERE created_utc > (NOW() - INTERVAL '7 days');

CREATE INDEX idx_posts_high_engagement ON posts(score, comments, created_utc DESC) 
  WHERE score > 10 OR comments > 5;

-- Text search indexes for content analysis
CREATE INDEX idx_posts_title_trgm ON posts USING gin(title gin_trgm_ops);
CREATE INDEX idx_posts_body_trgm ON posts USING gin(body gin_trgm_ops) 
  WHERE body IS NOT NULL;

-- Enable pg_trgm extension for trigram text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Statistics indexes for analytical queries
CREATE INDEX idx_topic_stats_engagement_sentiment ON topic_stats(engagement_score, sentiment_avg) 
  WHERE engagement_score > 0 AND sentiment_avg IS NOT NULL;

-- Covering index for topic stats dashboard queries
CREATE INDEX idx_topic_stats_dashboard ON topic_stats(time_window, final_score DESC) 
  INCLUDE (topic_id, post_count, velocity, sentiment_avg, engagement_score, updated_at);

-- Index for cleanup/maintenance operations
CREATE INDEX idx_posts_created_at_cleanup ON posts(created_at) 
  WHERE created_at < (NOW() - INTERVAL '90 days');

CREATE INDEX idx_topic_stats_updated_at_stale ON topic_stats(updated_at) 
  WHERE updated_at < (NOW() - INTERVAL '1 hour');

-- Unique constraint indexes (automatically created, but explicitly documented)
-- posts.hash - unique constraint for deduplication
-- topic_stats.(topic_id, time_window) - unique constraint for stats aggregation