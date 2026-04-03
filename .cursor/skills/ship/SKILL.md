---
name: ship
description: >-
  Flujo completo de entrega end-to-end para StudyApp: fetch desde Notion por sub-sprint
  (ej: /ship 4f, /ship 5a), por sprint completo (ej: /ship sprint 5), planificación,
  delegación a agentes especializados, code review, tests, commit y cierre en Notion.
  Usar cuando el usuario escribe "/ship", "/ship [sub-sprint]", "/ship sprint [N]",
  "/ship [nombre de tarea]", "ship esta tarea", "procesá la siguiente tarea", o cualquier
  variante que implique llevar una o más tareas del backlog hasta commit confirmado.
---

# /ship — StudyApp

Flujo de entrega **end-to-end**. Llevás tareas desde Notion hasta el commit confirmado.
Soporta **tareas individuales** y **sprints completos**.
Español rioplatense siempre.

---

## MODOS DE OPERACIÓN

### Modo Tarea (default)

```
/ship 5a              → Una tarea específica por sub-sprint
/ship Streaks         → Una tarea específica por nombre
/ship                 → Lista disponibles, pregunta cuál
```

Ejecuta las **7 fases** una sola vez para esa tarea.

### Modo Sprint

```
/ship sprint 5        → Todas las tareas del Sprint 5
/ship sprint N        → Todas las tareas del Sprint N
```

Ejecuta un **loop** que procesa cada tarea del sprint en orden topológico
(respetando dependencias), corriendo las 7 fases para cada una.

**Detección automática:** si el argumento matchea `sprint N`, `Sprint N`, o solo
un número sin letra (ej: `/ship 5` donde "5" no tiene sub-sprint letter), activar
Modo Sprint. Si tiene letra (ej: `/ship 5a`), es Modo Tarea.

---

## REGLAS ABSOLUTAS (no negociables)

1. **Ejecutá las 7 fases en orden.** Nunca saltes ni colapses fases.
2. **Delegá la implementación a subagentes.** Vos NO escribís código de negocio, UI ni actions. Usás la herramienta `Task` para delegar. La única excepción es un fix trivial en la fase de verificación (un import faltante, un tipo menor).
3. **NUNCA commitees sin confirmación explícita del usuario.** En Modo Tarea: confirmación
   después de cada tarea. En Modo Sprint: **una sola confirmación al final del sprint**,
   después de completar TODAS las tareas. No hay ninguna otra parada obligatoria.
4. **Si algo falla, pará y avisá.** Nunca silencies un error.
5. **Anunciá cada fase** con el formato de banner antes de ejecutarla.
6. **En Modo Sprint, mostrá progreso** entre tareas con el banner de sprint progress.
7. **NO preguntes cosas operativas. NUNCA.** No preguntar el orden de ejecución (seguí el topológico),
   no preguntar si arrancar (arrancá), no preguntar si continuar con la siguiente tarea (continuá
   automáticamente), no preguntar estrategia de commit (está definida abajo), no preguntar si
   seguir después de completar una tarea en modo sprint (SIEMPRE seguir hasta terminar TODAS).
   **La ÚNICA parada es la confirmación del commit** (una vez por tarea en Modo Tarea, una vez
   al final en Modo Sprint). Fuera de eso, solo frenar para preguntas **técnicas, de
   implementación o de diseño** donde genuinamente necesités input del usuario para continuar.

---

## Referencia de diseño

| Documento | Contenido |
|-----------|-----------|
| `docs/design/DESIGN_SYSTEM.md` | Tokens, colores, tipografía, componentes — **fuente de verdad visual** |
| `docs/spec-kit/NEW_SPRINTS_PLAN.md` | Spec detallada por tarea de cada sprint |

Incluí siempre estos paths en el prompt de delegación cuando la tarea sea visual/UI.

---

## Cómo delegar: herramienta Task

Para delegar trabajo a un agente especializado, usá la herramienta **Task** así:

```
Task(
  subagent_type = "services-dev",      ← el agente que corresponda
  description   = "Implementar X",     ← 3-5 palabras
  prompt        = "..."                 ← prompt completo (ver template abajo)
)
```

### Routing de agentes

