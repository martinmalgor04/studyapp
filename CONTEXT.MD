# CONTEXT.md — StudyApp
> Actualizá este archivo al final de cada sesión de Cursor. Es tu punto de entrada.

---

## 🗓 Última actualización
**Fecha:** 2026-04-04  
**Actualizado por:** Cierre sesión — Sprint 8 Dark Mode completo [8a–8b], commit `728a32e` (8b); [8a] Theme System ya estaba hecho antes de esta sesión

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
| Sprint 6 — **Onboarding Inteligente** | 🔄 | ~75% |
| Sprint 7 — **Procesamiento IA de PDFs** | ⏳ | 0% |
| Sprint 8 — **Dark Mode** | ✅ | 100% |
| Sprint 9 — Gamificación (ex Sprint 5) | ⏳ | 0% |
| Sprint 10 — Analytics + Tasks (ex Sprint 6) | ⏳ | 0% |

> **Plan detallado:** [`docs/spec-kit/NEW_SPRINTS_PLAN.md`](docs/spec-kit/NEW_SPRINTS_PLAN.md)

---

## 🔧 Última sesión de trabajo

**Trabajé en:** Sprint 8 — **Dark Mode** al 100%. [8a] **Theme System** ya estaba hecho en Notion/código antes de esta sesión. [8b] **Aplicar a toda la app** en esta entrega: scrim/overlay, `color-scheme`, estilos de foco, pantallas auth, landing, settings (general + availability), `Dialog`, componentes compartidos; docs `09-roadmap` y `NEW_SPRINTS_PLAN`.

**Archivos tocados (commit `728a32e`):**
- `docs/spec-kit/09-roadmap.md`, `docs/spec-kit/NEW_SPRINTS_PLAN.md`
- `src/app/globals.css`, `src/app/page.tsx`
- `src/app/(dashboard)/dashboard/settings/page.tsx`, `src/app/(dashboard)/dashboard/settings/availability/page.tsx`
- `tailwind.config.ts`
- `src/components/ui/dialog.tsx`
- `src/components/features/auth/login-form.tsx`, `register-form.tsx`, `google-auth-button.tsx`
- `src/components/features/availability/weekly-scheduler.tsx`
- `src/components/shared/pdf-upload/pdf-upload.tsx`

**Commit:** `728a32e`

**Quedó a medias:** nada

**Notas:** Sprint 8 cerrado (2/2 sub-sprints); cierre operativo de dark mode en flujos y docs de planificación.

---

## ✅ Próxima tarea

### [6g] + [6h] — Integrar pre-clase y distribución de temas (Sprint 6)

**Hecho en código (ya no es 6a):** `src/components/shared/wizard/`, `subject-wizard/*`, `onboarding-client.tsx`, `dashboard/subjects/new/new-subject-client.tsx`, `lib/actions/onboarding-wizard.ts` — flujos LIBRE y CURSANDO + PDF opcional. **[6j]** parcial: `session-card.tsx` ya distingue `PRE_CLASS` y muestra tip.

**Pendiente (por eso Notion ≠ CONTEXT):**
- **[6g]** `pre-class-generator.ts` existe pero **no se llama** desde actions/onboarding; tipos TS incluyen `session_type` — **no hay migración en `supabase/migrations/`** que agregue enum/columna (revisar paridad con Supabase Cloud y añadir migración idempotente si falta en repo).
- **[6h]** `topic-distributor.ts` existe pero **sin imports** en el flujo; no asigna temas a fechas de clase al completar el wizard cursada.

**Prompt sugerido:**

```text
/ship 6g

Integrar generatePreClassSessions tras alta cursada/onboarding según NEW_SPRINTS_PLAN; migración session_type si aplica; tests/build.
```

**Uso:** `/ship 6g` (luego `/ship 6h` para cablear `distributeTopics`).

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
| **6g** | **Migración `session_type` + pre-clase en flujo** | **8h** | 🔄 servicio sin integrar; migración en repo por verificar |
| **6h** | **Distribución temas (`topic-distributor`)** | **6h** | 🔄 sin cablear al wizard |
| ~~6i~~ | ~~Página nueva materia (dashboard)~~ | ~~4h~~ | ✅ |
| 6j | Session Card pre-clase + tips | 3h | 🟡 UI lista; datos cuando 6g genere `PRE_CLASS` |

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
| 7i | Paridad PDF/IA — Wizard Nueva materia (dashboard) | 2h | Requiere: 7g |

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
