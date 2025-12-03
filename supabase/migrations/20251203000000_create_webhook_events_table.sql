/**
 * Migration: Create Webhook Events Table
 * Day 2 Security Improvements: Webhook Idempotency
 *
 * This table stores all incoming Razorpay webhook events to:
 * 1. Prevent duplicate processing (idempotency)
 * 2. Enable webhook replay for failed events
 * 3. Provide audit trail for billing events
 */

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Razorpay event identification (for idempotency)
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,

  -- Full webhook payload for replay/debugging
  payload JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick idempotency checks
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
ON webhook_events(event_id);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
ON webhook_events(event_type);

-- Index for finding unprocessed events
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
ON webhook_events(processed, created_at)
WHERE processed = false;

-- Index for querying recent events
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
ON webhook_events(created_at DESC);

-- Function to mark event as processed
CREATE OR REPLACE FUNCTION mark_webhook_event_processed(
  p_event_id TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE webhook_events
  SET
    processed = (p_error_message IS NULL),
    processed_at = NOW(),
    error_message = p_error_message,
    retry_count = CASE
      WHEN p_error_message IS NOT NULL THEN retry_count + 1
      ELSE retry_count
    END,
    updated_at = NOW()
  WHERE event_id = p_event_id;
END;
$$;

-- Grant permissions (service role only for security)
GRANT SELECT, INSERT, UPDATE ON webhook_events TO service_role;
GRANT EXECUTE ON FUNCTION mark_webhook_event_processed TO service_role;

-- Add comments
COMMENT ON TABLE webhook_events IS 'Stores Razorpay webhook events for idempotency and audit trail';
COMMENT ON COLUMN webhook_events.event_id IS 'Razorpay event ID - used for idempotency checks';
COMMENT ON COLUMN webhook_events.processed IS 'Whether the event was successfully processed';
COMMENT ON FUNCTION mark_webhook_event_processed IS 'Marks a webhook event as processed or failed';
