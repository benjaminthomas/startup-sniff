-- Create rate limits table for authentication security
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_created_at 
ON rate_limits (identifier, created_at);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only
CREATE POLICY rate_limits_service_role_policy ON rate_limits
FOR ALL
USING (auth.role() = 'service_role');