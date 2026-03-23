# Plan de Refactorización: Arquitectura de Capas Modular

> **Prioridad absoluta**: TODO DEBE FUNCIONAR después de cada fase.  
> Cada fase termina con `pnpm build` exitoso + tests pasando.  
> Si algo se rompe, se arregla ANTES de seguir.

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Mapa de Dependencias Actual](#2-mapa-de-dependencias-actual)
3. [Estructura Objetivo](#3-estructura-objetivo)
4. [Fases de Migración](#4-fases-de-migración)
5. [Fase 0: Preparación](#fase-0-preparación-sin-cambio-funcional)
6. [Fase 1: Capa de Repositorios](#fase-1-capa-de-repositorios)
7. [Fase 2: Purificar Servicios](#fase-2-purificar-servicios-de-dominio)
8. [Fase 3: Adelgazar Server Actions](#fase-3-adelgazar-server-actions)
9. [Fase 4: Migrar Páginas a RSC](#fase-4-migrar-páginas-a-rsc)
10. [Fase 5: Limpieza y Aliases](#fase-5-limpieza-y-aliases)
11. [Checklist de Verificación por Fase](#checklist-de-verificación-por-fase)
12. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## 1. Resumen Ejecutivo

### Problema

La aplicación tiene **11 archivos de Server Actions** y **7 archivos de Services** todos sueltos en carpetas planas. Las Actions son "obesas" (manejan auth + validación + lógica + queries DB), los Services dependen directamente de Supabase, y varias páginas cargan datos en el cliente con `useEffect` en vez de usar React Server Components.

### Solución

Migrar a una **arquitectura de 4 capas por módulos de negocio**, manteniendo todo funcional en cada paso:

```
Presentación → Aplicación → Dominio → Infraestructura
  (Pages)      (Actions)   (Services)  (Repositories)
```

### Módulos de Negocio Identificados

| Módulo | Actions | Services | Validations | Componentes |
|--------|---------|----------|-------------|-------------|
| **subjects** | `subjects.ts` | — | `subjects.ts` | `features/subjects/*` |
| **exams** | `exams.ts` | — | `exams.ts` | `features/exams/*` |
| **topics** | `topics.ts` | — | `topics.ts` | `features/topics/*` |
| **sessions** | `sessions.ts` | `session-generator.ts`, `priority-calculator.ts`, `session-events.ts` | `sessions.ts` | `features/sessions/*` |
| **dashboard** | `dashboard.ts` | — | — | `features/dashboard/*` |
| **notifications** | `notifications.ts` | `notification.service.ts`, `channels/*` | — | `features/notifications/*` |
| **availability** | `availability.ts` | `availability-importer.service.ts` | `availability.ts` | `features/availability/*` |
| **google-calendar** | `google-calendar.ts` | `google-calendar.service.ts`, `google-calendar-event-handler.ts`, `google-tokens.helper.ts` | — | — |
| **auth** | `auth.ts` | — | — | `features/auth/*` |
| **profile** | `profile.ts` | — | — | — |
| **onboarding** | `onboarding.ts` | — | — | — |

---

## 2. Mapa de Dependencias Actual

### 2.1. Server Actions → Supabase (Acoplamiento Directo)

Cada Server Action crea su propio `createClient()` y hace queries directas:

```
actions/subjects.ts     → supabase.from('subjects')...
actions/exams.ts        → supabase.from('exams')... + supabase.from('topics')... + supabase.from('sessions')...
actions/topics.ts       → supabase.from('topics')... + supabase.from('subjects')... + supabase.from('exams')...
actions/sessions.ts     → supabase.from('sessions')... + supabase.from('topics')...
actions/dashboard.ts    → supabase.from('subjects')... + from('exams')... + from('topics')... + from('sessions')...
actions/notifications.ts→ supabase.from('notifications')... + from('user_settings')...
actions/availability.ts → supabase.from('availability_slots')... + from('user_settings')...
actions/google-calendar.ts → supabase.from('user_settings')...
actions/profile.ts      → supabase.auth.updateUser()...
actions/auth.ts         → supabase.auth.signOut()...
actions/onboarding.ts   → supabase.from('availability_slots')... + from('user_settings')...
```

### 2.2. Services → Supabase (Acoplamiento de Dominio)

```
services/session-generator.ts        → createClient() para checkear Google Calendar tokens
services/google-calendar.service.ts  → createClient() para queries de sessions y user_settings
services/google-calendar-event-handler.ts → createClient() para query de sessions
services/google-tokens.helper.ts     → createClient() para query de user_settings
services/notification.service.ts     → createClient() para query de user_settings
services/availability-importer.service.ts → googleapis (external API, OK)
services/priority-calculator.ts      → ✅ PURO (sin dependencias de infra)
services/session-events.ts           → ✅ PURO (solo registra handlers)
```

### 2.3. Páginas → Client vs Server

| Página | Tipo | Cómo carga datos | Problema |
|--------|------|-------------------|----------|
| `dashboard/page.tsx` | RSC | Pasa `userName` a `DashboardClient` | Client Component hace `useEffect` + `getDashboardData()` |
| `dashboard/subjects/page.tsx` | `'use client'` | `useEffect` + `getSubjects()` | Todo el fetch en el cliente |
| `dashboard/subjects/[id]/page.tsx` | `'use client'` | `useEffect` + múltiples fetches | Todo el fetch en el cliente |
| `dashboard/sessions/page.tsx` | RSC | Pasa `userId` a `SessionsClient` | Client Component hace `useEffect` |
| `dashboard/settings/page.tsx` | `'use client'` | `useEffect` + `getUserSettings()` | Todo en el cliente |
| `dashboard/settings/availability/page.tsx` | por verificar | — | — |
| `dashboard/profile/page.tsx` | por verificar | — | — |

### 2.4. Cross-Module Dependencies (Cruciales)

Estas son las dependencias cruzadas que debemos respetar:

```
topics.ts (action)
  └── llama a sessions.generateSessions() al crear topic
  └── llama a notifications.sendNotification() al crear topic

exams.ts (action)
  └── convertTopicsToFinal() llama a sessions.generateSessions()

sessions.ts (action)
  └── rescheduleSession() llama a notifications.sendNotification()
  └── processOverdueSessions() llama a notifications.sendNotification()
  └── completeSessionWithRating() llama a SessionEventRegistry.emitCompleted()
  └── deleteSession() llama a google-calendar.service.deleteEvent()
  └── generateSessions() llama a session-generator.generateSessionsForTopic()
  └── generateSessions() llama a google-calendar.service.syncSessions()

session-generator.ts (service)
  └── llama a google-calendar.service.checkConflicts()
  └── llama a google-calendar.service.isConnected()

dashboard/layout.tsx
  └── import dinámico de sessions.processOverdueSessions()

session-events.ts
  └── registra google-calendar-event-handler como handler
```

---

## 3. Estructura Objetivo

```
src/
├── app/                              # CAPA DE PRESENTACIÓN (Pages)
│   ├── (auth)/                       # (sin cambios)
│   └── (dashboard)/
│       └── dashboard/
│           ├── page.tsx              # RSC: fetch datos + render DashboardClient
│           ├── dashboard-client.tsx  # Client Component puro (recibe props)
│           ├── subjects/
│           │   ├── page.tsx          # RSC: fetch subjects server-side
│           │   └── [id]/page.tsx     # RSC: fetch subject detail server-side
│           ├── sessions/
│           │   ├── page.tsx          # RSC: fetch sessions server-side
│           │   └── sessions-client.tsx
│           └── settings/
│               ├── page.tsx          # Puede seguir client (settings son interactivas)
│               └── availability/
│
├── components/features/              # (sin cambios en estructura)
│
├── lib/
│   ├── repositories/                 # NUEVA CAPA DE INFRAESTRUCTURA
│   │   ├── subjects.repository.ts
│   │   ├── exams.repository.ts
│   │   ├── topics.repository.ts
│   │   ├── sessions.repository.ts
│   │   ├── notifications.repository.ts
│   │   ├── availability.repository.ts
│   │   ├── user-settings.repository.ts
│   │   └── index.ts                  # Re-exports
│   │
│   ├── services/                     # CAPA DE DOMINIO (purificada)
│   │   ├── session-generator.ts      # Recibe datos, no consulta DB
│   │   ├── priority-calculator.ts    # ✅ Ya es puro
│   │   ├── session-events.ts         # ✅ Ya es puro
│   │   ├── progress-calculator.ts    # NUEVO: extraer de subjects action
│   │   ├── google-calendar.service.ts# Mantiene googleapis (infra externa)
│   │   ├── google-calendar-event-handler.ts
│   │   ├── google-tokens.helper.ts   # Se simplifica (usa repository)
│   │   ├── availability-importer.service.ts  # Mantiene googleapis
│   │   └── notifications/            # (sin cambios en estructura)
│   │
│   ├── actions/                      # CAPA DE APLICACIÓN (adelgazada)
│   │   ├── subjects.ts               # Solo: auth + validate + repo/service + revalidate
│   │   ├── exams.ts
│   │   ├── topics.ts
│   │   ├── sessions.ts
│   │   ├── dashboard.ts
│   │   ├── notifications.ts
│   │   ├── availability.ts
│   │   ├── google-calendar.ts
│   │   ├── auth.ts                   # (sin cambios, ya es simple)
│   │   ├── profile.ts               # (sin cambios, ya es simple)
│   │   └── onboarding.ts
│   │
│   ├── supabase/                     # (sin cambios)
│   ├── validations/                  # (sin cambios)
│   └── utils/                        # (sin cambios)
│
├── types/                            # (sin cambios)
└── hooks/                            # (sin cambios, vacío actualmente)
```

**Decisión de diseño**: Los repositories se mantienen como archivos planos (no subcarpetas por módulo) porque el proyecto tiene ~10 tablas. Cuando crezca a 20+, se migra a subcarpetas. Mantener simple ahora.

---

## 4. Fases de Migración

| Fase | Descripción | Archivos Nuevos | Archivos Modificados | Riesgo |
|------|-------------|-----------------|---------------------|--------|
| 0 | Preparación (branch, snapshot tests) | 0 | 0 | Nulo |
| 1 | Crear Repositorios | ~8 nuevos | ~11 actions + ~3 services | Medio |
| 2 | Purificar Services | 1 nuevo | ~3 services | Bajo |
| 3 | Adelgazar Actions | 0 | ~8 actions | Medio |
| 4 | Migrar Páginas a RSC | 0 | ~5 pages | Alto |
| 5 | Limpieza final | 0 | varios | Bajo |

**Tiempo estimado total**: 12-18 horas

---

## Fase 0: Preparación (Sin cambio funcional)

### 0.1. Crear branch de refactorización

```bash
git checkout -b refactor/layered-architecture
```

### 0.2. Verificar estado base

```bash
pnpm build         # Debe pasar
pnpm test:unit     # Debe pasar (60 tests)
```

### 0.3. Crear carpeta de repositorios

```bash
mkdir -p src/lib/repositories
```

### Criterio de éxito
- [x] Branch creado
- [x] Build pasa
- [x] Tests pasan
- [x] Carpeta `repositories/` existe

---

## Fase 1: Capa de Repositorios

> **Principio**: Extraer TODA query Supabase a repositorios. Las Actions y Services solo llaman a repos.

### 1.1. `subjects.repository.ts`

**Extraer de**: `actions/subjects.ts`

```typescript
// src/lib/repositories/subjects.repository.ts
import { createClient } from '@/lib/supabase/server';

export async function findAllSubjects(options: { includeAprobadas?: boolean; isActive?: boolean }) { ... }
export async function findSubjectById(id: string) { ... }
export async function findSubjectByIdAndUserId(id: string, userId: string) { ... }
export async function insertSubject(data: { name: string; description?: string; ... ; user_id: string }) { ... }
export async function updateSubjectById(id: string, data: Partial<...>) { ... }
export async function softDeleteSubject(id: string) { ... }
export async function findSubjectsWithSessionCounts(userId: string) { ... }
```

**Queries que se mueven**:
- `getSubjects()` → query `subjects` con join a `sessions`
- `getSubject(id)` → query `subjects` por id
- `createSubject()` → insert en `subjects`
- `updateSubject()` → update en `subjects`
- `deleteSubject()` → update `is_active = false`
- `setSubjectLibre()` → update `subjects` status + update `sessions` status

**Verificación post-cambio**:
```bash
pnpm build && pnpm test:unit
# Navegar a /dashboard/subjects → CRUD completo funciona
# Navegar a /dashboard/subjects/[id] → detalle carga
```

### 1.2. `exams.repository.ts`

**Extraer de**: `actions/exams.ts`

```typescript
export async function findExamsBySubjectId(subjectId: string) { ... }
export async function findExamById(id: string) { ... }
export async function insertExam(data: { ... }) { ... }
export async function updateExamById(id: string, data: Partial<...>) { ... }
export async function deleteExamById(id: string) { ... }
export async function findExamWithOwner(id: string) { ... }  // join con subjects para verificar user_id
```

**Verificación post-cambio**:
```bash
pnpm build && pnpm test:unit
# En /dashboard/subjects/[id] → CRUD de exámenes funciona
```

### 1.3. `topics.repository.ts`

**Extraer de**: `actions/topics.ts`

```typescript
export async function findTopicsBySubjectId(subjectId: string) { ... }
export async function findTopicById(id: string) { ... }
export async function findTopicWithOwner(id: string) { ... }
export async function findTopicWithFullInfo(topicId: string, userId: string) { ... }  // para generateSessions
export async function insertTopic(data: { ... }) { ... }
export async function updateTopicById(id: string, data: Partial<...>) { ... }
export async function deleteTopicById(id: string) { ... }
export async function findTopicsBySubjectIdForConversion(subjectId: string) { ... }
export async function updateTopicForFinalConversion(topicId: string, finalExamId: string) { ... }
```

**Verificación post-cambio**:
```bash
pnpm build && pnpm test:unit
# En /dashboard/subjects/[id] → CRUD de topics funciona
# Crear topic → se generan sesiones automáticamente
```

### 1.4. `sessions.repository.ts`

**Extraer de**: `actions/sessions.ts` + `services/google-calendar.service.ts`

```typescript
export async function findUpcomingSessions(userId: string, days: number) { ... }
export async function findTodaySessions(userId: string) { ... }
export async function findSessionsBySubjectId(userId: string, subjectId: string) { ... }
export async function findSessionsByDateRange(userId: string, startDate: string, endDate: string) { ... }
export async function findSessionById(id: string, userId: string) { ... }
export async function findSessionGoogleEventId(id: string, userId: string) { ... }
export async function findOverduePendingSessions(userId: string) { ... }
export async function findPendingSessionsWithoutGoogleEvent(userId: string) { ... }  // para syncSessions
export async function insertSessions(sessions: SessionToCreate[]) { ... }
export async function updateSessionStatus(id: string, userId: string, status: string, extra?: Record<string, unknown>) { ... }
export async function updateSessionStarted(id: string, userId: string) { ... }
export async function updateSessionCompleted(id: string, userId: string, data: { ... }) { ... }
export async function updateSessionGoogleEventId(sessionId: string, eventId: string) { ... }
export async function deleteSessionById(id: string, userId: string) { ... }
export async function deleteSessionsByTopicId(topicId: string) { ... }
```

**NOTA IMPORTANTE**: Este es el repositorio más grande. Se mueve la query de `google-calendar.service.ts → syncSessions()` aquí también (la parte de DB).

**Verificación post-cambio**:
```bash
pnpm build && pnpm test:unit
# /dashboard → sesiones del día cargan
# /dashboard/sessions → lista completa funciona
# Completar sesión → status cambia
# Reagendar sesión → fecha cambia
# Eliminar sesión → desaparece + evento GCal se elimina
```

### 1.5. `notifications.repository.ts`

**Extraer de**: `actions/notifications.ts`

```typescript
export async function findNotificationsByUserId(userId: string, limit?: number) { ... }
export async function insertNotification(data: { ... }) { ... }
export async function markNotificationRead(id: string, userId: string) { ... }
export async function markAllNotificationsRead(userId: string) { ... }
```

**Verificación post-cambio**:
```bash
pnpm build
# Campana de notificaciones funciona
# Marcar como leída funciona
```

### 1.6. `user-settings.repository.ts`

**Extraer de**: `actions/notifications.ts` + `services/notification.service.ts` + `services/google-tokens.helper.ts` + `services/google-calendar.service.ts`

```typescript
export async function findUserSettings(userId: string) { ... }
export async function upsertUserSettings(userId: string, data: Partial<...>) { ... }
export async function updateUserSettings(userId: string, data: Partial<...>) { ... }
export async function findGoogleTokens(userId: string) { ... }
export async function clearGoogleTokens(userId: string) { ... }
export async function isGoogleCalendarEnabled(userId: string) { ... }
```

**NOTA**: Este repo centraliza TODAS las queries a `user_settings`, que actualmente están desperdigadas en 5+ archivos.

**Verificación post-cambio**:
```bash
pnpm build
# /dashboard/settings → carga configuración
# Google Calendar connect/disconnect funciona
# Notificaciones respetan preferencias
```

### 1.7. `availability.repository.ts`

**Extraer de**: `actions/availability.ts` + `actions/onboarding.ts`

```typescript
export async function findAvailabilityByUserId(userId: string) { ... }
export async function replaceAvailability(userId: string, slots: AvailabilitySlot[]) { ... }
export async function insertAvailabilitySlots(slots: Array<{ ... }>) { ... }
export async function deleteAvailabilityByUserId(userId: string) { ... }
```

**Verificación post-cambio**:
```bash
pnpm build
# /dashboard/settings/availability → carga y guarda slots
# Onboarding → guarda disponibilidad
```

### 1.8. `index.ts` (Re-exports)

```typescript
// src/lib/repositories/index.ts
export * from './subjects.repository';
export * from './exams.repository';
export * from './topics.repository';
export * from './sessions.repository';
export * from './notifications.repository';
export * from './user-settings.repository';
export * from './availability.repository';
```

### Estrategia de Migración para Fase 1

**IMPORTANTE**: Para cada repositorio, seguir este orden exacto:

1. **Crear el archivo del repositorio** con las funciones exportadas
2. **Modificar UNA action** para que use el repositorio en vez de queries directas
3. **`pnpm build`** → debe pasar
4. **Probar la funcionalidad manualmente** en el browser
5. **Repetir** para la siguiente action/service que usa la misma tabla

**NO migrar todo de golpe**. Ir módulo por módulo.

---

## Fase 2: Purificar Servicios de Dominio

> **Principio**: Los servicios de dominio NO deben importar `createClient()`. Reciben datos y devuelven datos.

### 2.1. `session-generator.ts` → Hacerlo puro

**Estado actual**: Importa `createClient` y `getGoogleCalendarService` internamente para verificar conflictos.

**Cambio**: La lógica de conflictos se inyecta como callback o se ejecuta en la Action.

```typescript
// ANTES (acoplado)
async function findConflictFreeSlot(userId, preferredDate, duration) {
  const supabase = await createClient();  // ← ESTO SE VA
  const { data: settings } = await supabase.from('user_settings')...
  ...
}

// DESPUÉS (puro)
export async function generateSessionsForTopic(
  topic: Topic,
  exam: Exam | null,
  userId: string,
  conflictChecker?: (date: Date, duration: number) => Promise<{ date: Date; adjusted: boolean }>
): Promise<SessionToCreate[]> {
  // La lógica de algoritmos es la misma
  // Pero conflictChecker se inyecta desde la Action
}
```

**Archivos afectados**:
- `src/lib/services/session-generator.ts` → eliminar imports de supabase y google-calendar
- `src/lib/actions/sessions.ts` → `generateSessions()` pasa el conflictChecker

**RIESGO**: Alto. Los 60 unit tests dependen de esta interfaz.

**Verificación post-cambio**:
```bash
pnpm test:unit       # 60 tests DEBEN pasar
pnpm build
# Crear un topic → sesiones se generan correctamente
# Con Google Calendar conectado → conflictos se detectan
```

### 2.2. `google-calendar.service.ts` → Separar queries de API

**Estado actual**: Hace queries a `sessions` y `user_settings` internamente.

**Cambio**: 
- `syncSessions()` recibe las sesiones como parámetro (el repo las busca en la Action)
- `isConnected()` se mueve a `user-settings.repository.ts`

```typescript
// ANTES
async syncSessions(userId: string) {
  const supabase = await createClient();
  const { data: sessions } = await supabase.from('sessions')...  // ← ESTO SE VA
  ...
}

// DESPUÉS
async syncSessions(
  sessions: SessionForSync[],
  tokens: GoogleTokens
): Promise<{ synced: number; errors: number }> {
  // Solo interactúa con Google Calendar API
  // La action se encarga de guardar los event_ids via repo
}
```

**Archivos afectados**:
- `src/lib/services/google-calendar.service.ts` → eliminar queries a DB
- `src/lib/services/google-tokens.helper.ts` → usar `user-settings.repository`
- `src/lib/services/google-calendar-event-handler.ts` → usar `sessions.repository`
- `src/lib/actions/sessions.ts` → orquestar sync
- `src/lib/actions/google-calendar.ts` → orquestar sync manual

**Verificación post-cambio**:
```bash
pnpm build
# Settings → Sync manual funciona
# Crear topic → sesiones aparecen en Google Calendar
# Completar sesión → evento GCal cambia a verde
# Abandonar sesión → evento GCal cambia a rojo
```

### 2.3. `notification.service.ts` → Usar repository

**Estado actual**: Hace query directa a `user_settings` para obtener preferencias.

**Cambio**: Recibe settings como parámetro o usa `user-settings.repository`.

```typescript
// ANTES
private async getUserSettings(userId: string) {
  const supabase = await createClient();  // ← ESTO SE VA
  ...
}

// DESPUÉS
async send(notification: NotificationPayload): Promise<void> {
  const settings = await findUserSettings(notification.userId);  // Usa repo
  ...
}
```

**Verificación post-cambio**:
```bash
pnpm build
# Crear topic → notificación aparece en campana
# Reagendar sesión → notificación se envía
```

### 2.4. Crear `progress-calculator.ts` (nuevo servicio puro)

**Extraer de**: `actions/subjects.ts` (líneas 51-73)

```typescript
// src/lib/services/progress-calculator.ts
export function calculateSubjectProgress(
  sessions: Array<{ status: string }>
): { total: number; completed: number; percentage: number } {
  const total = sessions.length;
  const completed = sessions.filter(s => s.status === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}
```

---

## Fase 3: Adelgazar Server Actions

> **Principio**: Una Action solo debe: (1) autenticar, (2) validar con Zod, (3) llamar repo/service, (4) revalidatePath.

### 3.1. Patrón objetivo para cada Action

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createSubjectSchema, type CreateSubjectInput } from '@/lib/validations/subjects';
import { insertSubject } from '@/lib/repositories/subjects.repository';

export async function createSubject(input: CreateSubjectInput) {
  // 1. Validar
  const validation = createSubjectSchema.safeParse(input);
  if (!validation.success) return { error: validation.error.errors[0].message };

  // 2. Autenticar
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // 3. Ejecutar (repo + service si hay lógica)
  const result = await insertSubject({ ...validation.data, user_id: user.id });
  if (!result) return { error: 'Error al crear la materia' };

  // 4. Revalidar caché
  revalidatePath('/dashboard/subjects');
  return { data: result };
}
```

### 3.2. Actions a adelgazar (en orden de complejidad)

| Action | Complejidad | Qué extraer |
|--------|-------------|-------------|
| `auth.ts` | ✅ Ya es simple | Nada |
| `profile.ts` | ✅ Ya es simple | Nada |
| `subjects.ts` | Baja | Queries → `subjects.repository`, progreso → `progress-calculator` |
| `exams.ts` | Media | Queries → `exams.repository`, `convertTopicsToFinal` usa repos |
| `topics.ts` | Media | Queries → `topics.repository`, verificación de ownership |
| `notifications.ts` | Baja | Queries → `notifications.repository` + `user-settings.repository` |
| `availability.ts` | Media | Queries → `availability.repository` + `user-settings.repository` |
| `onboarding.ts` | Baja | Queries → `availability.repository` + `user-settings.repository` |
| `google-calendar.ts` | Baja | Queries → `user-settings.repository` |
| `dashboard.ts` | Alta | Múltiples repos (facade pattern) |
| `sessions.ts` | Alta | Queries → `sessions.repository`, orquestación de services |

### 3.3. `sessions.ts` — El más complejo

Este archivo tiene 622 líneas y 12 funciones exportadas. Después del refactor:

```
getUpcomingSessions()       → sessionsRepo.findUpcoming(userId, days)
getTodaySessions()          → sessionsRepo.findToday(userId)
getSessionsBySubject()      → sessionsRepo.findBySubject(userId, subjectId)
getSessionsByDateRange()    → sessionsRepo.findByDateRange(userId, start, end)
updateSessionStatus()       → auth + sessionsRepo.updateStatus() + eventEmit
startSession()              → auth + sessionsRepo.updateStarted()
completeSessionWithRating() → auth + sessionsRepo.updateCompleted() + eventEmit
markSessionIncomplete()     → auth + sessionsRepo.updateStatus()
rescheduleSession()         → auth + sessionsRepo + notificationService
deleteSession()             → auth + sessionsRepo.findGoogleEventId() + delete + gcal.deleteEvent()
generateSessions()          → auth + topicsRepo + sessionsRepo.insert() + gcal.sync()
processOverdueSessions()    → auth + sessionsRepo.findOverdue() + auto-abandon + notify
```

### 3.4. `dashboard.ts` — Facade Query

**Estado actual**: 90 líneas con 4 queries paralelas y lógica de conteo.

**Después**: Usa repos y un servicio de cálculo:

```typescript
export async function getDashboardData() {
  const user = await getAuthenticatedUser();
  if (!user) return emptyDashboard;

  const [subjects, exams, topics, sessions] = await Promise.all([
    subjectsRepo.findByUserId(user.id),
    examsRepo.findBySubjectIds(subjectIds),
    topicsRepo.findBySubjectIds(subjectIds),
    sessionsRepo.findUpcoming(user.id, 30),
  ]);

  return {
    stats: calculateDashboardStats(subjects, exams, topics, sessions),
    subjects: enrichSubjectsWithCounts(subjects, exams, topics),
    topics,
    sessions,
  };
}
```

**Verificación post-cambio de cada Action**:
```bash
pnpm build
# Probar la funcionalidad específica en el browser
```

---

## Fase 4: Migrar Páginas a RSC

> **Principio**: Las páginas que solo cargan datos DEBEN ser React Server Components. Solo se marca `'use client'` la parte que necesita interactividad.

### 4.1. `subjects/page.tsx` → RSC

**Antes**: Toda la página es `'use client'` con `useEffect`.

**Después**: 
- `page.tsx` (RSC) → llama a `getSubjects()` server-side
- `subjects-page-client.tsx` (nuevo) → recibe datos como props, maneja filtros/búsqueda/dialog

```typescript
// subjects/page.tsx (RSC)
import { getSubjects } from '@/lib/actions/subjects';
import { SubjectsPageClient } from './subjects-page-client';

export default async function SubjectsPage() {
  const subjects = await getSubjects();
  return <SubjectsPageClient initialSubjects={subjects} />;
}
```

```typescript
// subjects/subjects-page-client.tsx ('use client')
// Solo maneja: searchTerm, sortBy, showAprobadas, dialog state
// Recibe initialSubjects como prop (SSR data)
```

### 4.2. `subjects/[id]/page.tsx` → RSC

**Antes**: Toda la página es `'use client'` con 4 fetches en `useEffect`.

**Después**:
- `page.tsx` (RSC) → llama a 4 actions server-side en paralelo
- `subject-detail-client.tsx` (nuevo) → recibe datos, maneja dialogs

```typescript
// subjects/[id]/page.tsx (RSC)
export default async function SubjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [subject, exams, topics, sessions] = await Promise.all([
    getSubject(id),
    getExamsBySubject(id),
    getTopicsBySubject(id),
    getSessionsBySubject(id),
  ]);

  if (!subject) return <NotFound />;

  return (
    <SubjectDetailClient
      subject={subject}
      initialExams={exams}
      initialTopics={topics}
      initialSessions={sessions}
    />
  );
}
```

### 4.3. `dashboard/page.tsx` → RSC completo

**Antes**: RSC pasa solo `userName`, luego `DashboardClient` hace `useEffect`.

**Después**: RSC hace el fetch completo y pasa todos los datos.

```typescript
// dashboard/page.tsx (RSC)
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const dashboardData = await getDashboardData();

  return (
    <DashboardClient
      userName={data.user?.user_metadata?.name || 'Usuario'}
      initialData={dashboardData}
    />
  );
}
```

### 4.4. `sessions/page.tsx` → RSC

**Antes**: RSC pasa `userId`, `SessionsClient` hace `useEffect`.

**Después**: RSC pasa datos iniciales.

```typescript
export default async function SessionsPage() {
  const sessions = await getUpcomingSessions(30);
  const subjects = await getSubjects();
  
  return <SessionsClient initialSessions={sessions} initialSubjects={subjects} />;
}
```

### 4.5. Páginas que NO cambian

- `settings/page.tsx` → Es altamente interactiva (toggles, connects), puede quedarse `'use client'`.
- `settings/availability/page.tsx` → Mismo caso.
- `profile/page.tsx` → Mismo caso.

### Patrón de "refresco" post-mutación

Cuando un Client Component muta datos (crear, editar, eliminar), tiene dos opciones para refrescar:

1. **`router.refresh()`** → Re-ejecuta el RSC padre, que re-fetchea datos
2. **`loadData()` local** → Llama la action de nuevo desde el cliente

**Recomendación**: Usar `router.refresh()` cuando el RSC padre hace el fetch. Esto es más limpio y consistente.

**Verificación post-cambio**:
```bash
pnpm build
# Cada página debe cargar sin flickeo de "Cargando..."
# El contenido debe renderizarse inmediatamente (SSR)
# Los modales/filtros/búsqueda deben seguir funcionando
```

---

## Fase 5: Limpieza y Aliases

### 5.1. Verificar que no queden `createClient()` fuera de repos

```bash
# Buscar imports de createClient fuera de repositories/
rg "createClient" src/lib/actions/ src/lib/services/
# Solo deben quedar en:
# - actions/* para auth (supabase.auth.getUser())
# - repositories/* para queries
```

**Excepción aceptable**: Las Actions necesitan `createClient()` para `supabase.auth.getUser()`. Esto es correcto porque la autenticación es parte de la capa de aplicación. Lo que NO debe estar en Actions son queries a tablas.

### 5.2. Verificar que Services no importen supabase

```bash
rg "createClient|supabase" src/lib/services/
# Solo deben quedar en:
# - google-calendar.service.ts (si aún necesita para Google API auth)
# - notification.service.ts (si usa repo ahora, no debería)
```

### 5.3. Agregar helper `getAuthenticatedUser()`

```typescript
// src/lib/utils/auth.ts
import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

Esto elimina la repetición de `createClient() + getUser()` que aparece en TODAS las actions.

### 5.4. Run final

```bash
pnpm build          # ✅
pnpm test:unit      # ✅ 60+ tests
pnpm lint           # ✅
```

---

## Checklist de Verificación por Fase

### Fase 0
- [ ] Branch `refactor/layered-architecture` creado
- [ ] `pnpm build` pasa
- [ ] `pnpm test:unit` pasa
- [ ] Carpeta `src/lib/repositories/` creada

### Fase 1 (Repositorios)
- [ ] `subjects.repository.ts` creado y actions lo usan
- [ ] `exams.repository.ts` creado y actions lo usan
- [ ] `topics.repository.ts` creado y actions lo usan
- [ ] `sessions.repository.ts` creado y actions lo usan
- [ ] `notifications.repository.ts` creado y actions lo usan
- [ ] `user-settings.repository.ts` creado y actions/services lo usan
- [ ] `availability.repository.ts` creado y actions lo usan
- [ ] `index.ts` re-exports
- [ ] `pnpm build` pasa
- [ ] `pnpm test:unit` pasa
- [ ] CRUD de Materias funciona (browser)
- [ ] CRUD de Exámenes funciona (browser)
- [ ] CRUD de Topics funciona (browser)
- [ ] Sesiones se generan al crear Topic
- [ ] Dashboard carga correctamente
- [ ] Notificaciones funcionan
- [ ] Google Calendar sync funciona
- [ ] Disponibilidad se guarda

### Fase 2 (Services puros)
- [ ] `session-generator.ts` no importa `createClient`
- [ ] `notification.service.ts` usa repository
- [ ] `google-calendar.service.ts` no hace queries DB
- [ ] `google-tokens.helper.ts` usa `user-settings.repository`
- [ ] `google-calendar-event-handler.ts` usa `sessions.repository`
- [ ] `progress-calculator.ts` creado
- [ ] `pnpm build` pasa
- [ ] `pnpm test:unit` pasa (60+ tests, posible ajuste de mocks)
- [ ] Sesiones se generan con detección de conflictos GCal
- [ ] Completar sesión emite evento → GCal se actualiza

### Fase 3 (Actions adelgazadas)
- [ ] Todas las Actions siguen el patrón: auth → validate → repo/service → revalidate
- [ ] No hay queries directas a Supabase en Actions (excepto auth.getUser)
- [ ] `dashboard.ts` usa repos + función de cálculo
- [ ] `sessions.ts` orquesta repos + services
- [ ] `pnpm build` pasa
- [ ] `pnpm test:unit` pasa

### Fase 4 (RSC)
- [ ] `subjects/page.tsx` es RSC
- [ ] `subjects/[id]/page.tsx` es RSC
- [ ] `dashboard/page.tsx` pasa datos a DashboardClient
- [ ] `sessions/page.tsx` pasa datos a SessionsClient
- [ ] No hay flickeo de "Cargando..." en carga inicial
- [ ] Filtros/búsqueda/dialogs siguen funcionando
- [ ] `pnpm build` pasa

### Fase 5 (Limpieza)
- [ ] No hay `createClient()` fuera de repos y actions (para auth)
- [ ] No hay `supabase.from()` fuera de repos
- [ ] Helper `getAuthenticatedUser()` creado y usado
- [ ] `pnpm build` pasa
- [ ] `pnpm test:unit` pasa
- [ ] `pnpm lint` pasa
- [ ] Merge a `main`

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Tests de session-generator se rompen al cambiar interfaz | Alta | Alto | Ajustar mocks para inyectar conflictChecker. Hacer los cambios incrementales. |
| RSC migration rompe interactividad (dialogs, filtros) | Media | Alto | Mantener Client Components para UI interactiva, solo mover fetch a RSC. |
| Cross-module dependencies causan circular imports | Media | Medio | Repos no importan otros repos. Actions pueden importar otros repos. |
| `processOverdueSessions` en layout deja de funcionar | Baja | Medio | Mantener el import dinámico en layout pero que use repos internamente. |
| Performance regression por más layers | Baja | Bajo | Los repos son thin wrappers, overhead negligible. |

---

## Orden de Ejecución Recomendado

```
Día 1 (4-5h):
  Fase 0 → completa
  Fase 1.1 → subjects.repository (más simple)
  Fase 1.2 → exams.repository
  Fase 1.3 → topics.repository
  
Día 2 (4-5h):
  Fase 1.4 → sessions.repository (más complejo)
  Fase 1.5 → notifications.repository
  Fase 1.6 → user-settings.repository
  Fase 1.7 → availability.repository
  
Día 3 (3-4h):
  Fase 2 → Purificar services
  Fase 3 → Adelgazar actions (las más simples primero)

Día 4 (3-4h):
  Fase 3 → Adelgazar actions (sessions.ts y dashboard.ts)
  Fase 4 → Migrar páginas a RSC
  Fase 5 → Limpieza final
```

**Total estimado**: 14-18 horas de trabajo activo.
