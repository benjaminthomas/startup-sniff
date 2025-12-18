-- Align usage_limits table with updated pricing constants
-- Migration: 20250118000000_align_usage_limits_with_pricing
-- Purpose: Add content generation tracking and align limits with code constants

-- Step 1: Add content generation columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usage_limits' AND column_name = 'content_generated') THEN
        ALTER TABLE public.usage_limits
        ADD COLUMN content_generated INTEGER DEFAULT 0 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usage_limits' AND column_name = 'monthly_limit_content') THEN
        ALTER TABLE public.usage_limits
        ADD COLUMN monthly_limit_content INTEGER NOT NULL DEFAULT 2;
    END IF;
END $$;

-- Step 2: Update limits for free plan users
-- Free plan: 3 ideas, 1 validation, 2 content per month
UPDATE public.usage_limits
SET
    monthly_limit_ideas = 3,
    monthly_limit_validations = 1,
    monthly_limit_content = 2
WHERE plan_type = 'free';

-- Step 3: Update limits for pro_monthly plan users
-- Pro plans: unlimited (represented as -1 in code, but using 999 in database for compatibility)
UPDATE public.usage_limits
SET
    monthly_limit_ideas = 999,
    monthly_limit_validations = 999,
    monthly_limit_content = 999
WHERE plan_type = 'pro_monthly';

-- Step 4: Update limits for pro_yearly plan users
UPDATE public.usage_limits
SET
    monthly_limit_ideas = 999,
    monthly_limit_validations = 999,
    monthly_limit_content = 999
WHERE plan_type = 'pro_yearly';

-- Step 5: Update limits for any legacy plan types (explorer, premium, founder, growth)
-- Explorer (legacy free) -> same as free
UPDATE public.usage_limits
SET
    monthly_limit_ideas = 3,
    monthly_limit_validations = 1,
    monthly_limit_content = 2
WHERE plan_type IN ('explorer');

-- Premium, founder, growth (legacy paid) -> unlimited like pro
UPDATE public.usage_limits
SET
    monthly_limit_ideas = 999,
    monthly_limit_validations = 999,
    monthly_limit_content = 999
WHERE plan_type IN ('premium', 'founder', 'growth');

-- Step 6: Update handle_new_user function to include content limits
CREATE OR REPLACE FUNCTION public.handle_new_user_with_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user if not exists (some auth systems may call this twice)
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default usage limits for free plan with content generation support
    INSERT INTO public.usage_limits (
        user_id,
        plan_type,
        monthly_limit_ideas,
        monthly_limit_validations,
        monthly_limit_content
    )
    VALUES (NEW.id, 'free', 3, 1, 2)
    ON CONFLICT (user_id, plan_type) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update the trigger to use new function (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_content();

-- Comments for documentation
COMMENT ON COLUMN public.usage_limits.content_generated IS 'Number of content pieces generated this month (blog posts, tweets, emails, landing pages)';
COMMENT ON COLUMN public.usage_limits.monthly_limit_content IS 'Monthly limit for content generation based on user plan (999 = unlimited for pro users)';

-- Migration summary:
-- ✅ Added content_generated and monthly_limit_content columns
-- ✅ Updated free plan limits: 3 ideas, 1 validation, 2 content
-- ✅ Updated pro plan limits: 999 (unlimited) for all metrics
-- ✅ Updated legacy plan types to match new limits
-- ✅ Updated new user creation function to include content limits
-- ✅ Migration is idempotent and safe to run multiple times
