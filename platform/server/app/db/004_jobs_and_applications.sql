-- ==========================================
-- FILE: 004_jobs_and_applications.sql
-- DESCRIPTION: Jobs, Applications, Cover Letters, and Content generation.
-- DEPENDENCIES: 003_profile_and_resume.sql
-- CREATED: 2025-12-28 (Refactored)
-- ==========================================

SET client_min_messages TO WARNING;

-- ==========================================
-- 1. ENUMS
-- ==========================================

-- Enums removed and replaced by Integers mapped to constants.py
-- ApplicationStatus: 1=PENDING/DRAFT, 2=APPLIED, ...
-- WorkMode (LocationType): 1=ONSITE, 2=REMOTE, 3=HYBRID
-- CoverLetterTone: 1=PROFESSIONAL, 2=ENTHUSIASTIC, ...

-- ==========================================
-- 2. JOBS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- FOREIGN KEY
    portal SMALLINT NOT NULL, -- Maps to Portal Enum
    
    -- UNIQUE IDENTIFIERS
    external_id VARCHAR(255) NOT NULL, -- The ID from LinkedIn/Naukri (e.g., "3762819021")
    
    -- CORE DETAILS
    title VARCHAR(300) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_website VARCHAR(255),
    company_logo_url TEXT,
    
    -- AUTOMATION & LOGIC FIELDS
    application_type VARCHAR(50) DEFAULT 'external' NOT NULL, -- 'quick_apply', 'external', 'questionnaire'
    apply_url TEXT NOT NULL,               -- The URL the bot visits
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'applied', 'skipped', 'failed'
    metadata JSONB DEFAULT '{}',           -- Store dynamic data (e.g., Naukri questionnaire JSON)
    
    -- LOCATION (Hybrid approach)
    location_raw VARCHAR(255),  -- Always store this (e.g. "Bengaluru/Bangalore")
    location_city VARCHAR(100), -- Parsed if possible (nullable)
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    work_mode SMALLINT DEFAULT 1,  -- Maps to WorkMode constant
    -- COMPENSATION (Hybrid approach)
    salary_raw VARCHAR(255),    -- Always store this (e.g. "Not Disclosed")
    salary_min INTEGER,         -- Parsed (nullable)
    salary_max INTEGER,         -- Parsed (nullable)
    salary_currency VARCHAR(10) DEFAULT 'INR',

    -- JOB DETAILS
    description TEXT,           -- Full HTML content
    experience_level SMALLINT,  -- Maps to ExperienceLevel constant
    job_type SMALLINT,          -- Maps to JobType constant
    
    -- AI/PARSED DATA (Arrays are TEXT[])
    requirements TEXT[],        
    responsibilities TEXT[],
    extracted_keywords TEXT[],

    -- METRICS & FLAGS
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    application_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- TIMESTAMPS
    posted_at TIMESTAMPTZ,      -- "2 hours ago" converted to timestamp
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINT: Prevent duplicate jobs from the same portal
    UNIQUE(portal, external_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_portal ON jobs(portal);
DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 3. JOB APPLICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    status SMALLINT DEFAULT 1, -- 1: PENDING/DRAFT
    applied_at TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    interview_scheduled_at TIMESTAMPTZ,
    offer_received_at TIMESTAMPTZ,
    
    resume_used_id UUID REFERENCES user_resumes(id) ON DELETE SET NULL,
    cover_letter_used_id UUID REFERENCES user_resumes(id) ON DELETE SET NULL, -- As per model relationship
    
    application_source SMALLINT,
    notes TEXT,
    
    -- Follow-up
    next_followup_at TIMESTAMPTZ,
    rejection_reason TEXT,
    response_received BOOLEAN DEFAULT FALSE,
    
    -- Automation
    automation_status VARCHAR(50), -- 'started', 'completed', 'failed'
    automation_logs JSONB,
    screenshots JSONB, -- List of file keys
    error_message TEXT,
    preferred_method SMALLINT DEFAULT 1 NOT NULL, -- 1: AUTO (ApplicationMethod)
    
    -- Legacy/Redundant compat fields (not in model but keeping for safe transition if needed)
    -- match_score INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT uq_job_applications_user_job UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_resume_id ON job_applications(resume_used_id);
DROP TRIGGER IF EXISTS trg_job_applications_updated_at ON job_applications;
CREATE TRIGGER trg_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 4. JOB MATCH ANALYSIS (Formerly job_match_scores)
-- ==========================================

CREATE TABLE IF NOT EXISTS job_match_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Composite Match Scores (0.0000 - 1.0000)
    overall_match NUMERIC(5, 4) NOT NULL,
    skill_match NUMERIC(5, 4),
    experience_match NUMERIC(5, 4),
    location_match NUMERIC(5, 4),
    salary_match NUMERIC(5, 4),
    
    matched_skills TEXT[],
    missing_skills TEXT[],
    skill_gap_recommendations TEXT[],
    
    -- Thresholds/Flags
    match_quality SMALLINT DEFAULT 1, -- Maps to JobMatchQuality Enum (1: WEAK, ..., 4: STRONG)
    
    -- Confidence & Info
    confidence_score NUMERIC(5, 4),
    model_version VARCHAR(50),
    analysis_notes TEXT, -- The logic/reasoning from the AI
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW() -- Added for completeness
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_match_analysis_unique ON job_match_analysis(user_id, job_id);


-- ==========================================
-- 5. USER JOB MAP (Formerly user_scrapped_jobs)
-- ==========================================

CREATE TABLE IF NOT EXISTS user_job_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES user_blueprints(id) ON DELETE SET NULL,
    
    -- Personal State
    application_status VARCHAR(50) DEFAULT 'draft',
    applied_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- CONSTRAINT: One entry per user-job pair
    CONSTRAINT uq_user_job_map_user_job UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS ix_user_job_map_user_id ON user_job_map(user_id);
CREATE INDEX IF NOT EXISTS ix_user_job_map_job_id ON user_job_map(job_id);


-- ==========================================
-- 5. USER COVER LETTERS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_cover_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Meta
    name VARCHAR(200), -- Usually "Cover Letter for [Job]" or filename
    is_generated BOOLEAN DEFAULT FALSE,
    
    -- Content (Generated or Parsed)
    content_text TEXT, 
    tailoring_prompt TEXT,
    tone INTEGER DEFAULT 1, -- 1: PROFESSIONAL
    
    -- File (R2 Storage)
    file_url VARCHAR(500),
    file_path VARCHAR(500), -- R2 Key
    file_name VARCHAR(255),
    file_format INTEGER DEFAULT 1, -- 1: PDF
    file_size_bytes INTEGER,
    
    word_count INTEGER,
    is_final BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trg_user_cover_letters_updated_at ON user_cover_letters;
CREATE TRIGGER trg_user_cover_letters_updated_at BEFORE UPDATE ON user_cover_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 6. ACTIVITY LOG
-- ==========================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    portal SMALLINT,
    
    activity_type VARCHAR(50) NOT NULL, -- 'search', 'view', 'apply'
    
    -- Specific Activity Info
    search_keywords VARCHAR(500),
    job_title VARCHAR(500),
    jobs_count INTEGER DEFAULT 0,
    status VARCHAR(50), -- applied, interview, offer
    
    -- Metadata
    ip_address INET, -- Better to use INET than String(45) but keeping model compat below
    user_agent VARCHAR(500),
    details JSONB, -- fallback for dynamic data
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Overriding ip_address type to VARCHAR(50) to match model exact string if needed
ALTER TABLE activity_log ALTER COLUMN ip_address TYPE VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_job ON activity_log(job_id);
