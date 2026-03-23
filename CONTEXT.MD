# CONTEXT.md — StudyApp
> Actualizá este archivo al final de cada sesión de Cursor. Es tu punto de entrada.

---

## 🗓 Última actualización
**Fecha:** 2026-03-21  
**Actualizado por:** [vos, al retomar]

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
| Sprint 4 — Free Study + Google Calendar | ✅ | ~90% |
| Sprint 5 — Gamificación | ⏳ | 0% |
| Sprint 6 — Analytics + Tasks | ⏳ | 0% |

---

## 🔧 Última sesión de trabajo

**Trabajé en:** [completar al cerrar sesión]  
**Archivos tocados:** [completar al cerrar sesión]  
**Quedó a medias:** [completar al cerrar sesión, o "nada"]  
**Notas:** [algo que el AI hizo distinto a lo esperado, decisiones tomadas]

---

## ✅ Próxima tarea (la de HOY)

### UC-011c — Badges de conflicto en UI de sesiones
**Estimación:** 3h  
**Prioridad:** 🟠 Media  
**Estado del backend:** ✅ Funciona — el campo `adjusted_for_conflict` ya existe en la tabla `sessions`

**Qué hacer:**
- Mostrar un badge/indicador visual en `session-card.tsx` cuando `adjusted_for_conflict === true`
- Archivo principal: `src/components/features/sessions/session-card.tsx`
- El dato ya llega desde `getDashboardData()` en `src/lib/actions/dashboard.ts`
- No hay que tocar la DB ni el backend

**Prompt sugerido para Cursor:**
```
Leé CONTEXT.md. Vamos a trabajar en UC-011c: agregar un badge visual en session-card.tsx 
cuando adjusted_for_conflict sea true. El backend ya funciona, solo es UI. 
No toques nada fuera de src/components/features/sessions/.
```

---

## 📋 Backlog ordenado (próximas tareas después de la de hoy)

| # | Tarea | Archivo/Área | Tiempo | Notas |
|---|-------|-------------|--------|-------|
| 1 | ✅ UC-011c — Badges conflicto UI | `session-card.tsx` | 3h | ← ESTA |
| 2 | Activar `SessionEventRegistry.emitCompleted` | `src/lib/actions/sessions.ts` | 30 min | Solo descomentar + agregar `topic_id` al select |
| 3 | UC-011b — Preview Dialog antes de importar disponibilidad | `src/components/features/calendar/` | 2-3h | Backend OK, falta UI de confirmación |
| 4 | Sprint 5 — Streaks calculator | `src/lib/services/` + nueva tabla | 4h | Primer ítem de gamificación |
| 5 | Sprint 5 — Points system | `src/lib/services/` | 3h | Después de streaks |
| 6 | Sprint 5 — Achievements system | `src/lib/services/` + UI | 6h | Depende de streaks + points |
| 7 | Página `/dashboard/notifications` | `src/app/(dashboard)/notifications/` | 3-4h | Lista completa + "marcar todas leídas" |
| 8 | Sesión parcial (tiempo restante) | `session-card.tsx` | 2-3h | TODO existente en el archivo |
| 9 | E2E tests UC-008 y UC-009 | `tests/` | 8-10h | Solo hay E2E hasta UC-007 |
| 10 | Telegram Notifications | `src/lib/services/notifications/` | 6-8h | Canal implementado, falta bot |

---

## ⚠️ NO TOCAR sin leer esto primero

### 1. `SessionEventRegistry.emitCompleted` — está comentado a propósito
**Dónde:** `src/lib/actions/sessions.ts` → funciones `completeSessionWithRating` y `updateSessionStatus`  
**Por qué:** El handler `GoogleCalendarEventHandler` está registrado pero el `topic_id` no está en el select actual.  
**Cuándo activar:** Tarea #2 del backlog. Requiere agregar `topic_id` al select primero.

### 2. Google Calendar tokens — helper deduplicado
**Dónde:** Existe un helper centralizado para tokens de Google Calendar.  
**Regla:** No crear nuevas funciones de refresh/validación de tokens. Usar el helper existente.

### 3. `notifications.ts` — tiene `createClient() as any`
**Estado:** Deuda técnica conocida. No es un bug activo.  
**Solución futura:** Reemplazar con `createClient<Database>()` tipado. Pero no hacerlo en medio de otra tarea.

---

## 🗺 Mapa rápido del código (dónde está qué)

```
src/
├── app/(dashboard)/          → Páginas protegidas (rutas)
├── components/features/      → UI por dominio (sessions/, subjects/, exams/, etc.)
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

Pegá esto al inicio de sesiones importantes:

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