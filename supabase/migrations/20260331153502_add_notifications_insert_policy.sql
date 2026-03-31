-- Add missing INSERT policy for notifications table
-- RLS was enabled with SELECT/UPDATE/DELETE policies but INSERT was missing,
-- causing all in-app notification inserts to fail with policy violation.

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
