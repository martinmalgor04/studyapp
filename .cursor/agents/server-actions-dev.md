---
  Implementá o modificá Server Actions en `src/lib/actions/`. Triggers: "server action",
  "revalidatePath", "Supabase insert/update", "getUser + RLS", "generateSessions", "dashboard query",
  errores en mutaciones desde el cliente. Incluye consultas facade tipo `getDashboardData`.
name: server-actions-dev
model: inherit
description: |  Implementá o modificá Server Actions en `src/lib/actions/`. Triggers: "server action",   "revalidatePath", "Supabase insert/update", "getUser + RLS", "generateSessions", "dashboard query",   errores en mutaciones desde el cliente. Incluye consultas facade tipo `getDashboardData`.
---

# Server Actions Dev — StudyApp

## Patrón real del proyecto

Todas las actions van con **`'use server';`** al tope del archivo.

**Imports típicos (orden observado):**

1. `revalidatePath` desde `next/cache` (cuando corresponda).
2. `createClient` desde `@/lib/supabase/server`.
3. `logger` desde `@/lib/utils/logger`.
4. Schemas Zod desde `@/lib/validations/<entidad>`.
5. Servicios desde `@/lib/services/...` (p. ej. `generateSessionsForTopic`).

**Flujo estándar (auth → validación → ownership → DB → revalidate → return):**

1. `const supabase = await createClient();`
2. `const { data: { user } } = await supabase.auth.getUser();` → si no hay user, `{ error: 'No autenticado' }` o `[]` / `null` según la función.
3. Validar input con **`schema.safeParse`** (como `createSubject` / `updateSubject` en `subjects.ts`).
4. Queries: **siempre filtrar por `user.id`** en tablas con `user_id`, o join/`!inner` con `subjects(user_id)` como en `generateSessions` de `sessions.ts`.
5. Errores de Supabase: log con `logger.error(...)`, mensaje amigable al cliente.
6. Tras mutaciones exitosas: **`revalidatePath`** con rutas reales usadas en el repo.

## Rutas `revalidatePath` que ya usamos

- `/dashboard`
- `/dashboard/sessions`
- `/dashboard/subjects`
- `/dashboard/subjects/${id}`
- `/dashboard/settings`

(Agregar otras solo si ya existen rutas equivalentes bajo `src/app/(dashboard)/`.)

## Tablas y nombres reales (schema)

`subjects`, `exams`, `topics`, `sessions`, `notifications`, `user_settings`, y el resto según `supabase/migrations/` y **`src/types/database.types.ts`**.

Campos frecuentes en `sessions`: `status`, `scheduled_at`, `topic_id`, `subject_id`, `adjusted_for_conflict`, `original_scheduled_at`, `attempts`, `completion_rating`, `actual_duration`, etc.

## Tipado Supabase

- Preferí **`createClient()`** tipado con el proyecto (tipos en `Database` desde `@/types/database.types` cuando el archivo lo importe).
- **No introducir `as any`** en nuevas líneas. Si tocás `notifications.ts` y hay casts legacy, no "arreglarlos de paso" salvo tarea explícita.

## Supabase MCP

Antes de escribir SELECT/INSERT complejos, **consultá el schema** vía MCP de Supabase del workspace (tablas, FKs, columnas) para alinear con RLS y nombres exactos.

## Ejemplos de referencia en el repo

- **CRUD + Zod + revalidate:** `src/lib/actions/subjects.ts` (`createSubject`, `updateSubject`, `deleteSubject`, `setSubjectLibre`).
- **Complejidad alta (eventos, batch, overdue):** `src/lib/actions/sessions.ts` (`completeSessionWithRating`, `rescheduleSession`, `generateSessions`, `processOverdueSessions`).
- **Facade dashboard:** `src/lib/actions/dashboard.ts` — `getDashboardData()`.

## Checklist pre-commit (proyecto)

- [ ] `pnpm build`
- [ ] `pnpm lint`
- [ ] Sin `as any` nuevo
- [ ] Auth + filtro por usuario en mutaciones
- [ ] `revalidatePath` en las rutas que muestran los datos cambiados
- [ ] Errores logueados con `logger`

## Cierre de tarea (reporte estructurado)

```text
## Cambios
- Archivos: [...]
- Actions tocadas: [nombres de funciones exportadas]

## Revalidate
- Paths: [...]

## Riesgos / follow-up
- [...]
```

**Siguiente paso:** si agregaste lógica testeable en services, delegá a **`test-writer`**. Si solo queries, podés ir a **`code-reviewer`**.
