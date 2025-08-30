-- Create security_events table for comprehensive authentication logging
CREATE TABLE public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 
        'login_failure', 
        'signup', 
        'password_reset_request',
        'password_reset_success', 
        'logout', 
        'session_expired', 
        'suspicious_activity',
        'csrf_violation', 
        'rate_limit_exceeded', 
        'account_lockout'
    )),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 1 CHECK (risk_score >= 1 AND risk_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_security_events_email ON public.security_events(email);
CREATE INDEX idx_security_events_ip_address ON public.security_events(ip_address);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX idx_security_events_risk_score ON public.security_events(risk_score);

-- Composite index for suspicious activity detection
CREATE INDEX idx_security_events_suspicious_lookup 
ON public.security_events(event_type, ip_address, created_at) 
WHERE event_type = 'login_failure';

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only (security events should only be written by system)
CREATE POLICY "Service role can manage security events" 
ON public.security_events 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policy for authenticated users to view their own events (optional, for admin dashboards)
CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.security_events IS 'Comprehensive logging table for all authentication and security events';
COMMENT ON COLUMN public.security_events.event_type IS 'Type of security event that occurred';
COMMENT ON COLUMN public.security_events.user_id IS 'User ID if applicable (can be null for failed login attempts)';
COMMENT ON COLUMN public.security_events.email IS 'Email address associated with the event';
COMMENT ON COLUMN public.security_events.ip_address IS 'IP address of the client';
COMMENT ON COLUMN public.security_events.user_agent IS 'User agent string from the client';
COMMENT ON COLUMN public.security_events.metadata IS 'Additional event-specific data in JSON format';
COMMENT ON COLUMN public.security_events.risk_score IS 'Risk assessment score from 1 (low) to 10 (high)';