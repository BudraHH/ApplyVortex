-- Migration: Create agent_api_keys table
-- Date: 2026-01-01
-- Description: Create agent_api_keys table with proper schema

CREATE TABLE IF NOT EXISTS agent_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Security: Only hash is stored, never the actual key
    key_hash VARCHAR(255) NOT NULL,
    
    -- Display: First 12 chars for UI (e.g., "apf_agent_a3f4...")
    key_prefix VARCHAR(20) NOT NULL,
    
    -- User-friendly name (e.g., "Johns MacBook", "Office Desktop")
    name VARCHAR(100) NOT NULL,
    
    -- Tracking
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_user_id ON agent_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_key_prefix ON agent_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_is_active ON agent_api_keys(is_active);
