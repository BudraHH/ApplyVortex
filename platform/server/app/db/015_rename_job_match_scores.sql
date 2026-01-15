-- Rename table job_match_scores to job_match_analysis (Attempt 2)
BEGIN;

ALTER TABLE job_match_scores RENAME TO job_match_analysis;

-- Rename indices to maintain consistency
-- Note: 'idx_job_match_scores_unique' is the name of the UNIQUE INDEX, which acts as the unique constraint.
ALTER INDEX job_match_scores_pkey RENAME TO job_match_analysis_pkey;
ALTER INDEX idx_job_match_scores_unique RENAME TO idx_job_match_analysis_unique;

-- Rename Foreign Key constraints
ALTER TABLE job_match_analysis RENAME CONSTRAINT job_match_scores_job_id_fkey TO job_match_analysis_job_id_fkey;
ALTER TABLE job_match_analysis RENAME CONSTRAINT job_match_scores_user_id_fkey TO job_match_analysis_user_id_fkey;

COMMIT;
