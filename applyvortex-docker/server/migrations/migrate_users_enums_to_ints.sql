-- Migration: Migrate Users Enums to Integers
-- Date: 2026-01-01
-- Description: Convert oauth_provider, account_status, and role from Enum types to SmallInteger

BEGIN;

-- 1. Create temporary integer columns
ALTER TABLE users ADD COLUMN oauth_provider_new SMALLINT;
ALTER TABLE users ADD COLUMN account_status_new SMALLINT DEFAULT 0;
ALTER TABLE users ADD COLUMN role_new SMALLINT DEFAULT 1;

-- 2. Migrate Data using case-insensitive comparison
-- OAuthProvider (GOOGLE=1, GITHUB=2, LINKEDIN=3, MICROSOFT=4)
UPDATE users SET oauth_provider_new = 1 WHERE LOWER(oauth_provider::text) = 'google';
UPDATE users SET oauth_provider_new = 2 WHERE LOWER(oauth_provider::text) = 'github';
UPDATE users SET oauth_provider_new = 3 WHERE LOWER(oauth_provider::text) = 'linkedin';
UPDATE users SET oauth_provider_new = 4 WHERE LOWER(oauth_provider::text) = 'microsoft';

-- AccountStatus (PENDING=0, ACTIVE=1, INACTIVE=2, SUSPENDED=3, DELETED=4)
UPDATE users SET account_status_new = 0 WHERE LOWER(account_status::text) = 'pending';
UPDATE users SET account_status_new = 1 WHERE LOWER(account_status::text) = 'active';
UPDATE users SET account_status_new = 2 WHERE LOWER(account_status::text) = 'inactive';
UPDATE users SET account_status_new = 3 WHERE LOWER(account_status::text) = 'suspended';
UPDATE users SET account_status_new = 4 WHERE LOWER(account_status::text) = 'deleted';

-- Role (USER=1, ADMIN=2, SUPER_ADMIN=3)
UPDATE users SET role_new = 1 WHERE LOWER(role::text) = 'user';
UPDATE users SET role_new = 2 WHERE LOWER(role::text) = 'admin';
UPDATE users SET role_new = 3 WHERE LOWER(role::text) = 'super_admin';

-- 3. Drop old columns (Indexes will be dropped automatically)
ALTER TABLE users DROP COLUMN oauth_provider;
ALTER TABLE users DROP COLUMN account_status;
ALTER TABLE users DROP COLUMN role;

-- 4. Rename new columns
ALTER TABLE users RENAME COLUMN oauth_provider_new TO oauth_provider;
ALTER TABLE users RENAME COLUMN account_status_new TO account_status;
ALTER TABLE users RENAME COLUMN role_new TO role;

-- 5. Set Constraints and Defaults
ALTER TABLE users ALTER COLUMN account_status SET NOT NULL;
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 0;

ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 1;

-- 6. Recreate Indexes
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 7. Drop old Enum types (CASCADE to handle potential dependencies, though usually used in columns)
-- Use with caution, but here we know we removed usage in users table.
-- If other tables use these enums (e.g. Activity logs), those will break if we DROP TYPE.
-- Better to leave types for now to avoid side effects on other tables I might not know about.
-- But the goal is unrelated to types existence, just column types.

COMMIT;
