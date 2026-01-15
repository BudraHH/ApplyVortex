-- ==========================================
-- FILE: 002_identity_access.sql
-- DESCRIPTION: Authentication, Authorization, Sessions, and User Notifications.
-- DEPENDENCIES: 001_common_and_master_data.sql
-- CREATED: 2025-12-28 (Refactored)
-- ==========================================

SET client_min_messages TO WARNING;

-- ==========================================
-- 1. ENUMS (Auth & Access)
-- ==========================================

-- ENUMS replaced by Integers mapped to constants.py
-- AccountStatus: 0=PENDING, 1=ACTIVE, 2=INACTIVE, 3=SUSPENDED, 4=DELETED
-- OAuthProvider: 1=GOOGLE, 2=GITHUB, 3=LINKEDIN, 4=MICROSOFT
-- UserRole: 1=USER, 2=ADMIN, 3=SUPER_ADMIN
-- NotificationType: 1=APPLICATION, 2=JOB_ALERT, ...

-- ==========================================
-- 2. USERS TABLE (Core Identity)
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_token_expires_at TIMESTAMPTZ,
    password_hash VARCHAR(255),
    
    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_token_expires_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    
    -- OAuth
    oauth_provider SMALLINT,
    oauth_provider_id VARCHAR(255),
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMPTZ,
    
    -- Account Status
    account_status SMALLINT DEFAULT 0 NOT NULL, -- 0: PENDING
    role SMALLINT DEFAULT 1 NOT NULL,           -- 1: USER
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes TEXT[],
    
    -- Session Management
    active_sessions_count INTEGER DEFAULT 0,
    max_sessions INTEGER DEFAULT 5,
    
    -- Compliance (GDPR)
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted_at TIMESTAMPTZ,
    marketing_emails_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT TRUE,
    
    -- Admin
    admin_notes TEXT,
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider, oauth_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC);

-- User Trigger
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. USER SESSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    access_token_jti VARCHAR(255) NOT NULL,
    
    device_name VARCHAR(200),
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    
    country VARCHAR(100),
    city VARCHAR(100),
    
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_jti ON user_sessions(access_token_jti);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Session Trigger
DROP TRIGGER IF EXISTS trg_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER trg_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 4. USER NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type SMALLINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(512),
    
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON user_notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON user_notifications(created_at DESC);

-- Notification Trigger
DROP TRIGGER IF EXISTS update_user_notifications_modtime ON user_notifications;
CREATE TRIGGER update_user_notifications_modtime
    BEFORE UPDATE ON user_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 5. USER BLUEPRINTS (Search Preferences)
-- ==========================================

CREATE TABLE IF NOT EXISTS user_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Blueprint Meta
    name VARCHAR(255),

    -- Search Filters
    keywords TEXT[],
    excluded_keywords TEXT[],
    locations TEXT[],
    portal SMALLINT,
    companies TEXT[],

    -- Compensation Filters
    min_salary INTEGER,

    -- Job Filters
    experience_level SMALLINT,
    job_type SMALLINT,
    work_mode SMALLINT,

    -- Delivery Settings
    frequency INTEGER DEFAULT 86400,
    date_posted VARCHAR(100),
    delivery_method VARCHAR(20) DEFAULT 'email',

    -- Automation
    auto_scrape BOOLEAN DEFAULT FALSE,
    auto_apply BOOLEAN DEFAULT FALSE,

    -- Status & Stats
    is_active BOOLEAN DEFAULT FALSE,
    last_delivered_at TIMESTAMPTZ,
    total_deliveries INTEGER DEFAULT 0,
    total_jobs_matched INTEGER DEFAULT 0,

    -- Snooze
    snoozed_until TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blueprint Indexes
CREATE INDEX IF NOT EXISTS idx_user_blueprints_user ON user_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blueprints_active ON user_blueprints(is_active);

-- Blueprint Trigger
DROP TRIGGER IF EXISTS trg_user_blueprints_updated_at ON user_blueprints;
CREATE TRIGGER trg_user_blueprints_updated_at BEFORE UPDATE ON user_blueprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 6. HELPER FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_locked_until TIMESTAMPTZ;
BEGIN
    SELECT locked_until INTO v_locked_until FROM users WHERE id = p_user_id;
    RETURN v_locked_until IS NOT NULL AND v_locked_until > NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_failed_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
    locked_until = CASE WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes' ELSE locked_until END
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET deleted_at = NOW(), deletion_reason = p_reason, account_status = 4, -- 4: DELETED
        email = CONCAT('deleted_', id, '@deleted.local'), password_hash = NULL,
        oauth_access_token = NULL, oauth_refresh_token = NULL, two_factor_secret = NULL
    WHERE id = p_user_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE v_deleted INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days' RETURNING COUNT(*) INTO v_deleted;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. SEED DATA - ADMINS
-- ==========================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Super Admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@applyvortex.com') THEN
        INSERT INTO users (
            email, email_verified, password_hash, account_status, role, 
            created_at, updated_at, terms_accepted_at, privacy_policy_accepted_at, max_sessions
        ) VALUES (
            'superadmin@applyvortex.com', TRUE, '$2b$12$xmi50Yzcg8d8weGmWihk5ea3U.BT0og8WG6F.nW.NKwN/L1CB/9mC',
            1, 3, NOW(), NOW(), NOW(), NOW(), 20  -- 1: ACTIVE, 3: SUPER_ADMIN
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Seeded superadmin.';
    END IF;

    -- 2. Admin 1
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin1@applyvortex.com') THEN
        INSERT INTO users (
            email, email_verified, password_hash, account_status, role, 
            created_at, updated_at, terms_accepted_at, privacy_policy_accepted_at, max_sessions
        ) VALUES (
            'admin1@applyvortex.com', TRUE, '$2b$12$xmi50Yzcg8d8weGmWihk5ea3U.BT0og8WG6F.nW.NKwN/L1CB/9mC',
            1, 2, NOW(), NOW(), NOW(), NOW(), 10  -- 1: ACTIVE, 2: ADMIN
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Seeded admin1.';
    END IF;
    
    -- 3. Admin 2
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin2@applyvortex.com') THEN
        INSERT INTO users (
            email, email_verified, password_hash, account_status, role, 
            created_at, updated_at, terms_accepted_at, privacy_policy_accepted_at, max_sessions
        ) VALUES (
            'admin2@applyvortex.com', TRUE, '$2b$12$xmi50Yzcg8d8weGmWihk5ea3U.BT0og8WG6F.nW.NKwN/L1CB/9mC',
            1, 2, NOW(), NOW(), NOW(), NOW(), 10  -- 1: ACTIVE, 2: ADMIN
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Seeded admin2.';
    END IF;
END $$;
