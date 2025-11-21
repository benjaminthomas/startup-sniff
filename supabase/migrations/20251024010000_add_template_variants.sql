/**
 * Migration: Add Template Variant Analytics
 * Story 2.10: Template A/B Testing and Optimization
 *
 * Adds analytics infrastructure for A/B testing of message templates.
 * Note: Both template_variant and replied_at columns already exist in messages table.
 * This migration adds performance tracking and statistical analysis capabilities.
 */

-- Create template_variants table for variant definitions and performance tracking
CREATE TABLE IF NOT EXISTS template_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_name TEXT NOT NULL UNIQUE,
  variant_label TEXT NOT NULL,
  description TEXT,
  prompt_style TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Performance metrics (cached for quick access)
  total_sent INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.0,

  -- Statistical significance
  is_statistically_significant BOOLEAN DEFAULT false,
  confidence_level DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_calculated_at TIMESTAMPTZ
);

-- Insert default template variants
INSERT INTO template_variants (variant_name, variant_label, description, prompt_style, is_default) VALUES
  ('professional', 'Professional', 'Formal, business-focused tone with clear value proposition', 'professional', true),
  ('casual', 'Casual', 'Friendly, conversational tone that builds rapport', 'casual', false),
  ('concise', 'Concise', 'Brief, direct message that respects their time', 'concise', false),
  ('value_first', 'Value-First', 'Leads with specific value or insight for recipient', 'value_first', false)
ON CONFLICT (variant_name) DO NOTHING;

-- Create index for performance queries on messages table
CREATE INDEX IF NOT EXISTS idx_messages_replied_at
ON messages(replied_at) WHERE replied_at IS NOT NULL;

-- Create view for variant performance analytics
CREATE OR REPLACE VIEW template_variant_performance AS
SELECT
  tm.variant_name,
  tm.variant_label,
  COUNT(m.id) as total_sent,
  COUNT(m.replied_at) as total_responded,
  CASE
    WHEN COUNT(m.id) > 0
    THEN ROUND((COUNT(m.replied_at)::DECIMAL / COUNT(m.id)::DECIMAL) * 100, 2)
    ELSE 0
  END as response_rate,
  COUNT(CASE WHEN m.outcome = 'call_scheduled' THEN 1 END) as calls_scheduled,
  COUNT(CASE WHEN m.outcome = 'customer_acquired' THEN 1 END) as customers_acquired,
  MIN(m.created_at) as first_sent_at,
  MAX(m.created_at) as last_sent_at,
  tm.is_statistically_significant,
  tm.confidence_level
FROM template_variants tm
LEFT JOIN messages m ON m.template_variant = tm.variant_name AND m.send_status = 'sent'
WHERE tm.is_active = true
GROUP BY tm.variant_name, tm.variant_label, tm.is_statistically_significant, tm.confidence_level
ORDER BY response_rate DESC;

-- Function to update variant performance metrics
CREATE OR REPLACE FUNCTION update_template_variant_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update cached metrics for each variant
  UPDATE template_variants tv
  SET
    total_sent = subq.total_sent,
    total_responded = subq.total_responded,
    response_rate = subq.response_rate,
    last_calculated_at = NOW(),
    updated_at = NOW()
  FROM (
    SELECT
      template_variant,
      COUNT(*) as total_sent,
      COUNT(replied_at) as total_responded,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(replied_at)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
        ELSE 0
      END as response_rate
    FROM messages
    WHERE template_variant IS NOT NULL AND send_status = 'sent'
    GROUP BY template_variant
  ) subq
  WHERE tv.variant_name = subq.template_variant;

  -- Calculate statistical significance for variants with sufficient data
  -- Using Chi-square test approximation: need at least 50 samples
  UPDATE template_variants
  SET
    is_statistically_significant = (
      total_sent >= 50 AND
      ABS(response_rate - (SELECT AVG(response_rate) FROM template_variants WHERE total_sent >= 50)) > 5.0
    ),
    confidence_level = CASE
      WHEN total_sent >= 100 THEN 95.0
      WHEN total_sent >= 50 THEN 90.0
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE total_sent > 0;
END;
$$;

-- Trigger to update replied_at when outcome changes to replied/call_scheduled/customer_acquired
CREATE OR REPLACE FUNCTION update_message_replied_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set replied_at when outcome indicates a response
  IF NEW.outcome IN ('replied', 'call_scheduled', 'customer_acquired') AND OLD.replied_at IS NULL THEN
    NEW.replied_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_message_replied_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_replied_at();

-- Grant permissions
GRANT SELECT ON template_variants TO authenticated;
GRANT SELECT ON template_variant_performance TO authenticated;

-- Add comment
COMMENT ON TABLE template_variants IS 'Template variant definitions and performance metrics for A/B testing';
COMMENT ON VIEW template_variant_performance IS 'Real-time performance analytics for template variants';
COMMENT ON FUNCTION update_template_variant_metrics() IS 'Updates cached performance metrics and statistical significance for template variants';
