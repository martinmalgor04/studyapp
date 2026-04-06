---
name: notion-fix
description: >-
  Crea páginas de tipo fix en la base Notion de StudyApp: investiga el código (lectura,
  grep, contexto), redacta la columna Fix y el cuerpo de la tarea, y crea la entrada con
  notion-create-pages. No implementa el fix en el repo. Usar con "/fix-notion",
  "crear fix en Notion", "registrá este bug en el backlog", "alta de fix en Notion".
---

# /fix-notion — StudyApp

Investigás el código en el repo, **documentás** el bug como tarea en Notion (columna **Fix** + propiedades del backlog), y **no** tocás el código salvo lectura. Español rioplatense siempre.

---

## REGLAS ABSOLUTAS

1. **No implementás el fix en el código.** Solo leés, analizás y creás/actualizás la página en Notion.
2. **Antes de crear la página**, obtené el **schema real** del data source con `notion-fetch` (nombres exactos de propiedades: `Fix`, `Sprint`, `Estado`, `Tarea`, etc.).
3. **Si el nombre de una propiedad en Notion difiere** (ej. `Bug` en vez de `Fix`), usá el nombre que devuelve el fetch, no inventes keys.
4. **Si Notion falla:** mostrá el borrador del fix (markdown) para que el usuario lo cargue a mano.
5. **Anunciá cada fase** con el banner de abajo.

---

## Data source (misma base que /ship)

| Uso | Valor |
|-----|--------|
| Búsqueda (`notion-search`) | `data_source_url = "collection://32a1a130-5119-800a-9aed-000bf54b3dcb"` |
| Crear página (`notion-create-pages`) | `parent: { "type": "data_source_id", "data_source_id": "32a1a130-5119-800a-9aed-000bf54b3dcb" }` |

Si `notion-create-pages` rechaza el ID, probá con guiones: `32a1a130-5119-800a-9aed-000bf54b3dcb` (formato UUID estándar).

---

## Formato de anuncio de fase

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 FASE N/6 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FASE 1 — INTAKE

1. Capturá qué quiere registrar el usuario: bug vago, archivo sospechoso, error pegado, captura descrita, o “revisá X”.
2. Si falta **síntoma mínimo** (qué falla, qué esperaba, dónde lo vio), pedilo en una sola ronda de preguntas.
3. Mostrá:

```
## Registro de fix (borrador)
- Resumen en una línea: [...]
- Entrada del usuario: [cita breve]
```

→ Avanzá a FASE 2.

---

## FASE 2 — INVESTIGATE (solo lectura en repo)

1. Leé `CONTEXT.MD` (NO TOCAR, mapa de código).
2. Con `Read` / `Grep` / `SemanticSearch`, ubicá archivos relevantes al síntoma.
3. Formulá una **hipótesis de root cause** con evidencia: `archivo:línea` o flujo (UI → action → service).
4. Si hace falta corroborar comportamiento sin implementar fix, podés correr **`pnpm lint`** o **`npx tsc --noEmit`** solo para citar el error en la página de Notion.
5. **No** delegues implementación de código con `Task`. Si el alcance es enorme, pedí que acoten el bug o prioricen un archivo.

Mostrá:

```
## Investigación
- Archivos revisados: [paths]
- Hipótesis de causa: [1-3 oraciones + referencias archivo:línea si aplica]
- Severidad estimada: [baja / media / alta] (subjetivo, para la nota)
```

→ Avanzá a FASE 3.

---

## FASE 3 — SCHEMA NOTION

**Obligatorio** antes de crear la página.

1. Ejecutá `notion-fetch` sobre una **página existente** de la misma base (cualquier tarea del backlog) **o** sobre la URL del database, para obtener:
   - Nombres exactos de propiedades (`<properties>` / schema).
   - Valores permitidos para **Sprint**, **Estado**, **Prioridad**, **Categoría**, etc. (selects / multi-select).
2. Confirmá cómo se llama la columna del texto del bug (**Fix** u otro nombre).
3. Si no podés obtener el schema, **no** llames `notion-create-pages` con propiedades inventadas: pasá a FASE 6 solo con **borrador Markdown** para el usuario.

→ Avanzá a FASE 4.

---

## FASE 4 — DRAFT

Armá el contenido que va a Notion:

### Título de la página (`Tarea` o el title property que defina el schema)

Formato sugerido: `[Fix] <breve descripción>` o `🐛 <módulo>: <síntoma>`.

### Propiedad **Fix** (o equivalente)

