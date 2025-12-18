/**
 * Security Fix: Enable RLS on webhook_events
 *
 * The webhook_events table should only be accessible by service role
 * for webhook processing. This migration enables RLS to prevent
 * unauthorized access from client applications.
 */

-- Enable RLS on webhook_events table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies needed - service role bypasses RLS automatically
-- This effectively makes the table service-role-only

-- Update permissions (explicit deny for authenticated/anon)
REVOKE ALL ON webhook_events FROM authenticated;
REVOKE ALL ON webhook_events FROM anon;

-- Confirm service role still has access
GRANT SELECT, INSERT, UPDATE ON webhook_events TO service_role;

COMMENT ON TABLE webhook_events IS 'Webhook events table - service role only, RLS enabled for security';
