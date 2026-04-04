-- [6g] Tipo de sesión: repaso espaciado vs preparación pre-clase.
-- Enum y columna idempotentes para entornos que ya tengan el tipo o la columna.

DO $$
BEGIN
  CREATE TYPE public.session_type AS ENUM ('REVIEW', 'PRE_CLASS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS session_type public.session_type NOT NULL DEFAULT 'REVIEW';

COMMENT ON COLUMN public.sessions.session_type IS 'REVIEW: repetición espaciada; PRE_CLASS: estudio antes de la clase';
