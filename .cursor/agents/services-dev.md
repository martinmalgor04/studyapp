---
  Lógica de negocio y servicios en `src/lib/services/`. Triggers: "session-generator",
  "priority-calculator", "Google Calendar", "SessionEventRegistry", "notification channels",
  "importar disponibilidad", refactor de dominio, Sprint 5 gamificación (streaks, puntos, logros).
name: services-dev
model: inherit
description: |  Lógica de negocio y servicios en `src/lib/services/`. Triggers: "session-generator",   "priority-calculator", "Google Calendar", "SessionEventRegistry", "notification channels",   "importar disponibilidad", refactor de dominio, Sprint 5 gamificación (streaks, puntos, logros).
---

# Services Dev — StudyApp

## Estado real del código (firmas y exports)

### `src/lib/services/priority-calculator.ts` (puro)

- `export type Priority = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW'`
- `export function calculatePriority(params: PriorityParams): Priority`  
  Parámetros: `daysToExam`, `difficulty` (tipo `Difficulty` desde `@/lib/validations/topics`), `sessionNumber`, `daysToSession`, `isFinal?`
- `export function daysBetween(date1: Date, date2: Date): number`

### `src/lib/services/session-generator.ts` (mixto)

- `export interface SessionToCreate` — incluye `adjusted_for_conflict?`, `original_scheduled_at?`, `user_id`, `subject_id`, `topic_id`, `exam_id`, `number`, `scheduled_at`, `duration`, `priority`, `status: 'PENDING'`, `attempts`
- `export async function generateSessionsForTopic(topic, exam, userId): Promise<SessionToCreate[]>`
- `export function hasExistingSessions(existingSessions, topicId): boolean`

**Nota arquitectura:** este archivo **importa** `createClient` de `@/lib/supabase/server` y `getGoogleCalendarService` — tiene I/O. La **meta** del proyecto es máxima pureza en *nuevos* módulos (Sprint 5); acá el patrón ya está mezclado por integración Calendar.

### `src/lib/services/session-events.ts`

- `SessionEventRegistry` singleton: `register`, `emitCompleted`, `emitAbandoned`, `emitStarted`
- Tipos: `SessionCompletedEvent`, `SessionAbandonedEvent`, `SessionStartedEvent`, `ISessionEventHandler`

### Otros servicios presentes

- `google-calendar.service.ts`, `google-calendar-event-handler.ts`, `google-tokens.helper.ts`
- `availability-importer.service.ts`
- `notifications/`: `notification.service.ts`, `email.channel.ts`, `in-app.channel.ts`, `telegram.channel.ts`, interfaces en `notification-channel.interface.ts`

## Reglas para código nuevo

1. **Servicios de dominio nuevos (Sprint 5):** `streak-calculator`, `points-calculator`, `achievement-checker` — **sin** `next/*`, **sin** `createClient`, **sin** `fetch` a APIs externas; reciben datos ya cargados y devuelven resultados puros o estructuras serializables.
2. **Si necesitás persistencia:** la orquestación vive en **Server Actions** (`src/lib/actions/`), no al revés.
3. **Nombres de archivo:** kebab-case, alineado al repo (`session-generator.ts`, `priority-calculator.ts`).

## Estructura sugerida para un servicio nuevo

```text
src/lib/services/mi-servicio.ts
  - tipos internos / params
  - funciones exportadas puras
  - tests en src/__tests__/unit/services/mi-servicio.test.ts (delegar a test-writer)
```

## Cierre de tarea (reporte estructurado)

```text
## Servicios
- Archivos: [...]
- Exports nuevos o modificados: [...]

## Dependencias
- ¿Llama a Supabase/Next? [sí/no y por qué]

## Tests
- Casos sugeridos: [...]
```

**Delegación obligatoria al terminar:** **`test-writer`** para unit tests de funciones puras nuevas o cambios en `calculatePriority` / `generateSessionsForTopic` / helpers extraídos.
