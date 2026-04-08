// ---------------------------------------------------------------------------
// AI Extraction Prompts — Prompt engineering para extracción de PDFs
// universitarios argentinos. Exporta system prompt, user prompt y JSON schema.
// ---------------------------------------------------------------------------

/**
 * System prompt que define el rol, contexto y reglas de extracción para
 * documentos académicos universitarios argentinos.
 */
export function getExtractionSystemPrompt(): string {
  return `Sos un asistente especializado en analizar documentos académicos de universidades argentinas.
Tu tarea es extraer información estructurada de planificaciones de cátedra y programas de materia.

## Contexto
Trabajás para una aplicación de estudio que genera sesiones de repaso automáticas basadas en repetición espaciada. La información que extraés se usa para crear un plan de estudio personalizado. Es crucial que la extracción sea precisa y completa.

## Tipos de Documento

Clasificá el documento en una de estas categorías:

- **PLANIFICACION**: Contiene un cronograma con fechas de clases específicas (semana a semana o día a día), además de contenidos/unidades. Suele incluir fechas de parciales y actividades por semana.
- **PROGRAMA**: Solo contiene el listado de unidades temáticas y sus contenidos, sin cronograma ni fechas específicas. Es el programa formal de la materia.
- **UNKNOWN**: No podés determinar qué tipo de documento es, o no es un documento académico relevante.

### Heurística para clasificar
- Si tiene fechas de clase específicas (ej: "Semana 1: 12/03 – Introducción", "Clase 1 – 15/03") → PLANIFICACION
- Si tiene solo títulos de unidades con contenidos pero sin fechas → PROGRAMA
- Si no podés determinar con certeza → UNKNOWN

## Qué Extraer

### 1. Metadata de la materia (subjectMetadata)
- Nombre de la materia
- Año y cuatrimestre/semestre
- Carga horaria total y semanal
- Descripción o fundamentación
- Docentes/profesores
- Bibliografía
- Criterios de evaluación

### 2. Unidades temáticas (units)
- Número de unidad (empezando desde 1)
- Nombre/título de la unidad
- Lista de subtemas/contenidos (como strings planos, no objetos)
- Horas teóricas, prácticas y totales (si están disponibles)

### 3. Cronograma (schedule) — solo para PLANIFICACION
- Fecha o rango de semana de cada entrada
- Tema/actividad correspondiente
- Tipo: CLASS (clase teórica o práctica), EXAM (parcial/examen), RECOVERY (recuperatorio), HOLIDAY (feriado/receso)

### 4. Exámenes (exams)
- Nombre del examen (ej: "1er Parcial", "Final")
- Fecha (si está disponible)
- Números de unidades incluidas
- Tipo: PARCIAL, RECUPERATORIO, FINAL
- Si un parcial o recuperatorio figura en el **cronograma (schedule)** con fecha, replicá esa misma fecha en el objeto correspondiente dentro de **exams[].date** (además de la entrada en schedule), para que evaluación y agenda queden alineadas.

## Estimación de Horas

Si las horas por unidad NO están explícitas en el documento, estimá así:

1. **Si hay cronograma**: Contá cuántas clases/semanas se asignan a cada unidad y multiplicá por las horas semanales de clase.
   Ejemplo: materia de 4hs semanales, Unidad 1 abarca 2 semanas → hoursTotal = 8

2. **Si no hay cronograma**: Estimá según la complejidad relativa de cada unidad comparada con las demás.
   - Unidad con muchos subtemas → más horas en total, pero **no** asignes horas teóricas infladas por cada bullet suelto; si hay carga horaria total de la materia, distribuí **proporcionalmente** entre unidades.
   - Listados muy largos de subtemas bajo una unidad suelen ser el programa ítem por ítem; preferí **hoursTotal** razonable por unidad (p. ej. proporcional a la carga horaria total declarada) antes que multiplicar 1.5h × cantidad de líneas.

## Formato de Salida

Respondé ÚNICAMENTE con un JSON válido que siga exactamente el schema proporcionado en el mensaje del usuario. No agregues texto antes ni después del JSON. No uses markdown code fences.

## Reglas Importantes

- Extraé TODA la información disponible; no resumas ni omitas subtemas
- Mantené los nombres de unidades y temas tal como aparecen en el documento
- Las fechas deben estar en formato DD/MM/YYYY cuando sea posible
- Si un campo no tiene información disponible, omitilo del JSON (no pongas strings vacíos ni valores inventados)
- Los números de unidad deben ser enteros consecutivos empezando desde 1
- Los subtopics deben ser una lista plana de strings, no objetos anidados
- Si hay bibliografía, incluí cada referencia como un string independiente en el array`;
}

