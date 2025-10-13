-- Migration: Rename Stripe legacy fields to Razorpay
-- Date: 2025-10-13
-- Author: Benjamin
-- Description: The application uses Razorpay for payments, not Stripe. This migration
--              renames the legacy Stripe field names to reflect the actual payment provider.

-- Rename users table field
ALTER TABLE public.users
  RENAME COLUMN stripe_customer_id TO razorpay_customer_id;

-- Rename subscriptions table fields
ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_price_id TO razorpay_plan_id;

-- Update comments for clarity
COMMENT ON COLUMN public.users.razorpay_customer_id IS 'Razorpay customer ID for subscription management';
COMMENT ON COLUMN public.subscriptions.razorpay_subscription_id IS 'Razorpay subscription ID';
COMMENT ON COLUMN public.subscriptions.razorpay_plan_id IS 'Razorpay plan/price ID';

-- Note: Indexes will automatically be renamed by PostgreSQL to match the new column names
