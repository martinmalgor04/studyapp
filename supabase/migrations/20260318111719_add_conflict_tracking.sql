-- Migration: Add conflict tracking columns to sessions table
-- Tracks when sessions are adjusted to avoid Google Calendar conflicts
-- Created: 2026-03-18

ALTER TABLE sessions 
ADD COLUMN adjusted_for_conflict BOOLEAN DEFAULT FALSE,
ADD COLUMN original_scheduled_at TIMESTAMPTZ NULL;

-- Add comments for documentation
COMMENT ON COLUMN sessions.adjusted_for_conflict IS 
  'Indica si la sesión fue movida para evitar conflicto con Google Calendar';

COMMENT ON COLUMN sessions.original_scheduled_at IS 
  'Fecha/hora originalmente calculada antes de ajustar por conflicto';

-- Create index for querying adjusted sessions (partial index for efficiency)
CREATE INDEX idx_sessions_adjusted_conflict ON sessions(adjusted_for_conflict) 
  WHERE adjusted_for_conflict = true;
