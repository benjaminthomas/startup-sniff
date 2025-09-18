-- ===============================================
-- CLEANUP SCRIPT FOR TESTING REDDIT INTEGRATION
-- ===============================================
-- This script resets all generated data while preserving users
-- Run this to test the new Reddit-powered idea generation system

-- 1. Delete generated content (blog posts, tweets, etc.)
DELETE FROM generated_content;
SELECT 'Deleted generated content' AS step_completed;

-- 2. Delete startup ideas (the main test subject)
DELETE FROM startup_ideas;
SELECT 'Deleted startup ideas' AS step_completed;

-- 3. Delete subscriptions data (reset billing)
DELETE FROM subscriptions;
SELECT 'Deleted subscriptions' AS step_completed;

-- 4. Reset usage limits for all users (allow fresh testing)
UPDATE usage_limits
SET
    ideas_generated = 0,
    validations_completed = 0,
    reset_date = date_trunc('month', (now() + interval '1 month')),
    updated_at = now();
SELECT 'Reset usage limits' AS step_completed;

-- 5. Optional: Delete Reddit features usage table if it exists
-- (This table might not exist yet if migration wasn't applied)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reddit_features_usage') THEN
        DELETE FROM reddit_features_usage;
        RAISE NOTICE 'Deleted Reddit features usage data';
    ELSE
        RAISE NOTICE 'Reddit features usage table does not exist yet';
    END IF;
END $$;

-- 6. Keep Reddit posts data (we need this for testing pain point extraction)
-- DO NOT DELETE reddit_posts - we need this data for pain point analysis
SELECT 'Keeping Reddit posts for pain point analysis (' || COUNT(*) || ' posts)' AS reddit_data_status
FROM reddit_posts;

-- 7. Reset user plan types for testing (optional)
-- Uncomment these lines if you want to test different plan scenarios
-- UPDATE users SET plan_type = 'explorer' WHERE plan_type != 'explorer';
-- SELECT 'Reset all users to explorer plan for testing' AS plan_reset_status;

-- 8. Summary of what remains
SELECT
    'CLEANUP SUMMARY' AS summary_title,
    (SELECT COUNT(*) FROM users) AS users_kept,
    (SELECT COUNT(*) FROM reddit_posts) AS reddit_posts_kept,
    (SELECT COUNT(*) FROM startup_ideas) AS ideas_deleted,
    (SELECT COUNT(*) FROM generated_content) AS content_deleted,
    (SELECT COUNT(*) FROM subscriptions) AS subscriptions_deleted;

-- 9. Show current usage limits after reset
SELECT
    u.email,
    u.plan_type,
    ul.ideas_generated,
    ul.monthly_limit_ideas,
    ul.validations_completed,
    ul.monthly_limit_validations,
    ul.reset_date
FROM users u
LEFT JOIN usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at;

-- 10. Verify Reddit data is available for testing
SELECT
    'REDDIT DATA STATUS' AS data_status,
    subreddit,
    COUNT(*) AS post_count,
    MAX(created_utc) AS latest_post,
    AVG(score) AS avg_score
FROM reddit_posts
GROUP BY subreddit
ORDER BY post_count DESC;

SELECT '✅ Cleanup completed! Ready to test Reddit-powered idea generation!' AS final_status;