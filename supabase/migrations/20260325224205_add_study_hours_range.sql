-- Migration: Add study hours range to user_settings
-- Date: 2026-03-25
-- Description: Adds study_start_hour and study_end_hour columns so the
--   session generator respects the user's preferred study window.
--   Availability slots outside this range are ignored when scheduling.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS study_start_hour TIME DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS study_end_hour   TIME DEFAULT '23:00:00';

COMMENT ON COLUMN user_settings.study_start_hour
  IS 'Earliest hour the user wants study sessions scheduled (local time)';
COMMENT ON COLUMN user_settings.study_end_hour
  IS 'Latest hour the user wants study sessions to start (local time)';
