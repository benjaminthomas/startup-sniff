-- Clear Test Data Script for StartupSniff
-- This script clears all user-generated content while preserving the user account and plan structure
-- 
-- HOW TO RUN THIS SCRIPT:
-- Option 1: supabase db reset (clears everything and reapplies migrations)
-- Option 2: Run individual SQL commands in Supabase Studio SQL editor
-- Option 3: psql -h localhost -p 54322 -U postgres -d postgres -f clear-test-data.sql

-- =======================================================
-- STEP 1: Clear all startup ideas for the test user
-- =======================================================
DELETE FROM startup_ideas 
WHERE user_id = (
    SELECT id FROM users WHERE email = 'benji_thomas@live.com'
);

-- =======================================================  
-- STEP 2: Reset usage limits to zero
-- =======================================================
UPDATE usage_limits 
SET 
    ideas_generated = 0,
    validations_completed = 0,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE email = 'benji_thomas@live.com'
);

-- =======================================================
-- STEP 3: Clear security events (optional - for clean logs)
-- =======================================================
DELETE FROM security_events 
WHERE user_id = (
    SELECT id FROM users WHERE email = 'benji_thomas@live.com'
);

-- =======================================================
-- STEP 4: Verify the cleanup was successful
-- =======================================================
SELECT 
    '=== CLEANUP VERIFICATION ===' as status,
    u.email,
    u.plan_type,
    ul.ideas_generated as stored_ideas,
    ul.validations_completed as stored_validations,
    ul.monthly_limit_ideas as idea_limit,
    ul.monthly_limit_validations as validation_limit,
    (SELECT COUNT(*) FROM startup_ideas si WHERE si.user_id = u.id) as actual_ideas_count,
    (SELECT COUNT(*) FROM startup_ideas si WHERE si.user_id = u.id AND si.is_validated = true) as actual_validated_count
FROM users u
LEFT JOIN usage_limits ul ON u.id = ul.user_id
WHERE u.email = 'benji_thomas@live.com';

-- =======================================================
-- INDIVIDUAL COMMANDS (if you prefer to run one by one):
-- =======================================================
/*

-- 1. Delete ideas:
DELETE FROM startup_ideas WHERE user_id = (SELECT id FROM users WHERE email = 'benji_thomas@live.com');

-- 2. Reset usage:
UPDATE usage_limits SET ideas_generated = 0, validations_completed = 0, updated_at = NOW() WHERE user_id = (SELECT id FROM users WHERE email = 'benji_thomas@live.com');

-- 3. Clear events:
DELETE FROM security_events WHERE user_id = (SELECT id FROM users WHERE email = 'benji_thomas@live.com');

-- 4. Verify:
SELECT u.email, u.plan_type, ul.ideas_generated, ul.validations_completed, (SELECT COUNT(*) FROM startup_ideas si WHERE si.user_id = u.id) as ideas FROM users u LEFT JOIN usage_limits ul ON u.id = ul.user_id WHERE u.email = 'benji_thomas@live.com';

*/

-- =======================================================
-- EXPECTED RESULTS AFTER CLEANUP:
-- =======================================================
-- email: benji_thomas@live.com
-- plan_type: explorer  
-- stored_ideas: 0
-- stored_validations: 0
-- idea_limit: 3
-- validation_limit: 1
-- actual_ideas_count: 0
-- actual_validated_count: 0
-- 
-- This gives you a clean slate to test:
-- 1. Generate ideas (up to 3 for Explorer plan)
-- 2. Validate ideas (up to 1 for Explorer plan) 
-- 3. Test upgrade prompts when limits are reached
-- =======================================================