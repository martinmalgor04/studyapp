# CONTEXT.md — StudyApp
> Actualizá este archivo al final de cada sesión de Cursor. Es tu punto de entrada.

---

## 🗓 Última actualización
**Fecha:** 2026-04-04  
**Actualizado por:** Cierre sesión — Sprint 7 **[7i]** Paridad PDF/IA — Wizard «Nueva materia» (dashboard), commit `0fd8ff2`

---

## 📍 Estado general del proyecto

**Stack:** Next.js 16 Full Stack + Supabase (PostgreSQL + Auth + RLS)  
**Deploy:** Vercel (producción) + Supabase Cloud  
**Versión actual:** v1.0 (~95% completada)

| Sprint | Estado | Completitud |
|--------|--------|-------------|
| Sprint 1 — Setup + Auth | ✅ | 100% |
| Sprint 2 — CRUD + Session Generator | ✅ | 100% |
| Sprint 3 — Tracking + Reschedule + Week View | ✅ | 100% |
| Sprint 4 — Free Study + Google Calendar | ✅ | 100% |
| Sprint 5 — **Rediseño Visual The Curator** | ✅ | 100% |
| Sprint 6 — **Onboarding Inteligente** | ✅ | 100% |
| Sprint 7 — **Procesamiento IA de PDFs** | ⏳ | ~5% |
| Sprint 8 — **Dark Mode** | ✅ | 100% |
| Sprint 9 — Gamificación (ex Sprint 5) | ⏳ | 0% |
| Sprint 10 — Analytics + Tasks (ex Sprint 6) | ⏳ | 0% |

> **Plan detallado:** [`docs/spec-kit/NEW_SPRINTS_PLAN.md`](docs/spec-kit/NEW_SPRINTS_PLAN.md)

---

## 🔧 Última sesión de trabajo

**Trabajé en:** Sprint 7 — **[7i]** **Paridad PDF/IA** en el wizard **«Nueva materia»** (dashboard): `buildSubjectWizardInput` compartido entre onboarding y Nueva materia; tipos raw en `subject-wizard-types`; `toWizardModality`; PDF opcional → `pdfMetadata`.

**Archivos tocados (commit `0fd8ff2`):**
- `src/components/shared/subject-wizard/build-subject-wizard-input.ts` (nuevo)
- `src/components/shared/subject-wizard/subject-wizard-types.ts`
- `src/components/shared/subject-wizard/index.ts`
- `src/app/(auth)/onboarding/onboarding-client.tsx`
- `src/app/(dashboard)/dashboard/subjects/new/new-subject-client.tsx`
- `docs/spec-kit/09-roadmap.md`

**Commit:** `0fd8ff2`

**Quedó a medias:** nada en [7i].

**Notas:** [7i] era el último sub-sprint listado en `NEW_SPRINTS_PLAN` para Sprint 7; el siguiente paso operativo es **auditar/cerrar huecos 7a–7h** (Cloud/repo) **o** arrancar **Sprint 9 — [9a] Streaks calculator** si Sprint 7 ya está cubierto en código. Ver «Próxima tarea».

---

## ✅ Próxima tarea

**Decisión:** [7i] cerró el último sub-sprint nominal de Sprint 7 en el plan. Elegí una de las dos vías:

### Opción A — Auditar Sprint 7 (7a–7h) vs Cloud/repo

| Campo | Valor |
|--------|--------|
| **Alcance** | Checklist contra Supabase Cloud + Vercel: bucket `program-pdfs`, `ai_extractions`, RLS, actions de PDF/IA, UI de revisión, onboarding vs dashboard; cerrar gaps documentados. |
| **Estimación** | 4–8h (según hallazgos) |
| **Prioridad** | Alta si hay incoherencias en producción; si el código ya está alineado, es sobre todo verificación. |

**Prompt sugerido (Opción A):**

