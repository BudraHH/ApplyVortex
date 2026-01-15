-- ==========================================
-- FILE: 005_platform_operations.sql
-- DESCRIPTION: Billing, System Logs, Alerts, and Agent System Schema.
-- DEPENDENCIES: 004_jobs_and_applications.sql
-- CREATED: 2025-12-28 (Refactored)
-- ==========================================

SET client_min_messages TO WARNING;

-- ==========================================
-- 1. USAGE CREDITS
-- ==========================================

CREATE TABLE IF NOT EXISTS system_usage_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    cycle_start_date TIMESTAMPTZ NOT NULL,
    cycle_end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Quotas
    resumes_generated INTEGER DEFAULT 0,
    resumes_limit INTEGER DEFAULT 5,
    
    cover_letters_generated INTEGER DEFAULT 0,
    cover_letters_limit INTEGER DEFAULT 10,
    
    applications_submitted INTEGER DEFAULT 0,
    applications_limit INTEGER DEFAULT 50,
    
    total_ai_tokens_used BIGINT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_credits_user_active ON system_usage_credits(user_id) WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS trg_system_usage_credits_updated_at ON system_usage_credits;
CREATE TRIGGER trg_system_usage_credits_updated_at BEFORE UPDATE ON system_usage_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 2. SYSTEM LOGS & ALERTS
-- ==========================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resource_id UUID, -- UUID in model, generic reference
    ip_address INET,
    duration_ms INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_id ON system_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_status ON system_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

DROP TRIGGER IF EXISTS trg_system_logs_updated_at ON system_logs;
CREATE TRIGGER trg_system_logs_updated_at BEFORE UPDATE ON system_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    severity SMALLINT NOT NULL DEFAULT 1, -- Maps to AlertSeverity.INFO
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    status SMALLINT NOT NULL DEFAULT 1,   -- Maps to AlertStatus.ACTIVE
    
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

DROP TRIGGER IF EXISTS trg_system_alerts_updated_at ON system_alerts;
CREATE TRIGGER trg_system_alerts_updated_at BEFORE UPDATE ON system_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 3. AGENT SYSTEM
-- ==========================================

-- Agent API Keys (Moved up to allow FK reference in agents table)
CREATE TABLE IF NOT EXISTS agent_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Security: Only hash is stored
    key_hash VARCHAR(255) NOT NULL,
    
    -- Display: First 12 chars for UI
    key_prefix VARCHAR(20) NOT NULL,
    
    -- User-friendly name
    name VARCHAR(100) NOT NULL,
    
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_api_keys_user_id ON agent_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_key_prefix ON agent_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_is_active ON agent_api_keys(is_active);

DROP TRIGGER IF EXISTS trg_agent_api_keys_updated_at ON agent_api_keys;
CREATE TRIGGER trg_agent_api_keys_updated_at BEFORE UPDATE ON agent_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES agent_api_keys(id) ON DELETE SET NULL,
    
    name VARCHAR(100),
    hostname VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    
    status SMALLINT DEFAULT 1, -- Maps to AgentStatus.OFFLINE
    last_heartbeat TIMESTAMPTZ,
    last_task_id UUID, -- Foreign Key to agent_forge_tasks (circular handled via reorder or soft ref)
    
    -- Metrics
    total_tasks_assigned INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    total_tasks_failed INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    total_execution_time_seconds INTEGER DEFAULT 0,
    average_execution_time_seconds FLOAT DEFAULT 0.0,
    last_task_completed_at TIMESTAMPTZ,
    
    -- Rate Limiting
    max_tasks_per_hour INTEGER DEFAULT 60,
    tasks_this_hour INTEGER DEFAULT 0,
    rate_limit_reset_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

DROP TRIGGER IF EXISTS trg_agents_updated_at ON agents;
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_forge_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    task_type SMALLINT NOT NULL,
    status SMALLINT DEFAULT 1,    -- Maps to TaskStatus.PENDING
    priority SMALLINT DEFAULT 2,  -- Maps to TaskPriority.MEDIUM
    
    blueprint_id UUID REFERENCES user_blueprints(id) ON DELETE SET NULL,
    
    payload JSONB DEFAULT '{}',
    result JSONB,
    error_log TEXT,
    
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_forge_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_forge_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned_agent ON agent_forge_tasks(assigned_agent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_unique_blueprint_pending ON agent_forge_tasks (blueprint_id, task_type) WHERE status = 1;

DROP TRIGGER IF EXISTS trg_agent_forge_tasks_updated_at ON agent_forge_tasks;
CREATE TRIGGER trg_agent_forge_tasks_updated_at BEFORE UPDATE ON agent_forge_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Job Portals (Optional metadata table)
CREATE TABLE IF NOT EXISTS job_portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_job_portals_updated_at ON job_portals;
CREATE TRIGGER trg_job_portals_updated_at BEFORE UPDATE ON job_portals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