| Archivos a modificar | `subagent_type` |
|----------------------|-----------------|
| `src/lib/actions/*.ts` | `server-actions-dev` |
| `src/lib/services/**` | `services-dev` |
| `src/components/**`, `src/app/**/` | `ui-dev` |
| Tests (`src/__tests__/**`) | `test-writer` |
| Review de código | `code-reviewer` (readonly=true) |
| CONTEXT.MD al cerrar | `context-updater` |

### Ejecución paralela vs secuencial

- Si las subtareas tocan **archivos completamente distintos** → lanzá múltiples Task en paralelo (en un solo message).
- Si comparten archivos o una depende del output de otra → lanzá secuencialmente (esperá que termine la primera).

### Template de prompt para delegación

Siempre incluí esto en el `prompt` del Task:

```
Estás trabajando en StudyApp (Next.js 16 + Supabase).

## Tarea
[Qué tiene que hacer, en detalle]

## Contexto
[De dónde viene esta tarea, qué resuelve]

## Archivos a modificar
[Paths exactos]

## Restricciones
- Seguir patterns existentes en el repo
- NO usar `as any`
- NO crear helpers de Google Calendar tokens nuevos
- [Items relevantes de NO TOCAR de CONTEXT.MD]

## Archivos de referencia
[Paths de archivos similares en el repo para copiar el patrón]

## Output esperado
[Qué archivos deben quedar modificados/creados al terminar]
```

---

## Cómo usar Notion MCP

### Buscar tarea

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-search",
  arguments = {
    "query": "[sub-sprint o nombre de tarea]",
    "data_source_url": "collection://32a1a130-5119-800a-9aed-000bf54b3dcb",
    "filters": {},
    "page_size": 5,
    "max_highlight_length": 100
  }
)
```

### Buscar todas las tareas de un sprint

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-search",
  arguments = {
    "query": "sprint N",
    "data_source_url": "collection://32a1a130-5119-800a-9aed-000bf54b3dcb",
    "filters": {},
    "page_size": 20,
    "max_highlight_length": 100
  }
)
```

Luego filtrar resultados por sub-sprint que matchee el patrón `Na`, `Nb`, etc.
Hacer `notion-fetch` de cada página para obtener estado, dependencias y contenido.

### Leer página completa

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-fetch",
  arguments = { "id": "[page_id o URL del resultado de search]" }
)
```

### Actualizar estado de tarea

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-update-page",
  arguments = {
    "page_id": "[id de la página]",
    "command": "update_properties",
    "properties": { "Estado": "En curso" },
    "content_updates": []
  }
)
```

### Escribir contenido en la página

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-update-page",
  arguments = {
    "page_id": "[id]",
    "command": "update_content",
    "properties": {},
    "content_updates": [
      { "old_str": "[texto existente]", "new_str": "[texto nuevo]" }
    ]
  }
)
```

**Si Notion falla:** avisá pero no bloquees el flujo. Anotá qué quedó sin sincronizar.

---

## Cómo usar Supabase MCP (migraciones de DB)

Cuando una tarea involucra cambios de base de datos (nuevas tablas, columnas, RLS, enums, etc.),
usar el MCP de Supabase para aplicar las migraciones contra el **proyecto Supabase Cloud**
vinculado al workspace (mismo schema que usa la app con `NEXT_PUBLIC_SUPABASE_URL` a `*.supabase.co`).
**No** usar `supabase db reset` ni la CLI apuntando a una instancia local (`localhost:54321`).

### Verificar migraciones existentes

```
CallMcpTool(
  server   = "user-supabase",
  toolName = "list_migrations",
  arguments = {}
)
```

### Inspeccionar schema actual

```
CallMcpTool(
  server   = "user-supabase",
  toolName = "list_tables",
  arguments = { "schemas": ["public"], "verbose": true }
)
```

### Aplicar migración (DDL)

Para CREATE TABLE, ALTER TABLE, CREATE POLICY, CREATE TYPE, etc.:

```
CallMcpTool(
  server   = "user-supabase",
  toolName = "apply_migration",
  arguments = {
    "name": "nombre_descriptivo_snake_case",
    "query": "CREATE TABLE ... ; ALTER TABLE ... ;"
  }
)
```

**Importante:** el `name` debe ser descriptivo (ej: `add_streaks_table`, `add_level_column_to_subjects`).
El MCP genera automáticamente el timestamp del archivo de migración.

### Ejecutar SQL (DML)

Para INSERT, UPDATE, DELETE o queries de datos (NO DDL):

```
CallMcpTool(
  server   = "user-supabase",
  toolName = "execute_sql",
  arguments = { "query": "INSERT INTO ..." }
)
```

### Regenerar tipos TypeScript

Después de aplicar cualquier migración, **siempre** regenerar los tipos:

```
CallMcpTool(
  server   = "user-supabase",
  toolName = "generate_typescript_types",
  arguments = {}
)
```

Esto actualiza `src/types/database.types.ts` (o equivalente) para que el código
tenga los tipos correctos para las nuevas tablas/columnas.

### Flujo completo de migración dentro de /ship

```
1. FASE 2 (PLAN): Identificar si la tarea necesita cambios de DB.
   Marcar en el plan: "Requiere migración: [descripción]"
