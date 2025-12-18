/**
 * Migration: Create Payment Transactions Table
 * Day 2 Security Improvements: Payment Tracking and Verification
 *
 * This table stores payment transaction details for:
 * 1. Payment verification logging
 * 2. Billing history display
 * 3. Financial audit trail
 * 4. Reconciliation with Razorpay
 */

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and subscription linkage
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,

  -- Payment details
  amount INTEGER NOT NULL DEFAULT 0, -- Amount in paise (INR)
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- verified, captured, failed, refunded
  payment_method TEXT, -- card, netbanking, upi, wallet

  -- Verification
  verified_at TIMESTAMPTZ,
  signature_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_at TIMESTAMPTZ,

  -- Additional metadata
  notes JSONB,
  error_message TEXT
);

-- Index for user lookups (billing history)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
ON payment_transactions(user_id, created_at DESC);

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id
ON payment_transactions(razorpay_subscription_id);

-- Index for payment ID lookups (verification)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id
ON payment_transactions(razorpay_payment_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
ON payment_transactions(status, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transaction_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_payment_transaction_timestamp
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_transaction_timestamp();

-- Grant permissions
GRANT SELECT ON payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_transactions TO service_role;

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment transactions
CREATE POLICY "Users can view their own payment transactions"
ON payment_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE payment_transactions IS 'Payment transaction records for billing history and audit trail';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount in paise (INR smallest unit)';
COMMENT ON COLUMN payment_transactions.status IS 'Payment status: verified, captured, failed, refunded';
