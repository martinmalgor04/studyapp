-- Migration: Split exam_type into exam_category + exam_modality
-- Date: 2026-03-26
-- Description: Replaces the monolithic exam_type enum with two separate enums
--   (exam_category + exam_modality) to cleanly support mixed-mode exams like
--   "Parcial Teórico-Práctico" without combinatorial explosion.

-- 1. Create new enums
CREATE TYPE exam_category AS ENUM ('PARCIAL', 'RECUPERATORIO', 'FINAL', 'TP');
CREATE TYPE exam_modality AS ENUM ('THEORY', 'PRACTICE', 'THEORY_PRACTICE');

-- 2. Add new columns (nullable first for migration)
ALTER TABLE exams
  ADD COLUMN category exam_category,
  ADD COLUMN modality exam_modality;

-- 3. Migrate existing data
UPDATE exams SET
  category = CASE
    WHEN type IN ('PARCIAL_THEORY', 'PARCIAL_PRACTICE')             THEN 'PARCIAL'::exam_category
    WHEN type IN ('RECUPERATORIO_THEORY', 'RECUPERATORIO_PRACTICE')  THEN 'RECUPERATORIO'::exam_category
    WHEN type IN ('FINAL_THEORY', 'FINAL_PRACTICE')                 THEN 'FINAL'::exam_category
    WHEN type = 'TP'                                                 THEN 'TP'::exam_category
  END,
  modality = CASE
    WHEN type IN ('PARCIAL_THEORY', 'RECUPERATORIO_THEORY', 'FINAL_THEORY')       THEN 'THEORY'::exam_modality
    WHEN type IN ('PARCIAL_PRACTICE', 'RECUPERATORIO_PRACTICE', 'FINAL_PRACTICE') THEN 'PRACTICE'::exam_modality
    WHEN type = 'TP'                                                               THEN 'PRACTICE'::exam_modality
  END;

-- 4. Make columns NOT NULL now that data is migrated
ALTER TABLE exams
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN modality SET NOT NULL;

-- 5. Set defaults for future inserts
ALTER TABLE exams
  ALTER COLUMN modality SET DEFAULT 'THEORY_PRACTICE'::exam_modality;

-- 6. Drop old column and enum
ALTER TABLE exams DROP COLUMN type;
DROP TYPE exam_type;

-- 7. Add comments
COMMENT ON COLUMN exams.category IS 'Exam category: PARCIAL, RECUPERATORIO, FINAL, or TP';
COMMENT ON COLUMN exams.modality IS 'Exam modality: THEORY, PRACTICE, or THEORY_PRACTICE';