2. FASE 3 (DELEGATE): El subagente escribe el SQL de la migración
   como parte de su implementación.
3. POST-DELEGATE (antes de FASE 4):
   a. Leer el SQL de la migración del archivo creado por el subagente
      (en supabase/migrations/ o inline en el plan).
   b. Aplicar con `apply_migration` via MCP.
   c. Verificar que se aplicó: `list_tables` para confirmar cambios.
   d. Regenerar tipos: `generate_typescript_types`.
   e. Si el subagente escribió código que depende de los nuevos tipos,
      verificar que los imports estén correctos.
4. FASE 4-5: Review y tests corren contra el schema actualizado.
```

**Si la migración falla:** mostrar el error SQL exacto, NO avanzar a review/tests.
Intentar 1 fix y re-aplicar. Si sigue fallando → marcar tarea como bloqueada.

---

## Formato de anuncio de fase

### Modo Tarea (una tarea)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FASE N/7 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Modo Sprint (entre tareas, antes de cada ciclo)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SPRINT N — PROGRESO M/T
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Na] Tarea completada
✅ [Nb] Otra completada
▶  [Nc] Siguiente ← procesando
⬚  [Nd] Pendiente
⬚  [Ne] Pendiente (bloqueada por Nd)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Modo Sprint (fase dentro de una tarea)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Nc] FASE N/7 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FASE 1 — FETCH

### Con sub-sprint (ej: `/ship 5a`) — Modo Tarea

1. Ejecutá `notion-search` con query = el sub-sprint, usando `data_source_url = "collection://32a1a130-5119-800a-9aed-000bf54b3dcb"`.
2. Si no hay match exacto, buscá por nombre parcial.
3. Ejecutá `notion-fetch` de la página encontrada para obtener todas las propiedades y contenido.
4. Verificá **dependencias**: leé el campo "Dependencias". Si lista tareas requeridas, buscalas y confirmá que estén en estado "Hecho". Si alguna no lo está, mostrá warning y preguntá si avanzar o procesar la dependencia primero.

### Con nombre (ej: `/ship Streaks calculator`) — Modo Tarea

Mismo flujo que arriba pero buscando por nombre.

### Sin argumento (`/ship`) — Modo Tarea

1. Buscá tareas con Estado = "En curso".
2. Si no hay ninguna, buscá "Por hacer" ordenadas por Sub-sprint ASC, Prioridad Alta primero.
3. Mostrá lista numerada y preguntá cuál procesar.

### Con sprint completo (ej: `/ship sprint 5`) — Modo Sprint

1. Ejecutá `notion-search` con query = `sprint N` (page_size = 20).
2. Filtrá resultados: quedate solo con páginas cuyo Sub-sprint matchee `Na`, `Nb`, `Nc`...
   (es decir, el número de sprint + letra). Descartá resultados de otros sprints.
3. Ejecutá `notion-fetch` de **cada página** para obtener estado, dependencias y contenido.
4. **Construí la cola de ejecución:**
   a. Armá el grafo de dependencias a partir del campo "Dependencias" de cada tarea.
   b. Hacé un **orden topológico** (tareas sin deps primero, luego las que dependen de ellas).
   c. Tareas ya en estado "Hecho" → marcarlas como completadas, no reprocesar.
   d. Tareas en estado "Bloqueado" → avisar, preguntar si reintentar o saltear.
5. Mostrá el **plan del sprint**:

```
## Sprint N — [nombre del sprint]

