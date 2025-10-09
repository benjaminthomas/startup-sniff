-- Migration: Update Plan Types from explorer/founder/growth to free/pro_monthly/pro_yearly
-- Date: 2024-10-09
-- Description: Standardize plan types to use free, pro_monthly, and pro_yearly

-- Step 1: Create new enum type with the updated plan types
CREATE TYPE plan_type_new AS ENUM ('free', 'pro_monthly', 'pro_yearly');

-- Step 2: Add temporary columns with new enum type
ALTER TABLE users ADD COLUMN plan_type_new plan_type_new;
ALTER TABLE subscriptions ADD COLUMN plan_type_new plan_type_new;
ALTER TABLE usage_limits ADD COLUMN plan_type_new plan_type_new;

-- Step 3: Migrate existing data
-- Map explorer -> free
-- Map founder -> pro_monthly  
-- Map growth -> pro_yearly
UPDATE users 
SET plan_type_new = CASE 
    WHEN plan_type = 'explorer' THEN 'free'::plan_type_new
    WHEN plan_type = 'founder' THEN 'pro_monthly'::plan_type_new
    WHEN plan_type = 'growth' THEN 'pro_yearly'::plan_type_new
    ELSE 'free'::plan_type_new
END;

UPDATE subscriptions 
SET plan_type_new = CASE 
    WHEN plan_type = 'explorer' THEN 'free'::plan_type_new
    WHEN plan_type = 'founder' THEN 'pro_monthly'::plan_type_new
    WHEN plan_type = 'growth' THEN 'pro_yearly'::plan_type_new
    ELSE 'free'::plan_type_new
END;

UPDATE usage_limits 
SET plan_type_new = CASE 
    WHEN plan_type = 'explorer' THEN 'free'::plan_type_new
    WHEN plan_type = 'founder' THEN 'pro_monthly'::plan_type_new
    WHEN plan_type = 'growth' THEN 'pro_yearly'::plan_type_new
    ELSE 'free'::plan_type_new
END;

-- Step 4: Drop old columns and constraints
ALTER TABLE users DROP COLUMN plan_type;
ALTER TABLE subscriptions DROP COLUMN plan_type;
ALTER TABLE usage_limits DROP COLUMN plan_type;

-- Step 5: Rename new columns to original names
ALTER TABLE users RENAME COLUMN plan_type_new TO plan_type;
ALTER TABLE subscriptions RENAME COLUMN plan_type_new TO plan_type;
ALTER TABLE usage_limits RENAME COLUMN plan_type_new TO plan_type;

-- Step 6: Drop old enum type
DROP TYPE plan_type;

-- Step 7: Rename new enum type to original name
ALTER TYPE plan_type_new RENAME TO plan_type;

-- Step 8: Set default values for new users
ALTER TABLE users ALTER COLUMN plan_type SET DEFAULT 'free';

-- Step 9: Update any NULL values to free plan
UPDATE users SET plan_type = 'free' WHERE plan_type IS NULL;
UPDATE usage_limits SET plan_type = 'free' WHERE plan_type IS NULL;

-- Step 10: Add NOT NULL constraints
ALTER TABLE users ALTER COLUMN plan_type SET NOT NULL;
ALTER TABLE usage_limits ALTER COLUMN plan_type SET NOT NULL;

-- Step 11: Update usage limits for free plan users
-- Set appropriate limits for free plan (only updating existing columns)
UPDATE usage_limits 
SET 
    monthly_limit_ideas = 3,
    monthly_limit_validations = 1
WHERE plan_type = 'free';

-- Step 12: Set unlimited for pro users (using -1 to indicate unlimited)
UPDATE usage_limits 
SET 
    monthly_limit_ideas = -1,
    monthly_limit_validations = -1
WHERE plan_type IN ('pro_monthly', 'pro_yearly');

-- Step 13: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_usage_limits_plan_type ON usage_limits(plan_type);

-- Step 14: Add check constraints for data integrity
ALTER TABLE users ADD CONSTRAINT check_valid_plan_type 
    CHECK (plan_type IN ('free', 'pro_monthly', 'pro_yearly'));

-- Step 15: Create or update RLS policies if needed
-- Enable RLS on tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Step 16: Insert default usage limits for any users without them
INSERT INTO usage_limits (
    user_id, 
    plan_type, 
    monthly_limit_ideas, 
    monthly_limit_validations,
    ideas_generated, 
    validations_completed,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.plan_type,
    CASE 
        WHEN u.plan_type = 'free' THEN 3
        ELSE -1
    END,
    CASE 
        WHEN u.plan_type = 'free' THEN 1
        ELSE -1
    END,
    0,
    0,
    NOW(),
    NOW()
FROM users u
WHERE u.id NOT IN (SELECT user_id FROM usage_limits);

-- Step 17: Verification queries (commented out - uncomment to run separately)
/*
-- Verify the migration
SELECT plan_type, COUNT(*) as user_count FROM users GROUP BY plan_type;
SELECT plan_type, COUNT(*) as subscription_count FROM subscriptions GROUP BY plan_type;
SELECT plan_type, COUNT(*) as usage_limit_count FROM usage_limits GROUP BY plan_type;

-- Check for any NULL values
SELECT 'users' as table_name, COUNT(*) as null_count FROM users WHERE plan_type IS NULL
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE plan_type IS NULL
UNION ALL
SELECT 'usage_limits', COUNT(*) FROM usage_limits WHERE plan_type IS NULL;

-- Sample data check
SELECT u.email, u.plan_type, ul.monthly_limit_ideas, ul.monthly_limit_validations
FROM users u
LEFT JOIN usage_limits ul ON u.id = ul.user_id
LIMIT 10;
*/