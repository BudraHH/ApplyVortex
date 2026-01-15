-- Rename table user_scrapped_jobs to user_job_map
BEGIN;

ALTER TABLE user_scrapped_jobs RENAME TO user_job_map;

-- Rename Primary Key constraint/index
ALTER INDEX pk_user_scrapped_jobs RENAME TO pk_user_job_map;

-- Rename Foreign Key constraints
ALTER TABLE user_job_map RENAME CONSTRAINT fk_user_scrapped_jobs_job_id_jobs TO fk_user_job_map_job_id_jobs;
ALTER TABLE user_job_map RENAME CONSTRAINT fk_user_scrapped_jobs_user_id_users TO fk_user_job_map_user_id_users;

-- Rename Unique Constraint
ALTER TABLE user_job_map RENAME CONSTRAINT uq_user_scrapped_jobs_user_job TO uq_user_job_map_user_job;

-- Rename Indices
ALTER INDEX ix_user_scrapped_jobs_user_scrapped_jobs_id RENAME TO ix_user_job_map_id;
ALTER INDEX ix_user_scrapped_jobs_user_scrapped_jobs_job_id RENAME TO ix_user_job_map_job_id;
ALTER INDEX ix_user_scrapped_jobs_user_scrapped_jobs_user_id RENAME TO ix_user_job_map_user_id;

COMMIT;
