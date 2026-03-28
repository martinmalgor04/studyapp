---
name: ship
description: >-
  Flujo completo de entrega end-to-end para StudyApp: fetch desde Notion por sub-sprint
  (ej: /ship 4f, /ship 5a), planificación, delegación a agentes especializados, code review,
  tests, commit y cierre en Notion. Usar cuando el usuario escribe "/ship", "/ship [sub-sprint]",
  "/ship [nombre de tarea]", "ship esta tarea", "procesá la siguiente tarea", o cualquier
  variante que implique llevar una tarea del backlog hasta commit confirmado.
---

# /ship — StudyApp

Flujo de entrega **end-to-end**. Llevás una tarea desde Notion hasta el commit confirmado.
Español rioplatense siempre.

---

## REGLAS ABSOLUTAS (no negociables)

1. **Ejecutá las 7 fases en orden.** Nunca saltes ni colapses fases.
2. **Delegá la implementación a subagentes.** Vos NO escribís código de negocio, UI ni actions. Usás la herramienta `Task` para delegar. La única excepción es un fix trivial en la fase de verificación (un import faltante, un tipo menor).
3. **NUNCA commitees sin confirmación explícita del usuario.** Es la única parada obligatoria del flujo.
4. **Si algo falla, pará y avisá.** Nunca silencies un error.
5. **Anunciá cada fase** con el formato de banner antes de ejecutarla.

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

## Formato de anuncio de fase

Usá este formato al iniciar cada fase:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FASE N/7 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FASE 1 — FETCH

### Con sub-sprint (ej: `/ship 5a`)

1. Ejecutá `notion-search` con query = el sub-sprint, usando `data_source_url = "collection://32a1a130-5119-800a-9aed-000bf54b3dcb"`.
2. Si no hay match exacto, buscá por nombre parcial.
3. Ejecutá `notion-fetch` de la página encontrada para obtener todas las propiedades y contenido.
4. Verificá **dependencias**: leé el campo "Dependencias". Si lista tareas requeridas, buscalas y confirmá que estén en estado "Hecho". Si alguna no lo está, mostrá warning y preguntá si avanzar o procesar la dependencia primero.

### Con nombre (ej: `/ship Streaks calculator`)

Mismo flujo que arriba pero buscando por nombre.

### Sin argumento (`/ship`)

1. Buscá tareas con Estado = "En curso".
2. Si no hay ninguna, buscá "Por hacer" ordenadas por Sub-sprint ASC, Prioridad Alta primero.
3. Mostrá lista numerada y preguntá cuál procesar.

### Al elegir tarea

Extraé: nombre, sub-sprint, descripción, notas, sprint, prioridad, estimación, dependencias, categoría.

Ejecutá `notion-update-page` para cambiar estado a **"En curso"** si estaba en "Por hacer".

**Fallback si Notion falla:** leé `CONTEXT.MD` sección "Próxima tarea" y proponé esa.

→ Avanzá automáticamente a Fase 2.

---

## FASE 2 — PLAN

1. Leé `CONTEXT.MD` completo (backlog, NO TOCAR, mapa de código).
2. Usá la información de la página Notion (ya la tenés de Fase 1).
3. Generá **subtareas concretas**: qué hacer → archivo(s) → agente.
4. Determiná si son paralelas o secuenciales.
5. Mostrá el plan:

```
## Plan para: [sub-sprint] — [nombre tarea]

### Subtareas
1. [descripción] → archivo(s) → agente: [subagent_type]
2. [descripción] → archivo(s) → agente: [subagent_type]

### Ejecución: [paralela / secuencial]
Justificación: [por qué]

### Items de NO TOCAR relevantes
- [si aplica, de CONTEXT.MD]
```

6. Ejecutá `notion-update-page` para escribir las subtareas como checklist en la página.

→ Avanzá automáticamente a Fase 3.

---

## FASE 3 — DELEGATE

**Acá es donde lanzás los subagentes. NO hagas el código vos mismo.**

1. Por cada subtarea del plan, lanzá un `Task` con el `subagent_type` que corresponda según el routing.
2. Usá el template de prompt de delegación (ver arriba). Incluí todo el contexto necesario.
3. Si las subtareas son paralelas, lanzá todos los Task en un solo message.
4. Si son secuenciales, esperá que termine cada uno antes de lanzar el siguiente.
5. Al terminar todos los subagentes, mostrá resumen de archivos tocados por cada uno.
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

→ Avanzá automáticamente a Fase 6.

---

## FASE 6 — COMMIT

**GATE OBLIGATORIO:** esta fase solo se ejecuta si la Fase 5 pasó completamente. Si los tests no pasaron, **está prohibido continuar**.

0. **Safety net pre-commit:** Ejecutá `pnpm typecheck` una última vez para confirmar que no hay errores de tipos con los archivos que vas a commitear. Si `database.types.ts` tiene cambios locales sin stagear y estás tocando archivos que dependen de los tipos DB, **incluí `database.types.ts` en el commit** o avisá al usuario.
1. Ejecutá `git diff --stat` y `git diff` para ver cambios.
2. Generá mensaje **Conventional Commits** en español con el sub-sprint:
   ```
   tipo(scope): descripción en infinitivo

   [sub-sprint] Cuerpo opcional.
   ```
   Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
3. Mostrá: archivos modificados + mensaje propuesto + resumen 2-3 líneas.
4. **STOP — Preguntá:** "¿Commiteamos con este mensaje, lo modificás, o cancelás?"
   - Confirma → `git add [archivos] && git commit && git push`
   - Modifica → pedir nuevo mensaje
   - Cancela → dejar staged sin commit
5. Ejecutá `notion-update-page` para agregar hash del commit en Notas.

**NUNCA commitees sin confirmación explícita. NUNCA pushees si los tests no pasaron.**

→ Avanzá automáticamente a Fase 7.

---

## FASE 7 — CLOSE

### 7.1 Notion (lo hacés vos)

1. Ejecutá `notion-update-page` → Estado **"Hecho"**
2. Agregá en Notas: `✅ Completado [fecha] — commit [hash]`

### 7.2 CONTEXT.MD (delegá a context-updater)

Lanzá un Task:

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

### 7.3 Sugerir próxima tarea

Buscá en Notion la siguiente tarea lógica:
1. Si la tarea completada desbloquea otras → sugerí la desbloqueada.
2. Si no → siguiente por Sub-sprint ASC que esté "Por hacer" con dependencias satisfechas.

### 7.4 Resumen final

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

---

## Manejo de errores

- **Notion falla:** continuar sin Notion; avisar qué quedó sin sincronizar.
- **Subagente falla:** mostrar error, preguntar si reintentar o intervenir manualmente.
- **Dependencia no satisfecha:** mostrar cuál falta, ofrecer `/ship [dependencia]` en su lugar.
- **Usuario dice "cancelá":** parar, mostrar qué quedó hecho, ofrecer cierre parcial con `context-updater`.
- **Nunca silenciar un error.** Siempre mostrarlo con contexto.

---

## Ejemplos de uso

```
/ship 5a          → Busca sub-sprint 5a, ejecuta las 7 fases
/ship 4f          → Busca sub-sprint 4f, ejecuta las 7 fases
/ship             → Lista tareas disponibles, pregunta cuál
/ship Streaks     → Busca por nombre "Streaks" en la DB
```
