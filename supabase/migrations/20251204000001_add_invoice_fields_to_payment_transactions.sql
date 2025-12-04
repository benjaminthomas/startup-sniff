/**
 * Migration: Add Invoice Fields to Payment Transactions
 * Feature: Billing Invoice Downloads
 *
 * Adds fields to track Razorpay invoices for each payment transaction
 * Enables invoice download functionality in billing history
 */

-- Add invoice tracking fields to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN razorpay_invoice_id TEXT,
ADD COLUMN razorpay_invoice_url TEXT,
ADD COLUMN invoice_generated_at TIMESTAMPTZ;

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