### Cola de ejecución (orden topológico)
1. [Na] Nombre — Xh — sin deps
2. [Nb] Nombre — Xh — depende de Na
3. [Nc] Nombre — Xh — depende de Na + Nb
...

### Tareas ya completadas: M
### Tareas a procesar: T
### Tiempo estimado total: Xh
```

6. **NO preguntar.** Marcá la primera tarea de la cola como "En curso" en Notion
   y avanzá directo al Sprint Loop.

**Fallback si Notion falla:** leé `CONTEXT.MD` sección "Backlog" del sprint correspondiente.

→ En Modo Tarea: avanzá automáticamente a Fase 2.
→ En Modo Sprint: avanzá al **Sprint Loop**.

---

## SPRINT LOOP — Ciclo de procesamiento por tarea

Este loop solo se activa en **Modo Sprint**. Recorre la cola de ejecución tarea por tarea.
**Avanza automáticamente** sin preguntar entre tareas.

### Estrategia de commit (fija, no preguntar)

| Modo | Commit | Push |
|------|--------|------|
| **Modo Tarea** (`/ship 5a`) | Un commit por tarea completada | Push inmediato tras commit |
| **Modo Sprint** (`/ship sprint 5`) | **Un solo commit al final** del sprint | Push una sola vez al final |

En Modo Sprint, las FASES 2-5 corren por cada tarea, pero la FASE 6 (COMMIT) se ejecuta
**una sola vez** al completar todas las tareas. La FASE 7 por tarea solo marca "Hecho" en
Notion; el `context-updater` y el resumen final se ejecutan una sola vez al cerrar el sprint.

### Por cada tarea en la cola:

```
LOOP (automático, sin interrupciones):
  1. Mostrar banner de SPRINT PROGRESS
  2. Marcar tarea como "En curso" en Notion
  3. Ejecutar FASES 2-5 (PLAN → DELEGATE → REVIEW → TEST)
  4. Al pasar FASE 5:
     a. Marcar tarea como "Hecho" en Notion (7-parcial)
     b. Registrar en cola interna como completada
     c. Mostrar mini-resumen: "[Na] ✅ — TS/Lint/Build pasaron"
  5. IR DIRECTO a la siguiente tarea. SIN PREGUNTAR. SIN PAUSAR. SIN CONFIRMAR.
  6. Repetir hasta que NO QUEDEN tareas en la cola.

POST-LOOP (una sola vez):
  7. Ejecutar FASE 6 — un solo commit con TODOS los cambios del sprint
  8. Ejecutar FASE 7-final — context-updater + resumen del sprint
```

**IMPORTANTE:** Entre el paso 4c y el paso 5 NO hay ninguna interacción con el usuario.
El loop es completamente automático. La primera y única vez que se le pregunta algo al
usuario es en FASE 6 (confirmación del commit) después de que TODAS las tareas pasaron.

### Sprint Pause

Si el usuario **interrumpe explícitamente** (dice "pará", "cancelá", "pausá"):

1. Mostrar resumen parcial de lo completado.
2. Ejecutá `context-updater` con el estado actual del sprint.
3. El sprint puede retomarse en otra sesión con `/ship sprint N`
   (las tareas "Hecho" se detectan automáticamente y se saltean).

### Resolución de dependencias en runtime

- Antes de procesar cada tarea, verificar que sus dependencias estén en estado "Hecho"
  (por este sprint loop o previamente).
- Si una dependencia falló/quedó bloqueada en este mismo loop:
  1. Avisar: "⚠️ [Nc] depende de [Nb] que quedó bloqueada."
  2. Intentar reordenar: si hay tareas independientes procesables, avanzar con ellas.
  3. Si no hay tareas procesables → sprint pause forzado.
- Tareas independientes (sin deps cruzadas) se pueden reordenar si una bloqueada
  deja hueco. Ej: si [Nb] falla pero [Nc] no depende de ella → procesar [Nc].

---

## FASE 2 — PLAN

1. Leé `CONTEXT.MD` completo (backlog, NO TOCAR, mapa de código).
2. Usá la información de la página Notion (ya la tenés de Fase 1).
3. **Detectá si la tarea requiere migraciones de DB** (nuevas tablas, columnas, RLS, enums).
   Si sí, marcar en el plan y planificar el orden: migración primero, código después.
4. Generá **subtareas concretas**: qué hacer → archivo(s) → agente.
5. Determiná si son paralelas o secuenciales.
6. Mostrá el plan:

```
## Plan para: [sub-sprint] — [nombre tarea]