Texto claro para quien ejecute `/fixer` después:

- **Síntoma:** qué pasa / mensaje de error.
- **Pasos para reproducir:** si aplica.
- **Comportamiento esperado vs actual.**
- **Hipótesis:** archivos y líneas sospechosas.
- **Notas:** env, feature flag, etc.

### Otras propiedades (ajustar nombres al schema)

- **Estado:** típicamente `Por hacer` (o el valor equivalente en tu DB).
- **Sprint:** el que indique el usuario; si no, el sprint activo según `CONTEXT.MD` o “Backlog” si existe.
- **Sub-sprint:** si la DB lo usa, generá uno nuevo coherente (ej. `5x` para fixes de sprint 5) o dejalo vacío si la propiedad es opcional.
- **Prioridad / Estimación / Categoría:** valores válidos del fetch.

### Cuerpo de la página (`content` en `notion-create-pages`)

Notion-flavored Markdown (consultá el recurso MCP `notion://docs/enhanced-markdown-spec` si necesitás bloques avanzados). Estructura sugerida:

```markdown
## Contexto
[De dónde salió el reporte]

## Análisis en repo
- Archivos: ...
- Hipótesis: ...

## Criterio de cierre
- [ ] Fix mergeado
- [ ] `pnpm build` OK
- [ ] Sin regresión en [área]
```

→ Avanzá a FASE 5.

---

## FASE 5 — CREATE

Usá **`notion-create-pages`** (no inventes el shape: alineado al schema de FASE 3).

```
CallMcpTool(
  server   = "user-Notion",
  toolName = "notion-create-pages",
  arguments = {
    "parent": {
      "type": "data_source_id",
      "data_source_id": "32a1a130-5119-800a-9aed-000bf54b3dcb"
    },
    "pages": [
      {
        "properties": {
          "[Title property name]": "🐛 Session list: scroll infinito",
          "Fix": "Síntoma: ...\nPasos: ...\nHipótesis: sessions-list.tsx L42 ...",
          "Estado": "Por hacer",
          "Sprint": "Sprint 5"
        },
        "content": "## Contexto\n...",
        "icon": "🔧"
      }
    ]
  }
)
```

- Los **nombres** de `properties` tienen que coincidir con el fetch (incluidos mayúsculas).
- Si un select no acepta el string, probá el valor **exacto** que aparece en otra página del fetch.

→ Avanzá a FASE 6.

---

## FASE 6 — VERIFY & HANDOFF

1. Si la creación devolvió `page_id` o URL, ejecutá **`notion-fetch`** sobre la nueva página y verificá que **Fix** y el título se vean bien.
2. Respondé al usuario con:
   - **Link** a la página en Notion.
   - **Resumen** de qué quedó cargado.
   - **Siguiente paso sugerido:** “Cuando quieras implementar el fix: `/fixer` + URL de esta página o `/fixer notion`”.

Si no hubo create exitoso, entregá el **markdown completo** listo para pegar en Notion manualmente.

---

## Resumen final

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /fix-notion completado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Página Notion
- Título: [...]
- URL: [...]

## Columna Fix (resumen)
- [2-3 bullets]

## Próximo paso
→ /fixer con esta tarea cuando se priorice el fix en código
```

---

## Manejo de errores

- **Schema ilegible:** pedí al usuario una captura del nombre de las columnas o una página de ejemplo exportada.
- **create-pages falla por propiedad:** leé el error, ajustá nombre o valor del select, reintentá una vez.
- **Usuario mezcla “solo documentar” con “arreglá ya”:** aclarar que esta skill **no** commitea; para implementación usar **`/fixer`** o flujo normal de desarrollo.

---

## Ejemplos de uso

```
/fix-notion
"Registrá en Notion que el dashboard tira 500 al filtrar por fecha"
→ Investiga → crea página con Fix detallado

/fix-notion src/lib/actions/sessions.ts — posible race en reschedule
→ Enfoca lectura en ese archivo y vecinos

"Alta de bug: mismo esquema que la tarea 5a pero es un fix"
→ Copiá estructura de propiedades de una página existente (fetch) y rellená Fix
```

---

## Relación con otras skills

| Skill | Rol |
|-------|-----|
| **`/fix-notion` (esta)** | Crear la **tarea** en Notion con investigación previa. |
| **`/fixer`** | Ejecutar el **fix en código** cuando la tarea ya existe (p. ej. leyendo la columna **Fix**). |
| **`/ship`** | Entregar **features** por sub-sprint; no sustituye el registro de bugs puros. |
