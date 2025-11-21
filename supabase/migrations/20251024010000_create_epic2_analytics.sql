/**
 * Epic 2 Analytics Tables
 * Story 2.12: Epic 2 Validation Dashboard
 *
 * Tracks conversion funnel, messaging performance, and revenue metrics
 */

-- Epic 2 Daily Metrics Table
-- Aggregated metrics calculated once per day via cron job
CREATE TABLE IF NOT EXISTS epic2_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,

  -- User metrics
  total_users INTEGER DEFAULT 0,
  free_users INTEGER DEFAULT 0,
  paid_users INTEGER DEFAULT 0,
  trial_users INTEGER DEFAULT 0,

  -- Conversion metrics
  signups_today INTEGER DEFAULT 0,
  upgrades_today INTEGER DEFAULT 0,
  churns_today INTEGER DEFAULT 0,
  free_to_paid_conversion_rate DECIMAL(5,2) DEFAULT 0, -- Percentage

  -- Messaging metrics
  messages_sent_today INTEGER DEFAULT 0,
  unique_senders_today INTEGER DEFAULT 0,
  avg_messages_per_sender DECIMAL(10,2) DEFAULT 0,
  message_send_rate DECIMAL(5,2) DEFAULT 0, -- % of users who sent messages

  -- Template performance
  templates_generated_today INTEGER DEFAULT 0,
  templates_edited_today INTEGER DEFAULT 0,
  template_edit_rate DECIMAL(5,2) DEFAULT 0, -- % of templates that were edited

  -- Response tracking (when available)
  responses_received_today INTEGER DEFAULT 0,
  template_response_rate DECIMAL(5,2) DEFAULT 0, -- % of sent messages that got responses

  -- Revenue metrics
  mrr DECIMAL(10,2) DEFAULT 0, -- Monthly Recurring Revenue in USD
  daily_revenue DECIMAL(10,2) DEFAULT 0,
  avg_revenue_per_user DECIMAL(10,2) DEFAULT 0,

  -- Engagement metrics
  avg_session_duration_seconds INTEGER DEFAULT 0,
  opportunities_viewed_today INTEGER DEFAULT 0,
  contacts_discovered_today INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epic2_daily_metrics_date ON epic2_daily_metrics(metric_date DESC);

-- Epic 2 Cohort Analysis Table
-- Tracks user cohorts by signup date
CREATE TABLE IF NOT EXISTS epic2_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL, -- First day of signup month
  cohort_size INTEGER DEFAULT 0, -- Users who signed up in this month

  -- Retention by month
  month_0_retained INTEGER DEFAULT 0, -- Signup month
  month_1_retained INTEGER DEFAULT 0,
  month_2_retained INTEGER DEFAULT 0,
  month_3_retained INTEGER DEFAULT 0,
  month_6_retained INTEGER DEFAULT 0,

  -- Revenue by month
  month_0_revenue DECIMAL(10,2) DEFAULT 0,
  month_1_revenue DECIMAL(10,2) DEFAULT 0,
  month_2_revenue DECIMAL(10,2) DEFAULT 0,
  month_3_revenue DECIMAL(10,2) DEFAULT 0,
  month_6_revenue DECIMAL(10,2) DEFAULT 0,

  -- Conversion metrics
  total_upgrades INTEGER DEFAULT 0,
  avg_days_to_upgrade DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cohort_month)
);

CREATE INDEX IF NOT EXISTS idx_epic2_cohorts_month ON epic2_cohorts(cohort_month DESC);

-- Epic 2 Conversion Funnel Events
-- Track each step of the conversion funnel
CREATE TABLE IF NOT EXISTS epic2_conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'signup', 'reddit_connected', 'contact_discovered', 'template_generated', 'message_sent', 'upgraded', 'churned'
  event_metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epic2_conversion_events_user ON epic2_conversion_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_epic2_conversion_events_type ON epic2_conversion_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_epic2_conversion_events_session ON epic2_conversion_events(session_id);

-- Epic 2 Validation Thresholds
-- Define GREEN/YELLOW/RED zones for Epic 2 metrics
CREATE TABLE IF NOT EXISTS epic2_validation_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  green_threshold DECIMAL(10,2) NOT NULL,
  yellow_threshold DECIMAL(10,2) NOT NULL,
  red_threshold DECIMAL(10,2) NOT NULL,
  metric_unit TEXT, -- 'percentage', 'dollars', 'count', 'seconds'
  higher_is_better BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Epic 2 validation thresholds
