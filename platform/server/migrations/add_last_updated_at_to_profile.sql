-- Migration: Add last_updated_at to user_profiles
-- Date: 2026-01-01
-- Description: Add missing last_updated_at column to match SQLAlchemy model

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();