```text
Auditar Sprint 7 StudyApp sub-sprints 7a–7h: contrastar repo con Supabase Cloud (migraciones, bucket program-pdfs, ai_extractions, RLS) y Vercel (env IA). Listar gaps y, si hay, abrir fixes mínimos. No tocar helpers de Google Calendar ni sección NO TOCAR de CONTEXT. Al cerrar, actualizar CONTEXT + 09-roadmap si aplica.
```

### Opción B — Sprint 9 [9a] Streaks calculator

| Campo | Valor |
|--------|--------|
| **Archivo principal** | Servicios/gamificación en `src/lib/services/` (streaks), stats en DB según spec; revisar `user_stats` y acciones que actualicen rachas. |
| **Estimación** | 4h |
| **Prioridad** | Media–Alta si Sprint 7 queda verificado OK y querés avanzar gamificación. |
| **Dependencias** | Ninguna (plan NEW_SPRINTS_PLAN). |

**Prompt sugerido (Opción B):**

```text
/ship 9a

Sprint 9 — Streaks calculator: implementar cálculo de rachas según spec-kit y patrones existentes en lib/services/; tipos estrictos; tests donde ya haya Vitest para servicios. No tocar helpers de Google Calendar.
```

**Uso típico:** Opción A primero si no certificaste Cloud; Opción B si 7a–7h ya están cubiertos y querés desbloquear 9b+.

---

## 📋 Backlog ordenado por sub-sprint

### Sprint 4 — ✅ Completo

| Sub-sprint | Tarea | Tiempo | Estado |
|-----------|-------|--------|--------|
| ~~4f~~ | ~~UC-011c Badges conflicto UI~~ | ~~3h~~ | ✅ Hecho |
| ~~4g~~ | ~~Sesión parcial (tiempo restante)~~ | ~~2.5h~~ | ✅ Hecho |
| ~~4h~~ | ~~Página /dashboard/notifications~~ | ~~3.5h~~ | ✅ Hecho |
| ~~4i~~ | ~~Activar emitCompleted~~ | ~~1h~~ | ✅ Hecho (`adf6076`) |

**Nota:** Sprint 4 al 100%; última pieza fue 4i (Calendar bidireccional al completar vía `updateSessionStatus` + `completeSessionWithRating`).

### Sprint 5 — ✅ Completo (Rediseño Visual The Curator)

| Sub-sprint | Tarea | Tiempo | Estado |
|-----------|-------|--------|--------|
| ~~5a~~ | ~~Design System & Tokens~~ | ~~5h~~ | ✅ Hecho (`e934425`) |
| ~~5b~~ | ~~Tipografía & Componentes Base UI~~ | ~~8h~~ | ✅ Hecho (`e934425`) |
| ~~5c~~ | ~~Layout & Navegación (Sidebar Only)~~ | ~~6h~~ | ✅ Hecho (`e934425`) |
| ~~5d~~ | ~~Rediseño Componentes de Features~~ | ~~10h~~ | ✅ Hecho (`e934425`) |
| ~~5e~~ | ~~Forms & Dialogs Redesign~~ | ~~5h~~ | ✅ Hecho (`e934425`) |
| ~~5f~~ | ~~Pages Polish & Motivational Elements~~ | ~~6h~~ | ✅ Hecho (`e934425`) |

**Nota:** Sprint 5 al 100%; commit de cierre `e934425`.

### Sprint 8 — ✅ Completo (Dark Mode)

| Sub-sprint | Tarea | Tiempo | Estado |
|-----------|-------|--------|--------|
| ~~8a~~ | ~~Theme System~~ | ~~4h~~ | ✅ Hecho (previo a esta sesión; ya alineado Notion/código) |
| ~~8b~~ | ~~Aplicar a toda la app~~ | ~~4h~~ | ✅ Hecho (`728a32e`) |

**Nota:** Sprint 8 al 100%; [8b] cubre scrim, `color-scheme`, focos, auth, landing, settings, dialog, PDF upload UI y actualización de roadmap/plan en docs.

### Sprint 6 — Onboarding Inteligente (~50h)