INSERT INTO epic2_validation_thresholds (metric_name, green_threshold, yellow_threshold, red_threshold, metric_unit, higher_is_better)
VALUES
  ('free_to_paid_conversion', 5.0, 3.0, 2.0, 'percentage', true),
  ('message_send_rate', 10.0, 7.0, 5.0, 'percentage', true),
  ('template_response_rate', 15.0, 10.0, 5.0, 'percentage', true),
  ('monthly_recurring_revenue', 200.0, 100.0, 50.0, 'dollars', true),
  ('churn_rate', 15.0, 20.0, 25.0, 'percentage', false)
ON CONFLICT (metric_name) DO NOTHING;

-- Function to calculate Epic 2 daily metrics
CREATE OR REPLACE FUNCTION calculate_epic2_daily_metrics(target_date DATE)
RETURNS void AS $$
DECLARE
  v_total_users INTEGER;
  v_free_users INTEGER;
  v_paid_users INTEGER;
  v_trial_users INTEGER;
  v_signups_today INTEGER;
  v_upgrades_today INTEGER;
  v_churns_today INTEGER;
  v_messages_sent_today INTEGER;
  v_unique_senders INTEGER;
  v_avg_messages_per_sender DECIMAL(10,2);
  v_message_send_rate DECIMAL(10,2);
  v_templates_generated INTEGER;
  v_templates_edited INTEGER;
  v_template_edit_rate DECIMAL(10,2);
  v_responses_received INTEGER;
  v_template_response_rate DECIMAL(10,2);
  v_mrr DECIMAL(10,2);
  v_daily_revenue DECIMAL(10,2);
  v_arpu DECIMAL(10,2);
  v_free_to_paid_rate DECIMAL(10,2);
  v_opportunities_viewed INTEGER;
  v_contacts_discovered INTEGER;
  v_avg_session_duration INTEGER;
