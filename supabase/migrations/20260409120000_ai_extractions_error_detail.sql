-- SA-102: persistencia estructurada de errores de IA + flag de agrupación con IA
ALTER TABLE public.ai_extractions
  ADD COLUMN IF NOT EXISTS error_detail jsonb NULL,
  ADD COLUMN IF NOT EXISTS grouping_used_ai boolean NULL;

COMMENT ON COLUMN public.ai_extractions.error_detail IS
  'Detalle estructurado del fallo (fase, categoría, httpStatus, modelos, intentos, fallback).';
COMMENT ON COLUMN public.ai_extractions.grouping_used_ai IS
  'true si la agrupación de temas usó respuestas de IA; false si solo determinista.';