### Migración de DB: [Sí/No]
[Si sí: descripción de qué cambia en el schema]

### Subtareas
1. [descripción] → archivo(s) → agente: [subagent_type]
2. [descripción] → archivo(s) → agente: [subagent_type]

### Ejecución: [paralela / secuencial]
Justificación: [por qué]

### Items de NO TOCAR relevantes
- [si aplica, de CONTEXT.MD]
```

7. Ejecutá `notion-update-page` para escribir las subtareas como checklist en la página.

→ Avanzá automáticamente a Fase 3.

---

## FASE 3 — DELEGATE

**Acá es donde lanzás los subagentes. NO hagas el código vos mismo.**

1. Por cada subtarea del plan, lanzá un `Task` con el `subagent_type` que corresponda según el routing.
2. Usá el template de prompt de delegación (ver arriba). Incluí todo el contexto necesario.
3. Si las subtareas son paralelas, lanzá todos los Task en un solo message.
4. Si son secuenciales, esperá que termine cada uno antes de lanzar el siguiente.
5. Al terminar todos los subagentes, mostrá resumen de archivos tocados por cada uno.

### 3.5 — POST-DELEGATE: Migración de DB (si aplica)

Si el plan marcó "Migración de DB: Sí":

1. Leer el SQL de la migración creada por el subagente (archivo en `supabase/migrations/`).
2. Aplicar vía MCP:
   ```
   CallMcpTool(server="user-supabase", toolName="apply_migration",
     arguments={ "name": "[nombre_migration]", "query": "[SQL]" })
   ```
3. Verificar aplicación: `list_tables` para confirmar los cambios en el schema.
4. Regenerar tipos TypeScript:
   ```
   CallMcpTool(server="user-supabase", toolName="generate_typescript_types",
     arguments={})
   ```
5. Si el código delegado depende de los nuevos tipos, verificar que compile (`npx tsc --noEmit`
   rápido solo sobre los archivos afectados).

**Si la migración falla:** mostrar error SQL, intentar 1 fix, re-aplicar.
Si sigue fallando → tarea bloqueada, no avanzar.

6. Ejecutá `notion-update-page` para marcar subtareas completadas en la página.

→ Avanzá automáticamente a Fase 4.

---

## FASE 4 — REVIEW

Lanzá un `Task` con `subagent_type = "code-reviewer"` y `readonly = true`:

```
Task(
  subagent_type = "code-reviewer",
  readonly      = true,
  description   = "Review de [sub-sprint]",
  prompt        = "Revisá los cambios realizados para la tarea [nombre].
                   Archivos tocados: [lista].
                   Reportá: REVIEW_STATUS (PASS/FAIL), BLOQUEANTES, ADVERTENCIAS."
)
```

- **FAIL con bloqueantes:** parar, mostrar bloqueantes, intentar 1 fix (delegando al agente correspondiente), re-run review. Si sigue fallando → parar. Ejecutá `notion-update-page` → Estado "Bloqueado".
- **PASS:** mostrar advertencias como info.

→ Avanzá automáticamente a Fase 5.

---

## FASE 5 — TEST

Ejecutá los comandos de verificación **en este orden estricto**. Si uno falla, no corras el siguiente:

1. `npx tsc --noEmit`
2. `pnpm lint`
3. `pnpm test:unit`
4. `pnpm build`

Podés usar la herramienta `Shell` directamente para esto (no necesitás delegar).

- **Si falla alguno:** mostrá el error exacto. Si es trivial (import faltante, tipo menor), arreglalo vos. Si es lógica de negocio, delegá al agente correspondiente con Task y re-corré toda la verificación.
- **Máx. 1 intento de fix.** Si sigue fallando → parar. Ejecutá `notion-update-page` → Estado "Bloqueado" + error en Notas.
- **Si todo pasa:** ejecutá `notion-update-page` para agregar resultados de verificación en la página.

→ **Modo Tarea:** avanzá automáticamente a Fase 6 (commit).
→ **Modo Sprint:** ejecutá 7-parcial (marcar "Hecho" en Notion + mini-resumen) y
  **avanzá automáticamente a la siguiente tarea**. NO ir a Fase 6 todavía.
  Fase 6 solo se ejecuta al terminar TODAS las tareas del sprint.

---

## FASE 6 — COMMIT

**GATE OBLIGATORIO:** esta fase solo se ejecuta si la verificación pasó completamente.
Si los tests no pasaron, **está prohibido continuar**.

**En Modo Sprint:** esta fase se ejecuta **una sola vez** al terminar todas las tareas,
NO después de cada tarea individual.

0. **Safety net pre-commit:** Ejecutá `pnpm typecheck` una última vez para confirmar que no hay errores de tipos con los archivos que vas a commitear. Si `database.types.ts` tiene cambios locales sin stagear y estás tocando archivos que dependen de los tipos DB, **incluí `database.types.ts` en el commit** o avisá al usuario.
1. Ejecutá `git diff --stat` y `git diff` para ver cambios.
2. Generá mensaje **Conventional Commits** en español:

   **Modo Tarea:**
   ```
   tipo(scope): descripción en infinitivo

   [sub-sprint] Cuerpo opcional.
   ```

   **Modo Sprint:**
   ```
   feat(sprint-N): descripción general del sprint

   Incluye: [Na] nombre, [Nb] nombre, [Nc] nombre, ...
   ```

   Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

3. Mostrá: archivos modificados + mensaje propuesto + resumen 2-3 líneas.
4. **STOP — Preguntá:** "¿Commiteamos con este mensaje, lo modificás, o cancelás?"
   - Confirma → `git add [archivos] && git commit && git push`
   - Modifica → pedir nuevo mensaje
   - Cancela → dejar staged sin commit
5. Ejecutá `notion-update-page` para agregar hash del commit en Notas de cada tarea del sprint.

**NUNCA commitees sin confirmación explícita. NUNCA pushees si los tests no pasaron.**

→ Avanzá automáticamente a Fase 7.

---

## FASE 7 — CLOSE

### Modo Tarea

#### 7.1 Notion
1. Ejecutá `notion-update-page` → Estado **"Hecho"**
2. Agregá en Notas: `✅ Completado [fecha] — commit [hash]`

#### 7.2 CONTEXT.MD
Delegá a `context-updater`:

```
Task(
  subagent_type = "context-updater",
  description   = "Actualizar CONTEXT.MD",
  prompt        = "Actualizá CONTEXT.MD con:
                   - Tarea completada: [sub-sprint] [nombre]
                   - Archivos tocados: [lista]
                   - Commit hash: [hash]
                   - Próxima tarea sugerida: [sub-sprint] [nombre]
                   - Mové la sección 'Última sesión' y 'Próxima tarea' acorde."
)
```

#### 7.3 Sugerir próxima tarea
1. Si la tarea completada desbloquea otras → sugerí la desbloqueada.
2. Si no → siguiente por Sub-sprint ASC que esté "Por hacer" con dependencias satisfechas.

#### 7.4 Resumen final

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /ship [sub-sprint] completado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Implementado
- [sub-sprint] [nombre tarea]
- [2-3 bullets de qué se hizo]

## Verificación
- TypeScript: ✅ | Lint: ✅ | Unit tests: ✅ | Build: ✅
- Code review: ✅ (N advertencias)

## Commit
- Hash: [hash corto]
- Mensaje: [mensaje]

## Siguiente tarea
→ [sub-sprint] [nombre] (desbloqueada por esta)
```

