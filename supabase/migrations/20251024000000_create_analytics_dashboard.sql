/**
 * Analytics Dashboard Schema
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 *
 * Tracks user engagement, session metrics, and validation KPIs
 */

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Analytics Table
CREATE TABLE IF NOT EXISTS user_sessions_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  opportunities_viewed INTEGER DEFAULT 0,
  opportunities_clicked INTEGER DEFAULT 0,
  searches_performed INTEGER DEFAULT 0,
  filters_applied INTEGER DEFAULT 0,
  landing_page TEXT,
  exit_page TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Metrics Aggregation Table (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_opportunities_viewed INTEGER DEFAULT 0,
  avg_opportunities_per_session DECIMAL(10, 2) DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  seven_day_return_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL, -- survey, nps, feature_request, bug_report
  rating INTEGER, -- 1-10 for NPS, 1-5 for satisfaction
  comment TEXT,
  page_url TEXT,
  sentiment TEXT, -- positive, neutral, negative (from AI analysis)
  tags TEXT[], -- categorization tags
  status TEXT DEFAULT 'new', -- new, reviewed, acted_upon
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation Thresholds Table (configurable targets)
CREATE TABLE IF NOT EXISTS validation_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  green_threshold DECIMAL(10, 2) NOT NULL, -- Target value for GREEN zone
  yellow_threshold DECIMAL(10, 2) NOT NULL, -- Warning threshold for YELLOW zone
  red_threshold DECIMAL(10, 2) NOT NULL, -- Critical threshold for RED zone
  metric_unit TEXT, -- seconds, percentage, count
  higher_is_better BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_analytics_user_id ON user_sessions_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_analytics_started_at ON user_sessions_analytics(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Insert Default Validation Thresholds
INSERT INTO validation_thresholds (metric_name, green_threshold, yellow_threshold, red_threshold, metric_unit, higher_is_better)
VALUES
  ('avg_session_duration', 120, 90, 60, 'seconds', true),
  ('seven_day_return_rate', 25, 15, 10, 'percentage', true),
  ('opportunities_per_session', 2, 1.5, 1, 'count', true),
  ('bounce_rate', 60, 70, 80, 'percentage', false),
  ('new_user_signups', 10, 5, 2, 'count', true)
ON CONFLICT (metric_name) DO NOTHING;

-- Function to automatically update session analytics on event
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert session analytics
  INSERT INTO user_sessions_analytics (
    user_id,
    session_id,
    started_at,
    page_views,
    opportunities_viewed
  )
  VALUES (
    NEW.user_id,
    NEW.session_id,
    NEW.timestamp,
    CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_name = 'opportunity_viewed' THEN 1 ELSE 0 END
  )
  ON CONFLICT (session_id) DO UPDATE SET
    page_views = user_sessions_analytics.page_views + CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
    opportunities_viewed = user_sessions_analytics.opportunities_viewed + CASE WHEN NEW.event_name = 'opportunity_viewed' THEN 1 ELSE 0 END,
    opportunities_clicked = user_sessions_analytics.opportunities_clicked + CASE WHEN NEW.event_name = 'opportunity_clicked' THEN 1 ELSE 0 END,
    searches_performed = user_sessions_analytics.searches_performed + CASE WHEN NEW.event_name = 'search_performed' THEN 1 ELSE 0 END,
    filters_applied = user_sessions_analytics.filters_applied + CASE WHEN NEW.event_name = 'filter_applied' THEN 1 ELSE 0 END,
    ended_at = NEW.timestamp,
    duration_seconds = EXTRACT(EPOCH FROM (NEW.timestamp - user_sessions_analytics.started_at))::INTEGER,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session analytics
DROP TRIGGER IF EXISTS trigger_update_session_analytics ON analytics_events;
CREATE TRIGGER trigger_update_session_analytics
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_analytics();

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE)
RETURNS void AS $$
DECLARE
  v_total_sessions INTEGER;
  v_total_users INTEGER;
  v_new_users INTEGER;
  v_returning_users INTEGER;
  v_avg_duration INTEGER;
  v_total_page_views INTEGER;
  v_total_opps_viewed INTEGER;
  v_avg_opps_per_session DECIMAL(10, 2);
  v_bounce_rate DECIMAL(5, 2);
  v_seven_day_return DECIMAL(5, 2);
BEGIN
  -- Total sessions
  SELECT COUNT(*) INTO v_total_sessions
  FROM user_sessions_analytics
  WHERE DATE(started_at) = target_date;

  -- Total unique users
  SELECT COUNT(DISTINCT user_id) INTO v_total_users
  FROM user_sessions_analytics
  WHERE DATE(started_at) = target_date;

  -- New users (first session on this date)
  SELECT COUNT(DISTINCT user_id) INTO v_new_users
  FROM user_sessions_analytics usa
  WHERE DATE(usa.started_at) = target_date
    AND NOT EXISTS (
      SELECT 1 FROM user_sessions_analytics usa2
      WHERE usa2.user_id = usa.user_id
        AND DATE(usa2.started_at) < target_date
    );

  v_returning_users := v_total_users - v_new_users;

  -- Average session duration
  SELECT COALESCE(AVG(duration_seconds), 0)::INTEGER INTO v_avg_duration
  FROM user_sessions_analytics
  WHERE DATE(started_at) = target_date
    AND duration_seconds IS NOT NULL;

  -- Total page views
  SELECT COALESCE(SUM(page_views), 0)::INTEGER INTO v_total_page_views
  FROM user_sessions_analytics
  WHERE DATE(started_at) = target_date;

  -- Total opportunities viewed
  SELECT COALESCE(SUM(opportunities_viewed), 0)::INTEGER INTO v_total_opps_viewed
  FROM user_sessions_analytics
  WHERE DATE(started_at) = target_date;

  -- Average opportunities per session
  IF v_total_sessions > 0 THEN
    v_avg_opps_per_session := v_total_opps_viewed::DECIMAL / v_total_sessions;
  ELSE
    v_avg_opps_per_session := 0;
  END IF;

  -- Bounce rate (sessions with only 1 page view)
  IF v_total_sessions > 0 THEN
    SELECT (COUNT(*)::DECIMAL / v_total_sessions * 100) INTO v_bounce_rate
    FROM user_sessions_analytics
    WHERE DATE(started_at) = target_date
      AND page_views <= 1;
  ELSE
    v_bounce_rate := 0;
  END IF;

  -- 7-day return rate
  SELECT (COUNT(DISTINCT usa.user_id)::DECIMAL / NULLIF(v_total_users, 0) * 100) INTO v_seven_day_return
  FROM user_sessions_analytics usa
  WHERE DATE(usa.started_at) = target_date
    AND EXISTS (
      SELECT 1 FROM user_sessions_analytics usa2
      WHERE usa2.user_id = usa.user_id
        AND DATE(usa2.started_at) BETWEEN target_date - INTERVAL '7 days' AND target_date - INTERVAL '1 day'
    );

  v_seven_day_return := COALESCE(v_seven_day_return, 0);

  -- Upsert daily metrics
  INSERT INTO daily_metrics (
    metric_date,
    total_sessions,
    total_users,
    new_users,
    returning_users,
    avg_session_duration_seconds,
    total_page_views,
    total_opportunities_viewed,
    avg_opportunities_per_session,
    bounce_rate,
    seven_day_return_rate,
    updated_at
  )
  VALUES (
    target_date,
    v_total_sessions,
    v_total_users,
    v_new_users,
    v_returning_users,
    v_avg_duration,
    v_total_page_views,
    v_total_opps_viewed,
    v_avg_opps_per_session,
    v_bounce_rate,
    v_seven_day_return,
    NOW()
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    returning_users = EXCLUDED.returning_users,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    total_page_views = EXCLUDED.total_page_views,
    total_opportunities_viewed = EXCLUDED.total_opportunities_viewed,
    avg_opportunities_per_session = EXCLUDED.avg_opportunities_per_session,
    bounce_rate = EXCLUDED.bounce_rate,
    seven_day_return_rate = EXCLUDED.seven_day_return_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON user_sessions_analytics TO authenticated;
GRANT ALL ON daily_metrics TO authenticated;
GRANT ALL ON user_feedback TO authenticated;
GRANT SELECT ON validation_thresholds TO authenticated;

COMMENT ON TABLE analytics_events IS 'Tracks all user events for analytics and behavioral analysis';
COMMENT ON TABLE user_sessions_analytics IS 'Session-level analytics with engagement metrics';
COMMENT ON TABLE daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard queries';
COMMENT ON TABLE user_feedback IS 'User feedback, surveys, and NPS scores';
COMMENT ON TABLE validation_thresholds IS 'Configurable thresholds for GREEN/YELLOW/RED zone indicators';
