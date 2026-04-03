ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system'
  CHECK (theme_preference IN ('light', 'dark', 'system'));
