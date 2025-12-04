-- ============================================================================
-- Migration: Add Invoice Fields to Payment Transactions
-- ============================================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tesprtjhcwwqkmmoxzna/sql
-- ============================================================================

-- Add invoice tracking fields to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS razorpay_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id
ON payment_transactions(razorpay_invoice_id);

-- Add comments for documentation
COMMENT ON COLUMN payment_transactions.razorpay_invoice_id
IS 'Razorpay invoice ID for downloading receipts';

COMMENT ON COLUMN payment_transactions.razorpay_invoice_url
IS 'Short URL for downloading invoice PDF from Razorpay';

COMMENT ON COLUMN payment_transactions.invoice_generated_at
IS 'Timestamp when invoice was generated or fetched';

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'payment_transactions'
    AND column_name IN ('razorpay_invoice_id', 'razorpay_invoice_url', 'invoice_generated_at')
ORDER BY
    column_name;

-- If you see 3 rows returned, the migration was successful!
