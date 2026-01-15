-- Migration: Remove unique constraint from user_sessions.user_id to allow multiple concurrent sessions
-- Date: 2026-01-02

BEGIN;

-- Drop the unique constraint on user_id
-- The constraint name might vary, so we'll use a conditional approach
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_sessions_user_id_key'
    ) THEN
        ALTER TABLE user_sessions DROP CONSTRAINT user_sessions_user_id_key;
    END IF;
END $$;

-- Verify the change
-- user_id should still have an index but not a unique constraint
-- The index will remain for performance

COMMIT;
