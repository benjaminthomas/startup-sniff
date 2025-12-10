-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add constraint to ensure only valid roles
ALTER TABLE users ADD CONSTRAINT valid_user_role
  CHECK (role IN ('user', 'admin'));

-- Update existing users to have 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Optional: Set first user as admin (adjust email as needed)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';

-- Add comment
COMMENT ON COLUMN users.role IS 'User role: user or admin';
