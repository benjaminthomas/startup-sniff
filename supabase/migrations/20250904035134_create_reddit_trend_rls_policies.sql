-- Reddit Trend Engine: Row Level Security Policies
-- Implements RLS policies for posts, topics, topic_posts, and topic_stats tables

-- Enable RLS on all new tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;

-- Posts table policies
-- Users can only access posts related to their own operations
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (true); -- All users can view posts for trend analysis

CREATE POLICY "System can insert posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'service_role');

CREATE POLICY "System can update posts" ON posts
  FOR UPDATE USING (auth.uid() IS NOT NULL OR current_user = 'service_role');

CREATE POLICY "System can delete posts" ON posts
  FOR DELETE USING (auth.uid() IS NOT NULL OR current_user = 'service_role');

-- Topics table policies  
-- Users can access their own topics or system-generated topics
CREATE POLICY "Users can view all topics" ON topics
  FOR SELECT USING (true); -- All users can view topics for trend analysis

CREATE POLICY "Users can create their own topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own topics" ON topics
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own topics" ON topics
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Topic_posts table policies
-- Junction table accessible to all authenticated users for analysis
CREATE POLICY "Users can view topic-post relationships" ON topic_posts
  FOR SELECT USING (true);

CREATE POLICY "System can manage topic-post relationships" ON topic_posts
  FOR ALL WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'service_role');

-- Topic_stats table policies
-- Statistics accessible to all users for trend analysis
CREATE POLICY "Users can view topic statistics" ON topic_stats
  FOR SELECT USING (true);

CREATE POLICY "System can manage topic statistics" ON topic_stats
  FOR ALL WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'service_role');

-- Special policies for system-level operations
-- Allow service role to perform maintenance operations
CREATE POLICY "Service role full access on posts" ON posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on topics" ON topics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on topic_posts" ON topic_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on topic_stats" ON topic_stats
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON posts TO authenticated;
GRANT SELECT ON topics TO authenticated;
GRANT SELECT ON topic_posts TO authenticated;
GRANT SELECT ON topic_stats TO authenticated;

-- Grant insert/update permissions for user-generated content
GRANT INSERT, UPDATE, DELETE ON topics TO authenticated;

-- Grant full permissions to service role for background processing
GRANT ALL ON posts TO service_role;
GRANT ALL ON topics TO service_role;
GRANT ALL ON topic_posts TO service_role;
GRANT ALL ON topic_stats TO service_role;