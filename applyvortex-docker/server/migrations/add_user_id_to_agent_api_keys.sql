-- Migration: Add user_id column to agent_api_keys table
-- Date: 2026-01-01
-- Description: Add user_id foreign key to agent_api_keys table to link API keys to users

-- Add user_id column
ALTER TABLE agent_api_keys 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint
ALTER TABLE agent_api_keys 
ADD CONSTRAINT fk_agent_api_keys_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_user_id ON agent_api_keys(user_id);

-- Add missing columns from model
ALTER TABLE agent_api_keys 
ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(20);

ALTER TABLE agent_api_keys 
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

ALTER TABLE agent_api_keys 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

ALTER TABLE agent_api_keys 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on key_prefix
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_key_prefix ON agent_api_keys(key_prefix);

-- Remove old agent_name column if it exists (replaced by name)
ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS agent_name;
