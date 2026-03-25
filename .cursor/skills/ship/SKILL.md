---
name: ship
description: >-
  Flujo completo de entrega end-to-end para StudyApp: fetch desde Notion, planificación,
  delegación a agentes especializados, code review, tests, commit y cierre en Notion.
  Usar cuando el usuario escribe "/ship", "/ship [nombre de tarea]", "ship esta tarea",
  "procesá la siguiente tarea", o cualquier variante que implique llevar una tarea del
  backlog hasta commit confirmado.
---

# /ship — StudyApp

Flujo de entrega **end-to-end**. Llevás una tarea desde Notion hasta el commit confirmado, pasando por implementación, review, tests y cierre. Español rioplatense siempre.

**Regla de oro:** nunca saltear una fase, nunca commitear sin confirmación explícita, si algo falla parar y avisar con claridad.

---

## Referencias rápidas

### Comandos del proyecto

| Paso | Comando |
|------|---------|
| TypeScript check | `npx tsc --noEmit` |
| Lint | `pnpm lint` |
| Unit tests | `pnpm test:unit` |
| Build | `pnpm build` |
| E2E (opcional) | `pnpm test:e2e` |

### Agentes especializados

| Agente | Cuándo |
|--------|--------|
| `server-actions-dev` | Cambios en `src/lib/actions/` |
| `services-dev` | Cambios en `src/lib/services/` |
| `ui-dev` | Cambios en `src/components/` o `src/app/**/` |
| `test-writer` | Agregar o modificar tests |
| `ship-reviewer` | Fase 4 (review) y Fase 5 (tests/build) |
| `context-updater` | Fase 7 (cierre + sync Notion) |

### Protocolo Notion (actualizar en cada transición)

| Momento | Acción |
|---------|--------|
| Fase 1 completa | Estado → **"En curso"** |
| Fase 2 completa | Escribir subtareas como checklist en la página |
| Fase 3 completa | Escribir sección "Trabajo realizado" + marcar subtareas `[x]` |
| Fase 4/5 fallo | Estado → **"Bloqueado"** + detalle del error en Notas |
| Fase 5 completa | Agregar resultados tsc/lint/tests/build a la página |
| Fase 6 completa | Agregar hash del commit en Notas |
| Fase 7 | Estado → **"Hecho"**; delegar resto a `context-updater` |

**Si Notion falla:** avisar pero no bloquear el flujo. Anotar qué quedó sin sincronizar.

### Formato de anuncio de fase

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FASE N/7 — NOMBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FASE 1 — FETCH

1. Si el usuario pasó nombre (p. ej. `/ship UC-011c`), buscarlo en Notion vía MCP (`notion`).
2. Si no pasó nombre, buscar tareas **"En curso"** o **"Por hacer"**, priorizando Alta.
3. Mostrar lista numerada: nombre, estado, prioridad, sprint.
4. Preguntar: **"¿Cuál procesamos? (número o nombre)"**

**Fallback si Notion falla:** leer `CONTEXT.MD` sección "Próxima tarea" y proponer esa.

**Al elegir tarea:** extraer nombre, descripción, archivo principal, notas, sprint, prioridad, estimación.

**→ Notion:** si estado es "Por hacer", cambiarlo a **"En curso"** ahora.

---

## FASE 2 — PLAN

1. Leer `CONTEXT.MD` completo (backlog, NO TOCAR, mapa de código).
2. Generar **subtareas concretas** (archivo + descripción en una oración).
3. Determinar si son **paralelas** (archivos completamente distintos) o **secuenciales** (archivos compartidos o dependencia de output).
4. Mostrar plan:

```
## Plan para: [nombre tarea]

### Subtareas
1. [descripción] → archivo(s) → agente: [nombre]
2. [descripción] → archivo(s) → agente: [nombre]

### Ejecución: [paralela / secuencial]
Justificación: [por qué]

### Items de NO TOCAR relevantes
- [si aplica]
```

5. Preguntar: **"¿Arrancamos con este plan o querés cambiar algo?"**
6. Solo si confirma → **Notion:** escribir subtareas como checklist en la página.

---

## FASE 3 — DELEGATE

Activar agentes según el plan. Regla de routing:

| Archivos tocados | Agente |
|------------------|--------|
| `src/lib/actions/*.ts` | `server-actions-dev` |
| `src/lib/services/**` | `services-dev` |
| `src/components/**`, `src/app/**/` | `ui-dev` |
| Mixto sin solapamiento | Paralelo |
| Mixto con archivos compartidos | Secuencial |

Al terminar → **Notion:** sección "Trabajo realizado" + subtareas completadas como `[x]`.

Mostrar resumen al usuario con archivos tocados por agente.

---

## FASE 4 — REVIEW

Delegar a **`ship-reviewer`** (solo review, no tests).

Esperar reporte:
```
REVIEW_STATUS: PASS | FAIL
BLOQUEANTES: [...]
ADVERTENCIAS: [...]
```

- **FAIL:** parar, mostrar bloqueantes, ofrecer 1 intento de fix, re-run. Si sigue fallando: parar definitivamente. Notion → "Bloqueado".
- **PASS:** mostrar advertencias como info y continuar.

---

## FASE 5 — TEST

Delegar a **`ship-reviewer`** (solo tests/build). Orden estricto; si uno falla no correr el siguiente:

1. `npx tsc --noEmit`
2. `pnpm lint`
3. `pnpm test:unit`
4. `pnpm build`

Esperar reporte:
```
TEST_STATUS: PASS | FAIL
FASE_FALLIDA: [tsc | lint | unit | build | ninguna]
ERROR: [mensaje exacto | ninguno]
```

- **FAIL:** parar, mostrar error, ofrecer 1 intento de fix, re-run completo. Notion → "Bloqueado".
- **PASS:** Notion → agregar resultados de verificación. Continuar a Fase 6.

---

## FASE 6 — COMMIT

1. `git diff --stat` + `git diff` para ver cambios.
2. Generar mensaje **Conventional Commits** en español:
   ```
   tipo(scope): descripción en infinitivo

   Cuerpo opcional.
   ```
   Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

3. Mostrar: archivos modificados + mensaje propuesto + resumen 2-3 líneas.
4. Preguntar: **"¿Commiteamos con este mensaje, lo modificás, o cancelás?"**
   - Confirma → `git add [archivos] && git commit -m "..." && git push`
   - Modifica → pedir nuevo mensaje
   - Cancela → dejar staged sin commit

**→ Notion:** agregar hash corto en Notas. **NUNCA commitear sin confirmación explícita.**

---

## FASE 7 — CLOSE

Delegar a **`context-updater`** con: qué se implementó, archivos tocados, commit hash, próxima tarea sugerida.

`context-updater` actualiza `CONTEXT.MD` y cierra la tarea en Notion (**"Hecho"** + fecha).

Mostrar resumen final:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /ship completado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Implementado
- [2-3 bullets]

## Verificación
- TypeScript: ✅ | Lint: ✅ | Unit tests: ✅ | Build: ✅
- Code review: ✅ (N advertencias)

## Commit
- Hash: [hash corto]
- Mensaje: [mensaje]

## Próxima tarea
→ [nombre]
```

---

## Manejo de errores

- **Notion falla:** continuar sin Notion; avisar que queda sync manual pendiente.
- **Agente delegado falla:** mostrar error, preguntar si reintentar o intervenir manualmente.
- **Usuario dice "cancelá":** parar, mostrar qué quedó hecho, ofrecer cierre parcial con `context-updater`.
- **Nunca silenciar un error.** Siempre mostrarlo con contexto para debuggear.