### Modo Sprint

En modo sprint, FASE 7 tiene **dos momentos**:

#### 7-parcial: Después de cada tarea (dentro del loop, automático)

Solo marcar en Notion + mostrar mini-resumen. **No** hacer CONTEXT.MD, **no** commitear,
**no** preguntar nada. Avanzar inmediatamente a la siguiente tarea.

1. `notion-update-page` → Estado **"Hecho"** para esa tarea.
2. Mostrar mini-resumen (solo informativo, NO es un punto de parada):

```
✅ [Na] completado (M/T) | TS ✅ | Lint ✅ | Build ✅ → continúa con [Nb]
```

#### 7-final: Después del commit del sprint (post FASE 6)

Se ejecuta **una sola vez** al completar el sprint entero:

1. **Notion:** agregar hash del commit en Notas de cada tarea.
2. **CONTEXT.MD:** delegá a `context-updater` con TODAS las tareas:

```
Task(
  subagent_type = "context-updater",
  description   = "Actualizar CONTEXT.MD",
  prompt        = "Actualizá CONTEXT.MD con:
                   - Sprint completado: Sprint N — [nombre]
                   - Tareas completadas: [lista de sub-sprints y nombres]
                   - Archivos tocados: [lista consolidada]
                   - Commit hash: [hash]
                   - Próximo sprint/tarea sugerida: [siguiente]
                   - Actualizar completitud del sprint a 100%
                   - Mové la sección 'Última sesión' y 'Próxima tarea' acorde."
)
```

