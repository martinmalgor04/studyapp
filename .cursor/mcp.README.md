# MCP — StudyApp (Cursor)

Configuración en `.cursor/mcp.json`. El JSON no admite comentarios; la guía de uso está acá.

## Variables y archivos de entorno

En el repo **no** está commiteado `.env.local`. Como referencia usamos `.env.example` y `.env.local.docker`.

- **Next.js** usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **MCP Supabase (paquete npm)** usa un **Personal Access Token** de tu cuenta Supabase, no la anon key. Tenés que definir en tu entorno (p. ej. `.env.local` + export, o variables de sistema / Cursor):

| Variable | Uso |
|----------|-----|
| `SUPABASE_ACCESS_TOKEN` | PAT desde [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project ID (Settings → General del proyecto; coincide con el subdominio de `*.supabase.co` en `NEXT_PUBLIC_SUPABASE_URL`) |

Cursor suele expandir `${NOMBRE}` en `env` y `args` si esa variable existe en el entorno donde arranca el MCP. Si no se sustituye, exportá las variables antes de abrir Cursor o configurálas en el sistema.

**Proyecto acotado (recomendado):** en `mcp.future.json` está la entrada `supabase-stdio-with-project-ref`, que agrega `--project-ref ${SUPABASE_PROJECT_REF}`. Copiala a `mcp.json` y definí `SUPABASE_PROJECT_REF` (mismo ID que en la URL `https://<ref>.supabase.co` de `NEXT_PUBLIC_SUPABASE_URL`).

---

## Servidor: `supabase`

**Para qué sirve en StudyApp**

- Inspeccionar schema alineado con `supabase/migrations/` y `src/types/database.types.ts`.
- Consultar tablas (`sessions`, `topics`, `subjects`, RLS, etc.) sin adivinar columnas.
- Apoyar migraciones y debugging de Postgres en el mismo proyecto que usa la app.

**Agentes que más lo aprovechan**

- `server-actions-dev` (queries y schema antes de tocar `src/lib/actions/`).
- `orchestrator` / revisión general cuando hay dudas de DB.
- `test-writer` si hace falta validar datos de prueba contra el proyecto real.

**Cómo verificar**

1. Cursor → Settings → MCP: el servidor `supabase` en verde / con herramientas listadas.
2. Pedir en el chat algo como: “Listá las tablas del proyecto StudyApp usando las herramientas MCP de Supabase” y aceptar la tool call.
3. CLI (descarga el paquete y comprueba que el binario arranca; puede fallar sin token válido):

```bash
SUPABASE_ACCESS_TOKEN="tu-pat" npx -y @supabase/mcp-server-supabase@latest --help
```

---

## Servidor: `notion`

**Para qué sirve en StudyApp**

- Vincular specs, backlog o notas de producto en Notion con el código (fuera del repo).
- Opcional: documentación viva paralela a `docs/spec-kit/` y `CONTEXT.MD`.

**Agentes que más lo aprovechan**

- `orchestrator` / `context-updater` si sincronizás tareas con páginas de Notion.
- Cualquier tarea de documentación o planificación que el equipo lleve en Notion.

**Configuración obligatoria**

1. En `.cursor/mcp.json`, reemplazá **`NOTION_TOKEN_PLACEHOLDER`** dentro de `OPENAPI_MCP_HEADERS` por el secret de tu integración interna (`ntn_...`), **o** reemplazá todo el valor por un JSON en una sola línea con tu Bearer real y `Notion-Version: 2022-06-28` como pediste.
2. Conectá las páginas necesarias a la integración en Notion (permisos).

**Nota:** El paquete `@notionhq/notion-mcp-server` en versiones recientes prioriza la API `2025-09-03`. Si algo falla con `2022-06-28`, probá actualizar solo el header `Notion-Version` según la [documentación del servidor](https://github.com/makenotion/notion-mcp-server).

**Cómo verificar**

```bash
OPENAPI_MCP_HEADERS='{"Authorization":"Bearer ntn_TU_TOKEN","Notion-Version":"2022-06-28"}' npx -y @notionhq/notion-mcp-server --transport stdio
```

(Debería quedar en espera leyendo stdin; Ctrl+C para salir. Si el token es inválido, suele fallar al inicio.)

En Cursor: MCP activo + pedir “Buscá en Notion páginas que mencionen StudyApp” usando las tools del servidor.

---

## Archivo `mcp.future.json`

Plantillas **no activas** (Cursor solo lee `mcp.json`). Incluye:

| Clave | Propósito |
|-------|-----------|
| `supabase-http-alternative` | Mismo servidor hosted que documenta Supabase (`Authorization: Bearer` + query `project_ref`). Útil si preferís transporte HTTP en vez de stdio. |
| `supabase-stdio-with-project-ref` | Igual que `supabase` en `mcp.json` pero con `--project-ref` para limitar al proyecto StudyApp. |
| `resend-future` | Paquete publicado `resend-mcp` + `RESEND_API_KEY` (como en `.env.example`). Revisá [Resend MCP](https://resend.com/docs/mcp-server) por flags/env exactos según versión. |

**Google Calendar:** en `.env.example` ya están `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`; no hay un único paquete “oficial” único en npm. Antes de agregar un MCP de Calendar, elegí un paquete (p. ej. buscá `google-calendar-mcp` en npm), leé su README y copiá la entrada a `mcp.json` con las env que pida ese servidor.

Copiá manualmente las entradas que quieras a `mcp.json` después de auditarlas.
