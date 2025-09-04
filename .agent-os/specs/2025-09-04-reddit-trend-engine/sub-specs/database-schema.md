# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-04-reddit-trend-engine/spec.md

> Created: 2025-09-04
> Version: 1.0.0

## New Tables

### posts Table

```sql
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
  sentiment NUMERIC(3,2), -- -1.00 to 1.00
  intent_flags TEXT[], -- ["struggling", "tool_seeking", "validation", "market_research"]
  hash TEXT UNIQUE NOT NULL, -- deduplication hash (title + author + created_utc)
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### topics Table

```sql
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

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### topic_posts Table (Many-to-Many)

```sql
CREATE TABLE topic_posts (
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  similarity NUMERIC(3,2) DEFAULT 0.00, -- 0.00 to 1.00 keyword match score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (topic_id, post_id)
);

-- Enable RLS
ALTER TABLE topic_posts ENABLE ROW LEVEL SECURITY;
```

### topic_stats Table

```sql
CREATE TABLE topic_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  time_window TEXT CHECK (time_window IN ('24h', '7d', '30d')),
  post_count INTEGER DEFAULT 0,
  velocity NUMERIC(10,2) DEFAULT 0.00, -- posts per hour in time window
  sentiment_avg NUMERIC(3,2), -- average sentiment across posts
  engagement_score NUMERIC(10,2) DEFAULT 0.00, -- normalized score + comments metric
  final_score NUMERIC(10,2) DEFAULT 0.00, -- weighted ranking score
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (topic_id, time_window)
);

-- Enable RLS
ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_topic_stats_updated_at 
  BEFORE UPDATE ON topic_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Modifications to Existing Tables

### users Table Enhancements

```sql
-- Add Reddit trend tracking preferences
ALTER TABLE users 
ADD COLUMN keyword_tracks TEXT[] DEFAULT '{}',
ADD COLUMN last_trend_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN trend_notifications_enabled BOOLEAN DEFAULT false;
```

### startup_ideas Integration

```sql
-- Connect ideas to trending topics
ALTER TABLE startup_ideas
ADD COLUMN source_topic_id UUID REFERENCES topics(id),
ADD COLUMN trend_context JSONB, -- {velocity: 5.2, sentiment: 0.75, post_count: 42}
ADD COLUMN trend_explanation TEXT; -- "This trend is growing 3x faster than average..."
```

## Indexes and Performance Optimization

### Primary Query Indexes

```sql
-- Posts table indexes
CREATE INDEX idx_posts_subreddit_created ON posts(subreddit, created_utc DESC);
CREATE INDEX idx_posts_sentiment ON posts(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_hash ON posts(hash); -- Already unique, but explicit for lookups
CREATE INDEX idx_posts_intent_flags ON posts USING GIN(intent_flags);

-- Topics table indexes  
CREATE INDEX idx_topics_user_updated ON topics(user_id, updated_at DESC);
CREATE INDEX idx_topics_keywords ON topics USING GIN(keywords);
CREATE INDEX idx_topics_last_seen ON topics(last_seen_utc DESC);

-- Topic-posts relationship indexes
CREATE INDEX idx_topic_posts_topic_similarity ON topic_posts(topic_id, similarity DESC);
CREATE INDEX idx_topic_posts_post_id ON topic_posts(post_id);

-- Topic stats indexes
CREATE INDEX idx_topic_stats_topic_window ON topic_stats(topic_id, time_window);
CREATE INDEX idx_topic_stats_final_score ON topic_stats(final_score DESC, time_window);
CREATE INDEX idx_topic_stats_velocity ON topic_stats(velocity DESC, time_window);
```

### Performance Optimization Indexes

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_posts_trending_query ON posts(created_utc DESC, sentiment, score) 
  WHERE created_utc > NOW() - INTERVAL '7 days';

CREATE INDEX idx_topic_stats_trending ON topic_stats(time_window, final_score DESC, velocity DESC);

-- Partial indexes for active data
CREATE INDEX idx_posts_recent_active ON posts(created_utc, score) 
  WHERE created_utc > NOW() - INTERVAL '30 days' AND score > 0;
```

## Row Level Security (RLS) Policies

### posts Table Policies

```sql
-- Users can only access posts they've tracked or global system posts
CREATE POLICY "Users access own tracked posts" ON posts 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Only system can insert posts (via background jobs)
CREATE POLICY "System inserts posts" ON posts 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users cannot update or delete posts
CREATE POLICY "No user modifications" ON posts 
  FOR UPDATE USING (false);
  
CREATE POLICY "No user deletions" ON posts 
  FOR DELETE USING (false);
```

### topics Table Policies

```sql
-- Users can only access their own topics
CREATE POLICY "Users access own topics" ON topics 
  FOR ALL USING (auth.uid() = user_id);
```

### topic_posts Table Policies

```sql
-- Users can access topic-post relationships for their topics
CREATE POLICY "Users access own topic posts" ON topic_posts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics 
      WHERE topics.id = topic_posts.topic_id 
      AND topics.user_id = auth.uid()
    )
  );

-- System inserts topic-post relationships
CREATE POLICY "System manages topic posts" ON topic_posts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics 
      WHERE topics.id = topic_posts.topic_id 
      AND topics.user_id = auth.uid()
    )
  );
```

### topic_stats Table Policies

```sql
-- Users can access stats for their topics
CREATE POLICY "Users access own topic stats" ON topic_stats 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics 
      WHERE topics.id = topic_stats.topic_id 
      AND topics.user_id = auth.uid()
    )
  );

-- System updates stats
CREATE POLICY "System updates topic stats" ON topic_stats 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM topics 
      WHERE topics.id = topic_stats.topic_id
    )
  );
```

## Data Validation and Constraints

### Check Constraints

```sql
-- Sentiment bounds
ALTER TABLE posts ADD CONSTRAINT check_sentiment_range 
  CHECK (sentiment IS NULL OR (sentiment >= -1.00 AND sentiment <= 1.00));

-- Similarity bounds  
ALTER TABLE topic_posts ADD CONSTRAINT check_similarity_range
  CHECK (similarity >= 0.00 AND similarity <= 1.00);

-- Score bounds
ALTER TABLE topic_stats ADD CONSTRAINT check_scores_positive
  CHECK (
    post_count >= 0 AND 
    velocity >= 0.00 AND 
    engagement_score >= 0.00 AND 
    final_score >= 0.00
  );

-- Intent flags validation
ALTER TABLE posts ADD CONSTRAINT check_valid_intent_flags
  CHECK (
    intent_flags <@ ARRAY['struggling', 'tool_seeking', 'validation', 'market_research', 'pain_point', 'solution_needed']
  );
```

## Migration Strategy

### Phase 1: Core Tables

```sql
-- Create tables in dependency order
-- 1. posts (independent)
-- 2. topics (independent) 
-- 3. topic_posts (depends on posts, topics)
-- 4. topic_stats (depends on topics)
-- 5. Modify existing tables (users, startup_ideas)
```

### Phase 2: Indexes and RLS

```sql
-- Create all indexes after initial data load
-- Enable RLS policies
-- Create validation constraints
```

### Phase 3: Data Population

```sql
-- Backfill historical Reddit data (if any)
-- Initialize topic stats with zero values
-- Update users with default preferences
```

## Rationale and Design Decisions

### Hash-Based Deduplication

**Decision**: Use SHA-256 hash of `title + author + created_utc` for deduplication.

**Rationale**: 
- Reddit posts can be cross-posted or reposted with identical content
- Hash prevents duplicate storage and processing
- Unique constraint ensures data integrity
- Lightweight compared to full-text comparison

### Time-Window Statistics Approach

**Decision**: Pre-calculate statistics for fixed windows (24h, 7d, 30d).

**Rationale**:
- Real-time trend analysis requires fast lookups
- Avoid expensive aggregation queries on every request
- Background jobs can maintain statistics efficiently
- Supports different time-horizon trend analysis

### Scoring Methodology

**Decision**: Separate velocity, engagement, and final scores.

**Rationale**:
- Velocity (posts/hour) measures trending momentum
- Engagement (score + comments) measures community interest  
- Final score combines multiple factors with configurable weights
- Allows for future enhancement of scoring algorithm

### Intent Flag Arrays

**Decision**: Store user intents as PostgreSQL text arrays.

**Rationale**:
- Posts often express multiple intents simultaneously
- Arrays support efficient querying with GIN indexes
- Predefined set ensures consistency
- Extensible for future intent categories

### JSONB Trend Context

**Decision**: Store trend metadata as JSONB in startup_ideas.

**Rationale**:
- Flexible schema for evolving trend data
- Efficient storage and querying
- Preserves historical context when ideas were generated
- Supports rich explanations of "why this trend now"

### RLS Security Model

**Decision**: User-scoped access with system override capabilities.

**Rationale**:
- Users only see their tracked trends and generated ideas
- System processes can access all data for analysis
- Prevents data leakage between users
- Supports future multi-tenant enhancements

## Performance Considerations

### Query Patterns

1. **Trending Topics**: `SELECT * FROM topic_stats WHERE time_window = '24h' ORDER BY final_score DESC LIMIT 10`
2. **Topic Posts**: `SELECT p.* FROM posts p JOIN topic_posts tp ON p.id = tp.post_id WHERE tp.topic_id = $1 ORDER BY tp.similarity DESC`
3. **User Trends**: `SELECT t.*, ts.* FROM topics t JOIN topic_stats ts ON t.id = ts.topic_id WHERE t.user_id = $1`

### Scaling Strategies

- **Partitioning**: Consider time-based partitioning for posts table as data grows
- **Archival**: Archive posts older than 90 days to reduce query load
- **Caching**: Cache topic_stats for frequently accessed time windows
- **Read Replicas**: Use read replicas for trend analysis queries

### Background Job Considerations

- **Incremental Processing**: Process new posts since last run
- **Batch Updates**: Update topic_stats in batches to avoid lock contention
- **Rate Limiting**: Respect Reddit API limits during data collection
- **Error Handling**: Graceful handling of malformed or deleted posts