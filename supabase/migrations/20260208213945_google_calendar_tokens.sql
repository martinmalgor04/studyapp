-- Migration: Add Google Calendar OAuth tokens to user_settings
-- Date: 2026-02-08
-- Description: Adds columns to store Google Calendar OAuth tokens and sync preferences

ALTER TABLE user_settings
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN google_token_expiry TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN user_settings.google_access_token IS 'Google OAuth access token for Calendar API';
COMMENT ON COLUMN user_settings.google_refresh_token IS 'Google OAuth refresh token for Calendar API';
COMMENT ON COLUMN user_settings.google_calendar_enabled IS 'Flag to enable/disable Google Calendar sync';
COMMENT ON COLUMN user_settings.google_token_expiry IS 'Expiry timestamp for the access token';
