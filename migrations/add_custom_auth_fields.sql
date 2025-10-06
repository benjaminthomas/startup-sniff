-- Migration: Add custom authentication fields to users table
-- This replaces Supabase Auth with custom authentication

-- Add password and email verification fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create a sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Create indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create a rate limiting table for auth attempts
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP address or email
    endpoint VARCHAR(100) NOT NULL,   -- signin, signup, forgot-password
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint)
);

-- Create indexes for rate limiting table
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier_endpoint ON auth_rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON auth_rate_limits(blocked_until);

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up expired email verification tokens
    UPDATE users
    SET email_verification_token = NULL,
        email_verification_expires_at = NULL
    WHERE email_verification_expires_at < NOW();

    -- Clean up expired password reset tokens
    UPDATE users
    SET password_reset_token = NULL,
        password_reset_expires_at = NULL
    WHERE password_reset_expires_at < NOW();

    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();

    -- Clean up old rate limiting records (older than 24 hours)
    DELETE FROM auth_rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';

    -- Reset login attempts for users whose lockout has expired
    UPDATE users
    SET login_attempts = 0,
        locked_until = NULL
    WHERE locked_until < NOW();
END;
$$;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-auth-data', '0 */6 * * *', 'SELECT cleanup_expired_auth_data()');

-- Add updated_at trigger for user_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints and validations
ALTER TABLE users
ADD CONSTRAINT chk_login_attempts CHECK (login_attempts >= 0);

-- Ensure email is unique and lowercase
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(LOWER(email));

-- Add comments for documentation
COMMENT ON COLUMN users.password_hash IS 'Argon2id hash of user password';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification (expires in 1 hour)';
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset (expires in 10 minutes)';
COMMENT ON COLUMN users.login_attempts IS 'Number of failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp due to failed attempts';

COMMENT ON TABLE user_sessions IS 'Active user sessions for JWT token management';
COMMENT ON TABLE auth_rate_limits IS 'Rate limiting data for authentication endpoints';