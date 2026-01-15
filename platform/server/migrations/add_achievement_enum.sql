-- Migration: Add ACHIEVEMENT to accomplishment_category_enum
-- Date: 2025-12-30

ALTER TYPE accomplishment_category_enum ADD VALUE IF NOT EXISTS 'ACHIEVEMENT';
