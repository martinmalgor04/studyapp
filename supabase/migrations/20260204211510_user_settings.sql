-- Migration: Create user_settings table for notification preferences
-- Date: 2026-02-04
-- Description: Adds user_settings table to store notification preferences and availability

-- Create user_settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  telegram_notifications BOOLEAN DEFAULT FALSE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  daily_summary_time TIME DEFAULT '08:00:00',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view/update their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'User preferences for notifications and availability';
COMMENT ON COLUMN user_settings.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN user_settings.telegram_notifications IS 'Enable/disable Telegram notifications';
COMMENT ON COLUMN user_settings.in_app_notifications IS 'Enable/disable in-app notifications';
COMMENT ON COLUMN user_settings.daily_summary_time IS 'Preferred time for daily summary notification (HH:MM:SS)';

-- Create default settings for existing users (if any)
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
