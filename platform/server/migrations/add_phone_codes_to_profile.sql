-- Migration: Add phone country codes to user_profiles
-- Date: 2026-01-01
-- Description: Add missing phone_country_code and alternate_phone_country_code columns

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS alternate_phone_country_code VARCHAR(10);