| Sub-sprint | Tarea | Tiempo | Estado (repo) |
|-----------|-------|--------|---------------|
| ~~6a~~ | ~~Wizard Framework~~ | ~~4h~~ | ✅ |
| ~~6b~~ | ~~Crear Materia~~ | ~~4h~~ | ✅ |
| ~~6c~~ | ~~Horario de Cursada~~ | ~~5h~~ | ✅ |
| ~~6d~~ | ~~Panel temas manual~~ | ~~6h~~ | ✅ |
| ~~6e~~ | ~~Flujo Estudio Libre~~ | ~~4h~~ | ✅ |
| ~~6f~~ | ~~Cursada + Parciales~~ | ~~6h~~ | ✅ |
| ~~6g~~ | ~~Migración `session_type` + pre-clase en flujo cursada~~ | ~~8h~~ | ✅ (`dd853e3`) |
| ~~6h~~ | ~~Distribución temas (`topic-distributor`) en wizard cursada~~ | ~~6h~~ | ✅ (`743bf6b`) |
| ~~6i~~ | ~~Página nueva materia / CTA dashboard + copy wizard~~ | ~~4h~~ | ✅ (`3100664`) |
| ~~6j~~ | ~~Session card pre-clase + tips + filtro tipo + calendario + repo sesiones~~ | ~~3h~~ | ✅ (`3100664`) |

**Nota:** Sprint 6 al 100% en repo; Sprint 7: [7i] cerrado en `0fd8ff2`; ver **Próxima tarea** (auditoría 7a–7h o Sprint 9).

### Sprint 7 — Procesamiento IA de PDFs (~44h)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| 7a | PDF Upload Infraestructura | 4h | Sprint 6 completo |
| 7b | Abstracción IA — Strategy Pattern | 6h | Requiere: 7a |
| 7c | Prompt Engineering & Extracción | 8h | Requiere: 7b |
| 7d | Agrupación Inteligente de Topics | 5h | Requiere: 7c |
| 7e | UI Revisión de Extracción | 5h | Requiere: 7c + 7d + 6d |
| 7f | Server Action — Procesar PDF | 5h | Requiere: 7a-7d |
| 7g | Integración Onboarding + IA | 6h | Requiere: 7e + 7f |
| 7h | Metadata de Materia desde IA | 3h | Requiere: 7c + 7g |
| ~~7i~~ | ~~Paridad PDF/IA — Wizard Nueva materia (dashboard)~~ | ~~2h~~ | ✅ (`0fd8ff2`) |

**Nota:** 7i listo en repo; conviene **auditar 7a–7h** en Cloud antes de dar por cerrado el sprint operativo.

### Sprint 9 — Gamificación (ex Sprint 5, ~26h)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| 9a | Streaks calculator | 4h | Ninguna |
| 9b | Points system | 3h | Requiere: 9a |
| 9c | Levels per subject | 5h | Ninguna (paralelo con 9b) |
| 9d | Achievements system | 6h | Requiere: 9a + 9b |
| 9e | Gamification UI | 8h | Requiere: 9a-9d |

### Sprint 10 — Analytics + Tasks (ex Sprint 6, ~40h)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| 10a | E2E tests UC-008/009 | 9h | UC-008 + UC-009 ✅ |
| 10b | Analytics calculator | 6h | Session Tracking + Gamification UI |
| 10c | Analytics Dashboard UI | 10h | Requiere: 10b |
| 10d | Tasks CRUD (TPs) | 5h | CRUD Subjects ✅ |
| 10e | Task tracking | 3h | Requiere: 10d |
| 10f | Telegram Notifications | 7h | Notifications module ✅ |

### Extras

| Sub-sprint | Tarea | Tiempo |
|-----------|-------|--------|
| Ex | Sentry error tracking | 2h |
| Ex | Vercel Analytics | 1h |
| Ex | Optimistic updates | 5h |
| Ex | Keyboard shortcuts | 5h |
| Ex | Export CSV/PDF | 6h |
| Ex | Accessibility audit | 8h |

