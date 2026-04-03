-- Sprint 7h — Metadata de materia extraída por IA
-- Referencia: docs/spec-kit/NEW_SPRINTS_PLAN.md [7h]

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS total_hours numeric,
  ADD COLUMN IF NOT EXISTS weekly_hours numeric,
  ADD COLUMN IF NOT EXISTS bibliography jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS ai_extraction_id uuid;

COMMENT ON COLUMN public.subjects.total_hours IS 'Horas cátedra totales (p. ej. desde programa PDF)';
COMMENT ON COLUMN public.subjects.weekly_hours IS 'Horas semanales estimadas';
COMMENT ON COLUMN public.subjects.bibliography IS 'Lista de referencias bibliográficas (JSON array de strings)';
COMMENT ON COLUMN public.subjects.evaluation_criteria IS 'Criterios de evaluación del programa';
COMMENT ON COLUMN public.subjects.ai_extraction_id IS 'Última extracción IA asociada (referencia lógica a ai_extractions)';

-- FK opcional: solo si existe la tabla (ya creada en 7a / cloud)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_extractions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subjects_ai_extraction_id_fkey'
  ) THEN
    ALTER TABLE public.subjects
      ADD CONSTRAINT subjects_ai_extraction_id_fkey
      FOREIGN KEY (ai_extraction_id) REFERENCES public.ai_extractions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subjects_ai_extraction_id ON public.subjects(ai_extraction_id)
  WHERE ai_extraction_id IS NOT NULL;