BEGIN
  -- Calculate user counts at end of target date
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE plan_type = 'free'),
    COUNT(*) FILTER (WHERE plan_type IN ('pro_monthly', 'pro_yearly')),
    COUNT(*) FILTER (WHERE subscription_status = 'trial')
  INTO v_total_users, v_free_users, v_paid_users, v_trial_users
  FROM users
  WHERE created_at::date <= target_date;

  -- Calculate signups on target date
  SELECT COUNT(*) INTO v_signups_today
  FROM users
  WHERE created_at::date = target_date;

  -- Calculate upgrades on target date (subscriptions created)
  SELECT COUNT(*) INTO v_upgrades_today
  FROM subscriptions
  WHERE created_at::date = target_date
    AND status = 'active';

  -- Calculate churns on target date (subscriptions cancelled)
  SELECT COUNT(*) INTO v_churns_today
  FROM subscriptions
  WHERE updated_at::date = target_date
    AND status = 'cancelled';

  -- Calculate messaging metrics
  SELECT COUNT(*), COUNT(DISTINCT user_id)
  INTO v_messages_sent_today, v_unique_senders
  FROM messages
  WHERE sent_at::date = target_date;

  -- Calculate average messages per sender
  v_avg_messages_per_sender := CASE
    WHEN v_unique_senders > 0 THEN v_messages_sent_today::DECIMAL / v_unique_senders
    ELSE 0
  END;

  -- Calculate message send rate (% of users who sent messages)
  v_message_send_rate := CASE
    WHEN v_total_users > 0 THEN (v_unique_senders::DECIMAL / v_total_users * 100)
    ELSE 0
  END;

  -- Calculate template metrics (from analytics_events)
  SELECT
    COUNT(*) FILTER (WHERE event_name = 'template_generated'),
    COUNT(*) FILTER (WHERE event_name = 'template_edited')
  INTO v_templates_generated, v_templates_edited
  FROM analytics_events
  WHERE timestamp::date = target_date;

  v_template_edit_rate := CASE
    WHEN v_templates_generated > 0 THEN (v_templates_edited::DECIMAL / v_templates_generated * 100)
    ELSE 0
  END;

  -- Calculate response metrics (using replied_at field)
  SELECT COUNT(*) INTO v_responses_received
  FROM messages
  WHERE replied_at::date = target_date;

  -- Calculate template response rate (messages with replies / total sent)
  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE replied_at IS NOT NULL)::DECIMAL / COUNT(*) * 100)
      ELSE 0
    END
  INTO v_template_response_rate
  FROM messages
  WHERE sent_at::date <= target_date;

  -- Calculate MRR (Monthly Recurring Revenue)
  -- Sum of all active subscriptions normalized to monthly
  SELECT COALESCE(SUM(
    CASE
      WHEN s.plan_type = 'pro_monthly' THEN 29.0  -- $29/month
      WHEN s.plan_type = 'pro_yearly' THEN 290.0 / 12  -- $290/year = ~$24/month
      ELSE 0
    END
  ), 0)
  INTO v_mrr
  FROM subscriptions s
  WHERE s.status = 'active'
    AND s.created_at::date <= target_date;

  -- Calculate daily revenue (subscriptions created today)
  SELECT COALESCE(SUM(
    CASE
      WHEN s.plan_type = 'pro_monthly' THEN 29.0
      WHEN s.plan_type = 'pro_yearly' THEN 290.0
      ELSE 0
    END
  ), 0)
  INTO v_daily_revenue
  FROM subscriptions s
  WHERE s.created_at::date = target_date
    AND s.status = 'active';

  -- Calculate ARPU (Average Revenue Per User)
  v_arpu := CASE
    WHEN v_total_users > 0 THEN v_mrr / v_total_users
    ELSE 0
  END;

  -- Calculate free-to-paid conversion rate (all time)
  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE plan_type IN ('pro_monthly', 'pro_yearly'))::DECIMAL / COUNT(*) * 100)
      ELSE 0
    END
  INTO v_free_to_paid_rate
  FROM users
  WHERE created_at::date <= target_date;

  -- Calculate engagement metrics from analytics
  SELECT
    COUNT(*) FILTER (WHERE event_name = 'opportunity_viewed'),
    COUNT(*) FILTER (WHERE event_name = 'contact_discovered')
  INTO v_opportunities_viewed, v_contacts_discovered
  FROM analytics_events
  WHERE timestamp::date = target_date;

  -- Calculate average session duration
  SELECT COALESCE(AVG(duration_seconds), 0)::INTEGER
  INTO v_avg_session_duration
  FROM user_sessions_analytics
  WHERE started_at::date = target_date
    AND duration_seconds IS NOT NULL;

  -- Insert or update daily metrics
  INSERT INTO epic2_daily_metrics (
    metric_date,
    total_users,
    free_users,
    paid_users,
    trial_users,
    signups_today,
    upgrades_today,
    churns_today,
    free_to_paid_conversion_rate,
    messages_sent_today,
    unique_senders_today,
    avg_messages_per_sender,
    message_send_rate,
    templates_generated_today,
    templates_edited_today,
    template_edit_rate,
    responses_received_today,
    template_response_rate,
    mrr,
    daily_revenue,
    avg_revenue_per_user,
    avg_session_duration_seconds,
    opportunities_viewed_today,
    contacts_discovered_today,
    updated_at
  )
  VALUES (
    target_date,
    v_total_users,
    v_free_users,
    v_paid_users,
    v_trial_users,
    v_signups_today,
    v_upgrades_today,
    v_churns_today,
    v_free_to_paid_rate,
    v_messages_sent_today,
    v_unique_senders,
    v_avg_messages_per_sender,
    v_message_send_rate,
    v_templates_generated,
    v_templates_edited,
    v_template_edit_rate,
    v_responses_received,
    v_template_response_rate,
    v_mrr,
    v_daily_revenue,
    v_arpu,
    v_avg_session_duration,
    v_opportunities_viewed,
    v_contacts_discovered,
    NOW()
  )
  ON CONFLICT (metric_date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    free_users = EXCLUDED.free_users,
    paid_users = EXCLUDED.paid_users,
    trial_users = EXCLUDED.trial_users,
    signups_today = EXCLUDED.signups_today,
    upgrades_today = EXCLUDED.upgrades_today,
    churns_today = EXCLUDED.churns_today,
    free_to_paid_conversion_rate = EXCLUDED.free_to_paid_conversion_rate,
    messages_sent_today = EXCLUDED.messages_sent_today,
    unique_senders_today = EXCLUDED.unique_senders_today,
    avg_messages_per_sender = EXCLUDED.avg_messages_per_sender,
    message_send_rate = EXCLUDED.message_send_rate,
    templates_generated_today = EXCLUDED.templates_generated_today,
    templates_edited_today = EXCLUDED.templates_edited_today,
    template_edit_rate = EXCLUDED.template_edit_rate,
    responses_received_today = EXCLUDED.responses_received_today,
    template_response_rate = EXCLUDED.template_response_rate,
    mrr = EXCLUDED.mrr,
    daily_revenue = EXCLUDED.daily_revenue,
    avg_revenue_per_user = EXCLUDED.avg_revenue_per_user,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    opportunities_viewed_today = EXCLUDED.opportunities_viewed_today,
    contacts_discovered_today = EXCLUDED.contacts_discovered_today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE epic2_daily_metrics IS 'Epic 2 daily aggregated metrics for validation dashboard';
COMMENT ON TABLE epic2_cohorts IS 'User cohort analysis by signup month for retention tracking';
COMMENT ON TABLE epic2_conversion_events IS 'Conversion funnel event tracking for Epic 2';
COMMENT ON TABLE epic2_validation_thresholds IS 'GREEN/YELLOW/RED zone thresholds for Epic 2 metrics';
COMMENT ON FUNCTION calculate_epic2_daily_metrics IS 'Calculate and store Epic 2 metrics for a specific date';
