-- Google Calendar Bidirectional Sync Migration
-- Enables full bidirectional synchronization between StudyApp and Google Calendar
-- Nota: google_calendar_enabled ya existe en user_settings (migration 20260208213945)

-- Add columns to sessions table for linking with Google Calendar events
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMPTZ;

-- Create index for fast lookups by google_event_id
CREATE INDEX IF NOT EXISTS idx_sessions_google_event_id ON sessions(google_event_id);

-- Add only the new tracking column (google_calendar_enabled was added in google_calendar_tokens migration)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN sessions.google_event_id IS 'Google Calendar event ID for bidirectional sync';
COMMENT ON COLUMN sessions.google_calendar_synced_at IS 'Timestamp when session was last synced to Google Calendar';
COMMENT ON COLUMN user_settings.google_calendar_last_sync IS 'Timestamp of last successful sync from Google Calendar';
