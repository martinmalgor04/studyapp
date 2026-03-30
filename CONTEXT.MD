# CONTEXT.md — StudyApp
> Actualizá este archivo al final de cada sesión de Cursor. Es tu punto de entrada.

---

## 🗓 Última actualización
**Fecha:** 2026-03-30  
**Actualizado por:** Cierre sesión — activar emitCompleted en updateSessionStatus [4i]

---

## 📍 Estado general del proyecto

**Stack:** Next.js 16 Full Stack + Supabase (PostgreSQL + Auth + RLS)  
**Deploy:** Vercel (producción) + Supabase Cloud  
**Versión actual:** v1.0 (~90% completada)

| Sprint | Estado | Completitud |
|--------|--------|-------------|
| Sprint 1 — Setup + Auth | ✅ | 100% |
| Sprint 2 — CRUD + Session Generator | ✅ | 100% |
| Sprint 3 — Tracking + Reschedule + Week View | ✅ | 100% |
| Sprint 4 — Free Study + Google Calendar | ✅ | 100% |
| Sprint 5 — Gamificación | ⏳ | 0% |
| Sprint 6 — Analytics + Tasks | ⏳ | 0% |

---

## 🔧 Última sesión de trabajo

**Trabajé en:** [4i] Activar `SessionEventRegistry.emitCompleted` en `updateSessionStatus`  

**Archivos tocados:**
- `src/lib/actions/sessions.ts` — `emitCompleted` en `updateSessionStatus` para el caso `COMPLETED`
- `src/lib/repositories/sessions.repository.ts` — `duration` en el select de `findSessionForStatusUpdate`

**Commit:** `adf6076`  

**Quedó a medias:** nada  

**Notas:** Se activó `emitCompleted` en `updateSessionStatus` para el caso `COMPLETED`, alineándolo con `completeSessionWithRating` que ya lo tenía. Se agregó `duration` al select de `findSessionForStatusUpdate`. Cierra Sprint 4 y la integración bidireccional con Google Calendar.

---

## ✅ Próxima tarea

### [5a] Streaks calculator — Sprint 5 (UC-013)
**Archivos principales:** `src/lib/services/` (cálculo de rachas + persistencia en `user_stats`), enganche al completar sesión (p. ej. `sessions.ts` o flujo de eventos existente)  
**Estimación:** 4h  
**Prioridad:** Alta (entrada Sprint 5)  
**Estado backend:** pendiente · **Estado UI:** N/A

**Qué hacer:**
- Implementar reglas UC-013: racha = días consecutivos con al menos 1 sesión completada; reset si hay un día sin completar; actualizar `current_streak`, `longest_streak`, `last_activity_date` en `user_stats`.
- Sin UI en esta sub-tarea (5e cubre Gamification UI); foco en servicio puro + mutación/upsert seguro con RLS.
- Dependencias del backlog: ninguna (5b en adelante apoyan en 5a).

**Prompt sugerido para Cursor:**

```text
/ship 5a

Implementá [5a] Streaks calculator (UC-013): servicio en lib/services/ que calcule racha al completar sesión, persista en user_stats (current_streak, longest_streak, last_activity_date) según reglas de UC-013 en docs/spec-kit/05-use-cases.md (Track Streaks). Integrá el enganche donde ya se confirma COMPLETED sin duplicar lógica. Al final: pnpm typecheck && pnpm build.
```

**Uso:** `/ship 5a`

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

### Sprint 5 — Gamificación (próxima: 5a)

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| **5a** | **Streaks calculator** | **4h** | **Ninguna ← próxima tarea** |
| 5b | Points system | 3h | Requiere: 5a |
| 5c | Levels per subject | 5h | Ninguna (paralelo con 5b) |
| 5d | Achievements system | 6h | Requiere: 5a + 5b |
| 5e | Gamification UI | 8h | Requiere: 5a + 5b + 5c + 5d |

### Sprint 6 — Analytics + Tasks

| Sub-sprint | Tarea | Tiempo | Dependencias |
|-----------|-------|--------|-------------|
| 6a | E2E tests UC-008/009 | 9h | UC-008 + UC-009 ✅ |
| 6b | Analytics calculator | 6h | Session Tracking + Gamification UI |
| 6c | Analytics Dashboard UI | 10h | Requiere: 6b |
| 6d | Tasks CRUD (TPs) | 5h | CRUD Subjects ✅ |
| 6e | Task tracking | 3h | Requiere: 6d |
| 6f | Telegram Notifications | 7h | Notifications module ✅ |

### Extras

| Sub-sprint | Tarea | Tiempo |
|-----------|-------|--------|
| Ex | Sentry error tracking | 2h |
| Ex | Vercel Analytics | 1h |
| Ex | Dark Mode | 6h |
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

Para ejecutar tareas usá: `/ship [sub-sprint]` (ej: `/ship 5a`, `/ship 4f`)

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