---

## ⚠️ NO TOCAR sin leer esto primero

### 1. Google Calendar tokens — helper deduplicado
**Dónde:** Existe un helper centralizado para tokens de Google Calendar.  
**Regla:** No crear nuevas funciones de refresh/validación de tokens. Usar el helper existente.

### 2. `notifications.ts` — tiene `createClient() as any`
**Estado:** Deuda técnica conocida. No es un bug activo.  
**Solución futura:** Reemplazar con `createClient<Database>()` tipado. Pero no hacerlo en medio de otra tarea.

**Resuelto (2026-03-30):** `SessionEventRegistry.emitCompleted` quedó activo en `completeSessionWithRating` y `updateSessionStatus` (COMPLETED); `findSessionForStatusUpdate` incluye los campos necesarios para el handler de Calendar.

---

## 🗺 Mapa rápido del código (dónde está qué)

```
src/
├── app/(dashboard)/          → Páginas protegidas (rutas)
│       └── dashboard/notifications/ → Lista de notificaciones (filtros, paginación server-side)
├── components/features/      → UI por dominio (sessions/, subjects/, exams/, notifications/, etc.)
├── lib/actions/              → Server Actions (mutations + queries complejas)
│   ├── sessions.ts           ← Tracking, reschedule, complete
│   ├── subjects.ts           ← CRUD materias
│   ├── exams.ts              ← CRUD exámenes + convertTopicsToFinal
│   ├── topics.ts             ← CRUD temas + trigger generateSessions
│   ├── dashboard.ts          ← getDashboardData() (facade de 4 queries)
│   └── notifications.ts      ← Notificaciones (email implementado)
├── lib/services/             → Lógica de negocio pura (sin Next.js ni Supabase)
│   ├── session-generator.ts  ← Algoritmo spaced repetition
│   ├── topic-distributor.ts  ← Temas ↔ fechas de clase (wizard cursada)
│   ├── priority-calculator.ts← Scoring de prioridad (función pura)
│   ├── slot-finder.ts        ← Busca slots libres en disponibilidad
│   └── [google-calendar-*]   ← Servicios de Calendar
├── lib/validations/          → Schemas Zod por entidad
└── supabase/migrations/      → SQL canónico (source of truth del schema)
```

---

## 🧠 Decisiones de arquitectura ya tomadas (no reabrir)

| Decisión | Por qué |
|----------|---------|
| Next.js Full Stack (no NestJS) | Menos overhead, Server Actions cubren el 90% |
| Supabase Client nativo (no Prisma) | Auth incluido, RLS nativo, tipos autogenerados |
| Server Actions (no REST API) | Type-safe, sin boilerplate HTTP |
| Programación funcional (no clases) | LSP/herencia no aplica, composición es más simple |
| Max 3 niveles de props drilling | No justifica Context API todavía |

---

## 📐 Reglas para Cursor en este proyecto

Para ejecutar tareas usá: `/ship [sub-sprint]` (ej: `/ship 6a`, `/ship 4f`)

```
Sos un asistente trabajando en StudyApp (Next.js 16 + Supabase). 
Antes de escribir código, decime en una oración qué vas a hacer y qué archivos vas a tocar.
Si necesitás tocar algo fuera del scope que te pedí, preguntame primero.
Al terminar, decime exactamente qué cambió para que pueda actualizar CONTEXT.md.
No uses `as any`. No crees helpers de Google Calendar tokens nuevos. 
Seguí los patrones existentes: Server Actions en lib/actions/, lógica pura en lib/services/.
```

---

## 🔄 Ritual de cierre de sesión (2 min)

Al terminar de trabajar, actualizá la sección "Última sesión":
1. ¿En qué trabajé?
2. ¿Qué archivos toqué?
3. ¿Quedó algo a medias?
4. ¿Cambió el orden del backlog?

Si terminaste la tarea actual, mové la tarea #2 del backlog al lugar de "Próxima tarea".
