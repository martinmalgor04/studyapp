-- Migration: Create availability_slots table
-- Date: 2026-02-05
-- Description: Adds availability_slots table to store user study hours

CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own availability"
  ON availability_slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own availability"
  ON availability_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability"
  ON availability_slots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own availability"
  ON availability_slots FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_availability_user_day ON availability_slots(user_id, day_of_week);

-- Comments
COMMENT ON TABLE availability_slots IS 'User defined study time slots per day of week';
COMMENT ON COLUMN availability_slots.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
