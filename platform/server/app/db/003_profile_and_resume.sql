-- ==========================================
-- FILE: 003_profile_and_resume.sql
-- DESCRIPTION: User Profile, Resume Data, and Skill Mappings.
-- DEPENDENCIES: 002_identity_access.sql
-- CREATED: 2025-12-28 (Refactored)
-- ==========================================

SET client_min_messages TO WARNING;

-- ==========================================
-- 1. ENUMS
-- ==========================================

-- All Enums removed and replaced by Integers mapped to constants.py
-- Defaults:
-- Gender: 1=MALE, 2=FEMALE, ...
-- JobSearchStatus: 1=ACTIVELY_LOOKING
-- Availability: 1=IMMEDIATE
-- JobType (EmploymentType): 1=FULL_TIME
-- EducationLevel (DegreeType): ...
-- EducationStatus: 1=COMPLETED
-- ProjectStatus: 1=COMPLETED
-- ResumeType: 3=MANUAL (Default), 1=BASE
-- ParsingStatus: 1=PENDING

-- ==========================================
-- 2. CORE PROFILE
-- ==========================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal
    gender SMALLINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    phone_country_code VARCHAR(10),
    alternate_phone VARCHAR(20),
    alternate_phone_country_code VARCHAR(10),
    
    -- Professional
    headline VARCHAR(200),
    professional_summary TEXT,
    "current_role" VARCHAR(200),
    current_company VARCHAR(200),
    years_of_experience NUMERIC(3,1) DEFAULT 0,
    
    -- Location
    current_address VARCHAR(500),
    current_city VARCHAR(100),
    current_state VARCHAR(100),
    current_country VARCHAR(100) DEFAULT 'India',
    current_postal_code VARCHAR(20),
    
    -- Permanent Address
    permanent_address VARCHAR(500),
    permanent_city VARCHAR(100),
    permanent_state VARCHAR(100),
    permanent_country VARCHAR(100),
    permanent_postal_code VARCHAR(20),
    
    -- Search Prefs
    willing_to_relocate BOOLEAN DEFAULT TRUE,
    preferred_work_mode SMALLINT DEFAULT 1,     -- 1: ONSITE
    job_search_status SMALLINT DEFAULT 1,       -- 1: ACTIVELY_LOOKING
    availability SMALLINT DEFAULT 1,            -- 1: IMMEDIATE
    notice_period_days INTEGER,
    
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'INR',
    
    -- Links
    github_url VARCHAR(500), linkedin_url VARCHAR(500), portfolio_url VARCHAR(500),
    leetcode_url VARCHAR(500), naukri_url VARCHAR(500), stackoverflow_url VARCHAR(500),
    medium_url VARCHAR(500), personal_website VARCHAR(500),
    
    -- Regional Settings
    timezone VARCHAR(50),
    date_format VARCHAR(20),
    
    -- Metadata
    profile_completeness INTEGER DEFAULT 0,
    preferences JSONB,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Completeness Function
CREATE OR REPLACE FUNCTION calculate_profile_completeness() RETURNS TRIGGER AS $$
DECLARE v_score INTEGER := 0;
BEGIN
    IF NEW.first_name IS NOT NULL THEN v_score := v_score + 5; END IF;
    IF NEW.last_name IS NOT NULL THEN v_score := v_score + 5; END IF;
    IF NEW.phone_number IS NOT NULL THEN v_score := v_score + 10; END IF;
    IF NEW.current_city IS NOT NULL THEN v_score := v_score + 10; END IF;
    IF NEW.headline IS NOT NULL THEN v_score := v_score + 10; END IF;
    IF NEW.professional_summary IS NOT NULL THEN v_score := v_score + 15; END IF;
    IF NEW.years_of_experience > 0 THEN v_score := v_score + 15; END IF;
    
    IF NEW.github_url IS NOT NULL OR NEW.linkedin_url IS NOT NULL OR NEW.portfolio_url IS NOT NULL THEN 
        v_score := v_score + 30; -- Simplified for brevity in refactor
    END IF;
    
    NEW.profile_completeness := GREATEST(0, LEAST(100, v_score));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_profile_completeness ON user_profiles;
CREATE TRIGGER trg_calculate_profile_completeness BEFORE INSERT OR UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION calculate_profile_completeness();


-- ==========================================
-- 3. RESUME DATA (Experience, Education, etc)
-- ==========================================

