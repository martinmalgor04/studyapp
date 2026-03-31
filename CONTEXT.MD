# CONTEXT.md — StudyApp
> Actualizá este archivo al final de cada sesión de Cursor. Es tu punto de entrada.

---

## 🗓 Última actualización
**Fecha:** 2026-03-31  
**Actualizado por:** Cierre sesión — Sprint 5 rediseño visual (The Curator) completo [5a–5f], commit `e934425`

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
| Sprint 6 — **Onboarding Inteligente** | ⏳ | 0% |
| Sprint 7 — **Procesamiento IA de PDFs** | ⏳ | 0% |
| Sprint 8 — **Dark Mode** | ⏳ | 0% |
| Sprint 9 — Gamificación (ex Sprint 5) | ⏳ | 0% |
| Sprint 10 — Analytics + Tasks (ex Sprint 6) | ⏳ | 0% |

> **Plan detallado:** [`docs/spec-kit/NEW_SPRINTS_PLAN.md`](docs/spec-kit/NEW_SPRINTS_PLAN.md)

---

## 🔧 Última sesión de trabajo

**Trabajé en:** Sprint 5 completo — [5a] Design System & Tokens, [5b] Tipografía & Componentes Base UI, [5c] Layout & Navegación (Sidebar Only), [5d] Rediseño Componentes de Features, [5e] Forms & Dialogs Redesign, [5f] Pages Polish & Motivational Elements (rediseño visual **The Curator**).

**Archivos tocados (consolidado):**
- `tailwind.config.ts` (nuevo) — `tailwind.config.js` (eliminado)
- `src/lib/utils/cn.ts` (nuevo)
- `src/components/ui/` — 9 componentes nuevos: `button`, `input`, `textarea`, `select`, `badge`, `card`, `dialog`, `tabs`, `skeleton`
- `src/components/layout/sidebar.tsx` (nuevo), `src/components/layout/mobile-nav.tsx` (nuevo)
- `src/components/shared/motivational-quote.tsx` (nuevo)
- `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- 31 componentes en `src/components/features/` actualizados; todas las páginas auth y dashboard
- `docs/design/DESIGN_SYSTEM.md` (nuevo), `docs/spec-kit/NEW_SPRINTS_PLAN.md` (nuevo)

**Commit:** `e934425`  

**Quedó a medias:** nada  

**Notas:** Sprint 5 cerrado al 100% (6/6 sub-sprints). Base de diseño, layout, features, formularios y pulido de páginas alineados al design system; documentación en `DESIGN_SYSTEM.md` y plan de sprints en `NEW_SPRINTS_PLAN.md`.

---

## ✅ Próxima tarea

### [6a] Wizard Framework & Gestión de Pasos — Sprint 6 (Onboarding Inteligente)
**Archivos principales:** `src/components/shared/wizard/`, `src/app/(auth)/onboarding/onboarding-client.tsx`  
**Estimación:** 4h  
**Prioridad:** Alta (entrada Sprint 6 — framework para onboarding y creación de materias)  
**Estado backend:** pendiente · **Estado UI:** pendiente

**Qué hacer:**
- Crear `Wizard` reutilizable: `steps`, `onComplete`, `initialStep`, indicador de progreso, navegación back/next, validación por paso
- Definir tipo `WizardStep` (id, title, component, validate opcional, etc.)
- Integrar en `onboarding-client.tsx` manteniendo la lógica actual del paso de disponibilidad
- Ver spec completa en `docs/spec-kit/NEW_SPRINTS_PLAN.md` → [6a]

**Prompt sugerido para Cursor:**

```text
/ship 6a

Implementá [6a] Wizard Framework & Gestión de Pasos: componente Wizard reutilizable en src/components/shared/wizard/, tipos WizardStep, integración en onboarding-client.tsx sin romper el flujo actual. Ver docs/spec-kit/NEW_SPRINTS_PLAN.md. Al final: pnpm typecheck && pnpm build.
```

**Uso:** `/ship 6a`

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

### Sprint 6 — Onboarding Inteligente (~50h)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| **6a** | **Wizard Framework & Gestión de Pasos** | **4h** | **Sprint 5 completo ← próxima tarea** |
| 6b | Paso 2 — Crear Materia | 4h | Requiere: 6a |
| 6c | Horario de Cursada (grilla) | 5h | Requiere: 6b |
| 6d | Panel Ingreso Manual de Temas | 6h | Requiere: 6b |
| 6e | Flujo Estudio Libre | 4h | Requiere: 6b + 6d |
| 6f | Flujo Cursada — Setup Parciales | 6h | Requiere: 6c + 6d |
| 6g | Migración DB + Pre-clase Generation | 8h | Requiere: 6f |
| 6h | Distribución Inteligente Topics | 6h | Requiere: 6c + 6f + 6g |
| 6i | Página Creación Materia (Dashboard) | 4h | Requiere: 6a-6h |
| 6j | Session Card — Pre-clase + Tips | 3h | Requiere: 6g |

### Sprint 7 — Procesamiento IA de PDFs (~42h)

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

### Sprint 8 — Dark Mode (~8h)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| 8a | Theme System | 4h | Sprint 5 tokens |
| 8b | Aplicar a toda la app | 4h | Requiere: 8a |

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
