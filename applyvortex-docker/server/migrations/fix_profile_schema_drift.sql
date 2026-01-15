-- Migration: Fix profile schema drift
-- Date: 2026-01-01
-- Description: Rename generic location columns to current_ prefix and add permanent_ columns to match model

BEGIN;

-- Rename existing generic columns to current_ prefix if they exist and target doesn't
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address') THEN
    ALTER TABLE user_profiles RENAME COLUMN address TO current_address;
  END IF;
  
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='city') THEN
    ALTER TABLE user_profiles RENAME COLUMN city TO current_city;
  END IF;

  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='state') THEN
    ALTER TABLE user_profiles RENAME COLUMN state TO current_state;
  END IF;

  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='country') THEN
    ALTER TABLE user_profiles RENAME COLUMN country TO current_country;
  END IF;

  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='postal_code') THEN
    ALTER TABLE user_profiles RENAME COLUMN postal_code TO current_postal_code;
  END IF;
END $$;

-- Add permanent address columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS permanent_address VARCHAR(500),
ADD COLUMN IF NOT EXISTS permanent_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_postal_code VARCHAR(20);

COMMIT;