-- Experience
CREATE TABLE IF NOT EXISTS user_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    
    work_mode SMALLINT DEFAULT 1, -- 1: ONSITE
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    
    start_month INTEGER NOT NULL, 
    start_year INTEGER NOT NULL,
    end_month INTEGER, 
    end_year INTEGER,
    is_current BOOLEAN DEFAULT FALSE,
    
    employment_type SMALLINT NOT NULL, -- Maps to JobType constant
    job_summary TEXT,
    key_responsibilities TEXT[], 
    achievements TEXT[],
    
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_experiences_updated_at ON user_experiences;
CREATE TRIGGER trg_user_experiences_updated_at BEFORE UPDATE ON user_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Education
CREATE TABLE IF NOT EXISTS user_educations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree_type SMALLINT NOT NULL, -- Maps to EducationLevel constant
    degree_name VARCHAR(200) NOT NULL,
    field_of_study VARCHAR(200) NOT NULL,
    
    institution_name VARCHAR(200) NOT NULL,
    university_name VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    
    start_month INTEGER NOT NULL,
    start_year INTEGER NOT NULL,
    end_month INTEGER,
    end_year INTEGER,
    expected_graduation_month INTEGER,
    expected_graduation_year INTEGER,
    no_of_years INTEGER,
    
    grade_type SMALLINT,
    grade_value VARCHAR(20),
    grade_scale VARCHAR(20),
    
    honors_awards TEXT[],
    relevant_coursework TEXT[],
    
    thesis_title VARCHAR(300),
    thesis_description TEXT,
    research_areas TEXT[],
    publications TEXT[],
    
    activities TEXT[],
    societies TEXT[],
    
    description TEXT,
    achievements TEXT,
    
    status SMALLINT DEFAULT 1, -- 1: COMPLETED
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_educations_updated_at ON user_educations;
CREATE TRIGGER trg_user_educations_updated_at BEFORE UPDATE ON user_educations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Projects
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(200) NOT NULL,
    project_type SMALLINT NOT NULL DEFAULT 1, -- 1: PERSONAL
    status SMALLINT DEFAULT 1,                -- 1: COMPLETED
    
    short_description VARCHAR(500), 
    detailed_description TEXT,
    
    start_month INTEGER,
    start_year INTEGER,
    end_month INTEGER,
    end_year INTEGER,
    
    github_url VARCHAR(500), 
    live_url VARCHAR(500),
    documentation_url VARCHAR(500),
    
    key_features TEXT[], 
    challenges_faced TEXT,
    
    display_order INTEGER DEFAULT 0, 
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_projects_updated_at ON user_projects;
CREATE TRIGGER trg_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Certifications
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200) NOT NULL,
    
    issue_date DATE, 
    expiry_date DATE, 
    does_not_expire BOOLEAN DEFAULT FALSE,
    
    credential_id VARCHAR(200),
    credential_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_certifications_updated_at ON user_certifications;
CREATE TRIGGER trg_user_certifications_updated_at BEFORE UPDATE ON user_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Accomplishments
CREATE TABLE IF NOT EXISTS user_accomplishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category SMALLINT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_accomplishments_updated_at ON user_accomplishments;
CREATE TRIGGER trg_user_accomplishments_updated_at BEFORE UPDATE ON user_accomplishments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Research & Publications
CREATE TABLE IF NOT EXISTS user_research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    research_type SMALLINT,
    authors VARCHAR(300) NOT NULL,
    publisher VARCHAR(200) NOT NULL, -- venue/publisher
    publication_month INTEGER CHECK (publication_month >= 1 AND publication_month <= 12),
    publication_year INTEGER NOT NULL CHECK (publication_year >= 1900 AND publication_year <= 2100),
    url TEXT, -- DOI or URL
    abstract TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_research_user_id ON user_research(user_id);
DROP TRIGGER IF EXISTS trg_user_research_updated_at ON user_research;
CREATE TRIGGER trg_user_research_updated_at BEFORE UPDATE ON user_research FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Languages
CREATE TABLE IF NOT EXISTS user_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(100) NOT NULL,
    proficiency SMALLINT NOT NULL,
    ability SMALLINT DEFAULT 3 NOT NULL, -- 3: BOTH
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_languages_unique UNIQUE (user_id, language)
);

-- ==========================================
-- 4. RESUME FILES
-- ==========================================

-- Resume Files
CREATE TABLE IF NOT EXISTS user_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    resume_type SMALLINT NOT NULL DEFAULT 3, -- 3: MANUAL
    is_default BOOLEAN DEFAULT FALSE,
    
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_format SMALLINT NOT NULL DEFAULT 1, -- 1: PDF
    file_size_bytes INTEGER,
    file_hash VARCHAR(64),
    
    parsing_status SMALLINT DEFAULT 1, -- 1: PENDING
    parsing_started_at TIMESTAMPTZ,
    parsing_completed_at TIMESTAMPTZ,
    parsing_error TEXT,
    parsed_data JSONB,
    structured_content JSONB,
    optimization_metadata JSONB,
    
    tailored_for_job_id UUID,
    tailoring_prompt TEXT,
    base_resume_id UUID, -- self reference handled loosely or via child logic
    
    template_name VARCHAR(100) DEFAULT 'modern',
    template_config JSONB,
    
    version INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    
    ats_score INTEGER,
    ats_issues TEXT[],
    
    notes TEXT,
    tags TEXT[],
    archived_at TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_base_resume ON user_resumes(user_id) WHERE resume_type = 1; -- 1: BASE
DROP TRIGGER IF EXISTS trg_user_resumes_updated_at ON user_resumes;
CREATE TRIGGER trg_user_resumes_updated_at BEFORE UPDATE ON user_resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 5. SKILL MAPPINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_skill_map (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_skill_map_unique UNIQUE (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS user_project_skill_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    CONSTRAINT user_project_skill_map_unique UNIQUE (user_project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS user_experience_skill_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_experience_id UUID NOT NULL REFERENCES user_experiences(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    CONSTRAINT user_experience_skill_map_unique UNIQUE (user_experience_id, skill_id)
);

-- ==========================================
-- 6. PROFILE SEED
-- ==========================================

-- Seed profiles for the admins if they don't exist is handled in the application logic or identity file
-- because user_id is needed. The previous file (002) inserted profiles because it had the user_id in context.
-- That is fine. Identity file handles user + basic profile creation.