/**
 * User prompt con instrucciones concretas e inline JSON schema.
 */
export function getExtractionUserPrompt(): string {
  const schema = getExtractionJsonSchema();
  return `Analizá el documento adjunto y extraé la información en formato JSON según el schema proporcionado.

JSON Schema:
${JSON.stringify(schema, null, 2)}`;
}

/**
 * JSON Schema (draft-07) que describe la estructura esperada de la extracción.
 * Matchea exactamente con RawExtraction de types.ts.
 */
export function getExtractionJsonSchema(): object {
  return {
    type: 'object',
    required: ['documentType', 'subjectMetadata', 'units'],
    properties: {
      documentType: {
        type: 'string',
        enum: ['PLANIFICACION', 'PROGRAMA', 'UNKNOWN'],
        description: 'Tipo de documento analizado',
      },
      subjectMetadata: {
        type: 'object',
        description: 'Metadata de la materia',
        properties: {
          name: { type: 'string', description: 'Nombre de la materia' },
          year: { type: 'integer', description: 'Año lectivo (ej: 2026)' },
          semester: {
            type: 'string',
            description:
              'Cuatrimestre o semestre (ej: "1er cuatrimestre", "2do semestre")',
          },
          totalHours: {
            type: 'number',
            description: 'Carga horaria total de la materia en horas',
          },
          weeklyHours: {
            type: 'number',
            description: 'Horas semanales de cursada',
          },
          description: {
            type: 'string',
            description: 'Descripción o fundamentación de la materia',
          },
          professors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de docentes/profesores',
          },
          bibliography: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de libros/referencias bibliográficas',
          },
          evaluationCriteria: {
            type: 'string',
            description: 'Criterios y modalidad de evaluación',
          },
        },
      },
      units: {
        type: 'array',
        description: 'Unidades temáticas de la materia',
        items: {
          type: 'object',
          required: ['number', 'name', 'subtopics'],
          properties: {
            number: {
              type: 'integer',
              description: 'Número de unidad (empezando desde 1)',
            },
            name: {
              type: 'string',
              description: 'Nombre/título de la unidad',
            },
            subtopics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista de subtemas/contenidos de la unidad',
            },
            hoursTheory: {
              type: 'number',
              description: 'Horas teóricas de la unidad',
            },
            hoursPractice: {
              type: 'number',
              description: 'Horas prácticas de la unidad',
            },
            hoursTotal: {
              type: 'number',
              description: 'Horas totales de la unidad',
            },
          },
        },
      },
      schedule: {
        type: 'array',
        description: 'Cronograma de clases (solo para PLANIFICACION)',
        items: {
          type: 'object',
          required: ['topic', 'type'],
          properties: {
            date: {
              type: 'string',
              description: 'Fecha en formato DD/MM/YYYY',
            },
            weekRange: {
              type: 'string',
              description: 'Rango de semana (ej: "12/03 – 16/03")',
            },
            topic: {
              type: 'string',
              description: 'Tema o actividad de la clase',
            },
            type: {
              type: 'string',
              enum: ['CLASS', 'EXAM', 'RECOVERY', 'HOLIDAY'],
              description: 'Tipo de entrada del cronograma',
            },
          },
        },
      },
      exams: {
        type: 'array',
        description: 'Exámenes/parciales de la materia',
        items: {
          type: 'object',
          required: ['name', 'unitsIncluded', 'type'],
          properties: {
            name: {
              type: 'string',
              description: 'Nombre del examen (ej: "1er Parcial")',
            },
            date: {
              type: 'string',
              description: 'Fecha del examen en formato DD/MM/YYYY',
            },
            unitsIncluded: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Números de unidades incluidas en el examen',
            },
            type: {
              type: 'string',
              enum: ['PARCIAL', 'RECUPERATORIO', 'FINAL'],
              description: 'Tipo de examen',
            },
          },
        },
      },
    },
  };
}
