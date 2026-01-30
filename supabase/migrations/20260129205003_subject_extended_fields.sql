-- Migration: Add extended fields to subjects table
-- Date: 2026-01-29
-- Description: Adds year, semester, status, professors, and schedule fields to subjects

-- Enum para cuatrimestre
CREATE TYPE semester_type AS ENUM ('ANNUAL', 'FIRST', 'SECOND');

-- Enum para estado de materia
CREATE TYPE subject_status AS ENUM ('CURSANDO', 'APROBADA', 'REGULAR', 'LIBRE');

-- Agregar campos a subjects
ALTER TABLE subjects
ADD COLUMN year SMALLINT,
ADD COLUMN semester semester_type,
ADD COLUMN status subject_status DEFAULT 'CURSANDO' NOT NULL,
ADD COLUMN professors TEXT[],
ADD COLUMN schedule JSONB;

-- Índice para filtrar por estado (mejora performance de queries)
CREATE INDEX idx_subjects_status ON subjects(status);

-- Comentarios para documentación
COMMENT ON COLUMN subjects.year IS 'Año de cursada (ej: 2024)';
COMMENT ON COLUMN subjects.semester IS 'Cuatrimestre: ANNUAL, FIRST, SECOND';
COMMENT ON COLUMN subjects.status IS 'Estado: CURSANDO (activa), APROBADA (finalizada), REGULAR (final pendiente), LIBRE (debe recursar)';
COMMENT ON COLUMN subjects.professors IS 'Array de nombres de profesores';
COMMENT ON COLUMN subjects.schedule IS 'Horarios de clases en formato JSON';
