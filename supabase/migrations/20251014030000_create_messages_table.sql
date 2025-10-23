-- Epic 2, Story 2.3 & 2.5: AI Message Templates & Message Sending
-- Table to store generated templates and sent messages

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pain_point_id UUID NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES reddit_contacts(id) ON DELETE CASCADE,
  reddit_username TEXT NOT NULL,

  -- Template generation
  template_variant TEXT NOT NULL CHECK (template_variant IN ('professional', 'casual', 'concise', 'value_first')),
  message_text TEXT NOT NULL,

  -- Sending status
  send_status TEXT NOT NULL DEFAULT 'draft' CHECK (send_status IN ('draft', 'pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- Outcome tracking (manual logging by user)
  outcome TEXT CHECK (outcome IN ('sent', 'replied', 'call_scheduled', 'customer_acquired', 'dead_end')),
  replied_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_sent_at ON messages(user_id, sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_send_status ON messages(send_status);
CREATE INDEX IF NOT EXISTS idx_messages_outcome ON messages(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_template_variant ON messages(template_variant);

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Stores AI-generated message templates and sent message tracking';
COMMENT ON COLUMN messages.template_variant IS 'Template style: professional, casual, concise, or value_first';
COMMENT ON COLUMN messages.send_status IS 'Message status: draft (generated), pending (queued), sent, or failed';
COMMENT ON COLUMN messages.outcome IS 'User-logged outcome: replied, call_scheduled, customer_acquired, or dead_end';