3. **Sugerir próximo sprint:** buscar en Notion el siguiente sprint desbloqueado.
4. **Resumen final del sprint:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 SPRINT N COMPLETADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tareas completadas (T/T)
✅ [Na] Nombre
✅ [Nb] Nombre
✅ [Nc] Nombre
...

## Verificación global
- Todas las tareas pasaron: TS ✅ | Lint ✅ | Tests ✅ | Build ✅

## Commit
- Hash: [hash corto]
- Mensaje: [mensaje]

## Estadísticas
- Tareas: T completadas, B bloqueadas, S salteadas
- Tiempo estimado: Xh

## Siguiente
→ Sprint M — [nombre] (desbloqueado)
```

---

## Manejo de errores

### Errores generales (ambos modos)

- **Notion falla:** continuar sin Notion; avisar qué quedó sin sincronizar.
- **Subagente falla:** mostrar error, preguntar si reintentar o intervenir manualmente.
- **Dependencia no satisfecha:** mostrar cuál falta, ofrecer `/ship [dependencia]` en su lugar.
- **Usuario dice "cancelá":** parar, mostrar qué quedó hecho, ofrecer cierre parcial con `context-updater`.
- **Nunca silenciar un error.** Siempre mostrarlo con contexto.

### Errores específicos de Modo Sprint

- **Tarea bloqueada con dependientes en la cola:**
  Verificar si hay tareas independientes que puedan avanzar. Reordenar la cola
  automáticamente. Si no hay tareas procesables → sprint pause forzado.
- **Build falla en tarea intermedia:**
  No procesar más tareas hasta resolver. El estado del repo debe ser siempre buildeable.
  Intentar 1 fix automático; si falla → parar el sprint, ejecutar `context-updater`
  con progreso parcial.
- **Usuario interrumpe** (dice "pará", "cancelá", "pausá"):
  Cerrar con `context-updater` indicando progreso parcial. Las tareas "Hecho" se
  detectan automáticamente al retomar con `/ship sprint N`.
- **Sprint retomado con tareas ya hechas:**
  Saltear automáticamente las que tienen estado "Hecho", recalcular cola desde
  la primera pendiente. NO re-commitear lo ya commiteado.

---

## Ejemplos de uso

```
/ship 5a              → Modo Tarea: busca sub-sprint 5a, ejecuta 7 fases
/ship 4f              → Modo Tarea: busca sub-sprint 4f, ejecuta 7 fases
/ship                 → Modo Tarea: lista disponibles, pregunta cuál
/ship Streaks         → Modo Tarea: busca por nombre "Streaks"
/ship sprint 5        → Modo Sprint: todas las tareas del Sprint 5 en orden
/ship sprint 6        → Modo Sprint: todas las tareas del Sprint 6 en orden
```
