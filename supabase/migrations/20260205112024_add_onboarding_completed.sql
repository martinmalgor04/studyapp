-- Migration: Add onboarding_completed flag to user_settings
-- Date: 2026-02-05
-- Description: Adds onboarding_completed column to track if user completed onboarding wizard

-- Add column
ALTER TABLE user_settings
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON COLUMN user_settings.onboarding_completed IS 'Flag to track if user completed the onboarding wizard';
