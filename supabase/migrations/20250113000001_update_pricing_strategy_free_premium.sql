-- Update pricing strategy to Free vs Premium model
-- Migration: 20250113000001_update_pricing_strategy_free_premium

-- Add new enum value for premium if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'premium' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
        ALTER TYPE plan_type ADD VALUE 'premium';
    END IF;
END $$;

-- Update usage limits for our new pricing model
-- Free Plan (Explorer): 3 ideas/month, 1 validation/month
-- Premium Plan (Premium): Unlimited ideas, 10 validations/month

-- Update existing limits for explorer (free) plan to be more generous initially
UPDATE usage_limits
SET
    monthly_limit_ideas = 5, -- Increased from 3 to 5 for better onboarding
    monthly_limit_validations = 2
WHERE plan_type = 'explorer';

-- Set limits for premium plan (we'll handle unlimited in the app logic)
INSERT INTO usage_limits (user_id, plan_type, monthly_limit_ideas, monthly_limit_validations, ideas_generated, validations_completed)
SELECT
    u.id as user_id,
    'premium'::plan_type,
    999, -- High number to represent "unlimited"
    25,  -- 25 validations per month for premium
    0,   -- Reset usage
    0    -- Reset usage
FROM users u
WHERE u.plan_type = 'founder' OR u.plan_type = 'growth'
ON CONFLICT DO NOTHING;

-- Create usage limits for premium users where they don't exist
INSERT INTO usage_limits (user_id, plan_type, monthly_limit_ideas, monthly_limit_validations, ideas_generated, validations_completed)
SELECT DISTINCT
    u.id as user_id,
    'premium'::plan_type,
    999,
    25,
    0,
    0
FROM users u
LEFT JOIN usage_limits ul ON u.id = ul.user_id AND ul.plan_type = 'premium'::plan_type
WHERE u.plan_type IN ('founder', 'growth') AND ul.user_id IS NULL;

-- Add a new table to track Reddit-based features usage
CREATE TABLE IF NOT EXISTS reddit_features_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- 'pain_points_viewed', 'ideas_from_pain_points', 'trend_alerts', etc.
    usage_count INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 0, -- Limit per month based on plan
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    reset_date TIMESTAMPTZ DEFAULT date_trunc('month', (now() + interval '1 month')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, feature_type)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_reddit_features_usage_user_feature ON reddit_features_usage(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_reddit_features_usage_reset_date ON reddit_features_usage(reset_date);

-- Insert default Reddit feature limits for all users
-- Free users: 10 pain points views, 2 AI ideas from pain points per month
-- Premium users: unlimited pain points, unlimited AI ideas
INSERT INTO reddit_features_usage (user_id, feature_type, usage_count, monthly_limit)
SELECT
    u.id,
    'pain_points_viewed',
    0,
    CASE
        WHEN u.plan_type = 'explorer' THEN 10
        WHEN u.plan_type IN ('premium', 'founder', 'growth') THEN 999
        ELSE 10
    END
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM reddit_features_usage rfu
    WHERE rfu.user_id = u.id AND rfu.feature_type = 'pain_points_viewed'
)
UNION ALL
SELECT
    u.id,
    'ideas_from_pain_points',
    0,
    CASE
        WHEN u.plan_type = 'explorer' THEN 2
        WHEN u.plan_type IN ('premium', 'founder', 'growth') THEN 999
        ELSE 2
    END
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM reddit_features_usage rfu
    WHERE rfu.user_id = u.id AND rfu.feature_type = 'ideas_from_pain_points'
);

-- Create function to reset Reddit features usage monthly
CREATE OR REPLACE FUNCTION reset_reddit_features_usage()
RETURNS void AS $$
BEGIN
    UPDATE reddit_features_usage
    SET
        usage_count = 0,
        reset_date = date_trunc('month', (now() + interval '1 month')),
        updated_at = NOW()
    WHERE reset_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to check Reddit feature usage limits
CREATE OR REPLACE FUNCTION check_reddit_feature_limit(
    p_user_id UUID,
    p_feature_type TEXT
) RETURNS TABLE (
    can_use BOOLEAN,
    current_usage INTEGER,
    monthly_limit INTEGER,
    remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (rfu.usage_count < rfu.monthly_limit) as can_use,
        rfu.usage_count as current_usage,
        rfu.monthly_limit,
        (rfu.monthly_limit - rfu.usage_count) as remaining
    FROM reddit_features_usage rfu
    WHERE rfu.user_id = p_user_id
    AND rfu.feature_type = p_feature_type;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment Reddit feature usage
CREATE OR REPLACE FUNCTION increment_reddit_feature_usage(
    p_user_id UUID,
    p_feature_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    limit_count INTEGER;
BEGIN
    -- Get current usage and limit
    SELECT usage_count, monthly_limit INTO current_count, limit_count
    FROM reddit_features_usage
    WHERE user_id = p_user_id AND feature_type = p_feature_type;

    -- Check if we can increment (within limit)
    IF current_count < limit_count THEN
        UPDATE reddit_features_usage
        SET
            usage_count = usage_count + 1,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id AND feature_type = p_feature_type;

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on the new table
ALTER TABLE reddit_features_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reddit_features_usage
CREATE POLICY "Users can view own Reddit feature usage" ON reddit_features_usage
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own Reddit feature usage" ON reddit_features_usage
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Service role can manage all Reddit feature usage
CREATE POLICY "Service can manage Reddit feature usage" ON reddit_features_usage
    FOR ALL TO service_role
    USING (true);

-- Comments for documentation
COMMENT ON TABLE reddit_features_usage IS 'Track usage of Reddit-powered features for premium gating';
COMMENT ON COLUMN reddit_features_usage.feature_type IS 'Type of Reddit feature: pain_points_viewed, ideas_from_pain_points, trend_alerts, etc.';
COMMENT ON COLUMN reddit_features_usage.monthly_limit IS 'Monthly usage limit based on user plan (999 = unlimited for premium users)';

-- Create a view for easy Reddit feature usage checking
CREATE OR REPLACE VIEW user_reddit_limits AS
SELECT
    u.id as user_id,
    u.plan_type,
    rfu.feature_type,
    rfu.usage_count,
    rfu.monthly_limit,
    (rfu.monthly_limit - rfu.usage_count) as remaining,
    (rfu.usage_count < rfu.monthly_limit) as can_use,
    rfu.reset_date,
    rfu.last_used_at
FROM users u
LEFT JOIN reddit_features_usage rfu ON u.id = rfu.user_id
ORDER BY u.id, rfu.feature_type;