-- Migration: Add salary, notice period, and social URL columns to user_profiles
-- Date: 2026-01-01
-- Description: Add missing columns that caused server errors during startup/health check

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS expected_salary_min INTEGER,
ADD COLUMN IF NOT EXISTS expected_salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS notice_period_days INTEGER,
ADD COLUMN IF NOT EXISTS github_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS leetcode_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS naukri_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS stackoverflow_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS medium_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS personal_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS years_of_experience NUMERIC(3, 1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS preferred_work_mode SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS job_search_status SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS availability SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB;
