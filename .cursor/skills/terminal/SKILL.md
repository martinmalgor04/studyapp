---
name: terminal
description: >-
  Analiza output de terminal (errores de build, runtime, tests, dependencias, deploy,
  migraciones, etc.), diagnostica el problema, y delega el fix al agente correcto.
  Usar cuando el usuario pega output de terminal, dice "/terminal", "/check",
  "mirá este error", "la terminal dice", "este es el output", "falló el build",
  "me tira este error", o cualquier variante que implique analizar un output de consola.
---

# /terminal — StudyApp

Analizás output de terminal, diagnosticás el problema y delegás el fix.
Español rioplatense siempre.

---

## REGLAS ABSOLUTAS

0. **Base de datos:** el equipo usa **Supabase Cloud** en desarrollo y producción (`NEXT_PUBLIC_SUPABASE_URL` → `https://<ref>.supabase.co`). No asumir ni recomendar `localhost:54321` salvo que el usuario lo pida explícitamente.

1. **No asumas.** Basate exclusivamente en el output que te dan + lectura del código.
2. **Delegá el fix a subagentes.** Vos diagnosticás y orquestás; no escribís código
   (excepto fixes triviales: un import, un typo, un tipo menor).
3. **Si el output no alcanza, pedí más contexto** antes de diagnosticar.
4. **Anunciá cada fase** con el formato de banner.
5. **No preguntes cosas operativas.** Diagnosticá y avanzá. Solo frenás si necesitás
   más output o hay una decisión técnica ambigua.

---

## Cómo delegar: herramienta Task

```
Task(
  subagent_type = "[agente]",
  description   = "Fixear [X]",
  prompt        = "..."
)
```

### Routing de agentes

| Origen del error | `subagent_type` |
|------------------|-----------------|
| `src/lib/actions/*.ts` | `server-actions-dev` |
| `src/lib/services/**` | `services-dev` |
| `src/components/**`, `src/app/**/` | `ui-dev` |
| Tests (`src/__tests__/**`) | `test-writer` |
| Config (`tailwind.config.*`, `next.config.*`, `tsconfig.*`) | `generalPurpose` |
| Migraciones / SQL | Usar Supabase MCP directamente (ver abajo) |

---

## Formato de anuncio de fase

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥 FASE N/4 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FASE 1 — PARSE

Analizá el output de terminal y extraé la información estructurada.

1. Identificá el **tipo de error** según la tabla de clasificación.
2. Extraé: mensaje de error exacto, archivo(s) y línea(s), stack trace relevante.
3. Si el output es ambiguo o incompleto, pedí:
   - El comando exacto que corrieron
   - Más contexto del output (ej: "pegame las 20 líneas anteriores")
   - El archivo mencionado en el error
4. Mostrá:

```
## Análisis del output

### Tipo: [clasificación]
### Error: [mensaje exacto, 1-2 líneas]
### Ubicación: [archivo:línea o módulo]
### Contexto: [qué comando/acción produjo este output]
```

→ Avanzá automáticamente a Fase 2.

---

## FASE 2 — DIAGNOSE

**Leé el código antes de cualquier conclusión.**

1. Leé los archivos mencionados en el error con `Read`.
2. Si el error no menciona archivo exacto, usá `Grep` para localizar el símbolo/patrón.
3. Seguí el flujo del error: desde el stack trace hacia el root cause.
4. Para errores de tipos/build: verificá imports, interfaces, y `database.types.ts`.
5. Para errores de runtime: verificá el flujo de datos, nulls, y estados.
6. Mostrá:

```
## Diagnóstico

### Root cause: [condición exacta + archivo:línea]
### Por qué falla: [2-3 líneas con evidencia del código]
### Fix necesario: [qué hay que cambiar]
### Archivos a tocar: [paths]
```

**Si no encontrás el root cause en 2 rondas de lectura:** reportá qué leíste y pedí más contexto.

→ Avanzá automáticamente a Fase 3.

---

## FASE 3 — FIX

### Fix trivial (lo hacés vos)

Si el fix es trivial (1-3 líneas, sin lógica de negocio), hacelo directamente:
- Import faltante
- Typo en nombre de variable/propiedad
- Tipo incorrecto obvio
- Dependency faltante (`pnpm add`)
- Variable de entorno mal escrita

### Fix complejo (delegás)

Si requiere cambios de lógica, estructura, o múltiples archivos:

1. Lanzá un `Task` con el subagente correcto.
2. Prompt con el template:

```
Estás trabajando en StudyApp (Next.js 16 + Supabase).

## Error a resolver
[Output de terminal relevante]

## Root cause diagnosticado
[Archivo:línea + condición exacta]

## Qué debe cambiar y por qué
[Descripción del fix]

## Archivos a modificar
[Paths exactos]

## Restricciones
- Seguir patterns existentes en el repo
- NO usar `as any`
- [Items de NO TOCAR si aplican]

## Output esperado
[Qué archivos deben quedar modificados]
```

### Fix de migración/DB (Supabase MCP)

Si el error es de schema, tabla faltante, columna inexistente, o RLS:

1. Inspeccionar schema actual:
   ```
   CallMcpTool(server="user-supabase", toolName="list_tables",
     arguments={ "schemas": ["public"], "verbose": true })
   ```
2. Si necesita migración DDL:
   ```
   CallMcpTool(server="user-supabase", toolName="apply_migration",
     arguments={ "name": "[nombre]", "query": "[SQL]" })
   ```
3. Si necesita verificar data:
   ```
   CallMcpTool(server="user-supabase", toolName="execute_sql",
     arguments={ "query": "SELECT ..." })
   ```
4. Regenerar tipos después de cualquier cambio de schema:
   ```
   CallMcpTool(server="user-supabase", toolName="generate_typescript_types",
     arguments={})
   ```

→ Avanzá automáticamente a Fase 4.

---

## FASE 4 — VERIFY

Re-corré el comando que falló originalmente para confirmar que el fix resolvió el problema.

1. Si el error vino de `pnpm build` → correr `pnpm build`.
2. Si vino de `npx tsc` → correr `npx tsc --noEmit`.
3. Si vino de `pnpm lint` → correr `pnpm lint`.
4. Si vino de `pnpm test:unit` → correr `pnpm test:unit`.
5. Si vino de runtime (dev server) → correr `npx tsc --noEmit` como mínimo.

**Si pasa:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /terminal resuelto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Error: [tipo — mensaje corto]
## Root cause: [una oración]
## Fix: [qué se cambió]
## Verificación: [comando] ✅
```

**Si falla de nuevo:**
- Error diferente → volver a FASE 1 con el nuevo output (máx. 2 ciclos).
- Mismo error → reportar que el fix no fue suficiente, mostrar nuevo output, pedir input.

---

## Clasificación de errores de terminal

| Tipo | Patrones en el output | Dónde buscar |
|------|----------------------|--------------|
| **TypeScript / Build** | `TS2xxx`, `Type error`, `Cannot find module`, `Property does not exist` | Archivo:línea del error |
| **ESLint** | `error`, `warning`, regla entre comillas (`'react-hooks/exhaustive-deps'`) | Archivo:línea del error |
| **Runtime / Next.js** | `Error: `, `Unhandled`, `500`, `NEXT_`, stack trace con `at` | Stack trace → primer archivo en `src/` |
| **Supabase / DB** | `relation does not exist`, `column`, `violates`, `RLS`, `42P01` | Schema SQL + `list_tables` MCP |
| **Dependencias** | `Cannot find module`, `Module not found`, `peer dep`, `ERESOLVE` | `package.json`, `pnpm-lock.yaml` |
| **Auth / Env** | `401`, `403`, `NEXT_PUBLIC_`, `supabase`, `anon key` | `.env.local`, middleware |
| **Test** | `FAIL`, `expect(`, `toEqual`, `toBe`, `received` vs `expected` | Test file del error |
| **Migration** | `already exists`, `does not exist`, `duplicate key`, `syntax error at` | `supabase/migrations/`, MCP |
| **Deploy / Vercel** | `Build failed`, `Edge Runtime`, `Dynamic server usage` | `next.config.*`, server components |

---

## Manejo de errores

- **Output insuficiente:** pedí el comando exacto y más líneas de contexto.
- **Múltiples errores en cascada:** resolver el PRIMERO. Los demás suelen ser consecuencia.
- **Error en archivo auto-generado** (`database.types.ts`, `node_modules`): el fix está en otro lado.
  Regenerar tipos o reinstalar deps según corresponda.
- **Error de env/config:** guiá al usuario paso a paso (no delegues, estos son manuales).
- **Loop de errores (2 ciclos sin resolver):** parar, mostrar todo lo intentado, pedir intervención manual.

---

## Ejemplos de uso

```
/terminal [pega output]     → Analiza, diagnostica, fixea
/check [pega output]        → Alias de /terminal
"mirá este error: ..."      → Detecta automáticamente
"falló el build"            → Pide el output si no lo incluyó
"la terminal dice X"        → Analiza X
```
