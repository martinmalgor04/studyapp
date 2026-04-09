// ---------------------------------------------------------------------------
// AI Abstraction Layer — Types & Interfaces
// Strategy Pattern: cada provider implementa AIProvider
// ---------------------------------------------------------------------------

/** Contrato que debe cumplir cualquier provider de IA */
export interface AIProvider {
  readonly name: string

  /**
   * Envía un archivo (PDF o imagen) al modelo junto con prompts y devuelve
   * el resultado crudo de extracción.
   *
   * @param fileBuffer  Buffer del archivo subido
   * @param mimeType    MIME del archivo ("application/pdf", "image/png", etc.)
   * @param systemPrompt Instrucciones de sistema para el modelo
   * @param userPrompt   Instrucciones de usuario / pregunta concreta
   */
  extractFromPDF(
    fileBuffer: Buffer,
    mimeType: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ExtractionRawResult>
}

/** Categoría estable para persistir en `ai_extractions.error_detail` y logs. */
export type AIErrorCategory =
  | 'rate_limit'
  | 'auth'
  | 'timeout'
  | 'api'
  | 'parse'
  | 'connection'
  | 'blocked'
  | 'unknown'

/** Detalle estructurado de fallo (extracción o agrupación). */
export interface AIExtractionErrorDetail {
  phase: 'extraction' | 'grouping'
  provider: string
  category: AIErrorCategory
  model?: string
  httpStatus?: number
  /** Si hubo intento con AI_FALLBACK_MODEL tras fallar el primario. */
  fallbackFromModel?: string
  primaryAttemptError?: string
}

/** Resultado crudo devuelto por el provider */
export interface ExtractionRawResult {
  success: boolean
  data?: RawExtraction
  error?: string
  tokensUsed?: number
  model?: string
  errorDetail?: AIExtractionErrorDetail
}

/** Estructura de datos extraídos de un documento universitario */
export interface RawExtraction {
  documentType: 'PLANIFICACION' | 'PROGRAMA' | 'UNKNOWN'

  subjectMetadata: SubjectMetadata

  units: ExtractedUnit[]

  schedule?: ScheduleEntry[]

  exams?: ExtractedExam[]
}

export interface SubjectMetadata {
  name?: string
  year?: number
  semester?: string
  totalHours?: number
  weeklyHours?: number
  description?: string
  professors?: string[]
  bibliography?: string[]
  evaluationCriteria?: string
}

export interface ExtractedUnit {
  number: number
  name: string
  subtopics: string[]
  hoursTheory?: number
  hoursPractice?: number
  hoursTotal?: number
}

export interface ScheduleEntry {
  date?: string
  weekRange?: string
  topic: string
  type: 'CLASS' | 'EXAM' | 'RECOVERY' | 'HOLIDAY'
}

export interface ExtractedExam {
  name: string
  date?: string
  unitsIncluded: number[]
  type: 'PARCIAL' | 'RECUPERATORIO' | 'FINAL'
}
