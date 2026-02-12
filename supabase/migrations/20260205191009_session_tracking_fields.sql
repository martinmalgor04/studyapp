-- Migration: Add session tracking fields for UC-008
-- Date: 2026-02-05
-- Description: Adds fields for tracking session completion, rating, and actual study time

-- Add new columns to sessions table
ALTER TABLE sessions
ADD COLUMN started_at TIMESTAMPTZ,
ADD COLUMN completion_rating TEXT CHECK (completion_rating IN ('EASY', 'NORMAL', 'HARD')),
ADD COLUMN actual_duration INTEGER; -- Duración real en minutos

-- Comments for documentation
COMMENT ON COLUMN sessions.started_at IS 'Timestamp when user started studying this session';
COMMENT ON COLUMN sessions.completion_rating IS 'User rating of difficulty: EASY, NORMAL, or HARD';
COMMENT ON COLUMN sessions.actual_duration IS 'Actual study time in minutes (may differ from planned duration)';
