-- Phase 1 Security Migration: Add User Roles
-- Date: 2025-12-09
-- This migration adds role-based access control

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Step 2: Create index for role lookups (performance)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 3: Add constraint to ensure only valid roles
ALTER TABLE users ADD CONSTRAINT valid_user_role
  CHECK (role IN ('user', 'admin'));

-- Step 4: Update existing users to have 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 5: Set admin user
UPDATE users SET role = 'admin' WHERE email = 'benji_thomas@live.com';

-- Step 6: Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: user or admin';

-- Verify the migration
-- SELECT id, email, role FROM users WHERE role = 'admin';
