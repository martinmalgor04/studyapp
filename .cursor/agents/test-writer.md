---
  Tests con Vitest (unit/integration) y Playwright E2E. Triggers: "agregar test", "coverage",
  "UC-00x", regresión en `priority-calculator` / `session-generator`, "E2E login", Sprint 5
  gamificación, tests pendientes UC-008 / UC-009.
name: test-writer
model: inherit
description: Tests con Vitest (unit/integration) y Playwright E2E. Triggers: "agregar test", "coverage",   "UC-00x", regresión en `priority-calculator` / `session-generator`, "E2E login", Sprint 5   gamificación, tests pendientes UC-008 / UC-009.|
---

# Test Writer — StudyApp

## Unit e integration (Vitest)

- **Ubicación:** `src/__tests__/unit/services/` y `src/__tests__/integration/`.
- **Cantidad aproximada:** ~60 casos `it(...)` repartidos en:
  - `priority-calculator.test.ts` (~29) — suite etiquetada `describe('UC-006: Priority Calculator', ...)`
  - `session-generator.test.ts` (~27)
  - `topic-session-flow.test.ts` (~4) — integración topic → generate → insert
- **Estilo real del proyecto:**

```ts
import { describe, it, expect } from 'vitest';
import { calculatePriority, daysBetween } from '@/lib/services/priority-calculator';
```

## Casos edge de dominio (prioridad)

Cubrí o extendé según `priority-calculator.ts`:

- `daysToExam === null` → urgencia 0
- Ventanas de urgencia (≤3, ≤7, ≤14, … días al examen)
- `isFinal === true` → piso de urgencia 30
- Umbrales de score → `CRITICAL` / `URGENT` / `IMPORTANT` / `NORMAL` / `LOW`
- `daysBetween` con fechas invertidas (negativo) y mismo día

## Casos edge (session-generator)

Alineados a tests existentes y código:

- Modo PARCIAL vs FREE_STUDY / finales (`FINAL_THEORY`, `FINAL_PRACTICE`)
- 4 sesiones, intervalos `[1,3,7,14]`, duración mínima 15 min
- Multiplicadores `EASY` 0.7, `MEDIUM` 1.0, `HARD` 1.3 y factores `[0.60, 0.35, 0.30, 0.25]`
- Mock de `calculatePriority` donde el test ya lo usa

**Nota:** `generateSessionsForTopic` integra Google Calendar en runtime; en tests suele haber **mocks** de módulos — seguí el patrón de `session-generator.test.ts`.

## E2E (Playwright)

- **Archivos:** `e2e/auth.spec.ts`, `e2e/study-flow.spec.ts`, fixtures en `e2e/fixtures/`.
- **~22 tests** (`test(...)`) — describe blocks con casos de uso:
  - **UC-001 & UC-002:** auth (`auth.spec.ts`)
  - **UC-003:** materias
  - **UC-004:** exámenes
  - **UC-005:** topics
  - **UC-006:** generación de sesiones (implícita en flujos)
  - **UC-007:** dashboard
- **Auth autenticado:** fixture `authenticatedPage` desde `e2e/fixtures/auth.fixture.ts`.

## E2E pendientes (planificar)

| UC | Qué testear (propuesta) |
|----|-------------------------|
| **UC-008** | Notificaciones in-app / campana / lista: marcar leída, contador unread, flujo feliz + sin datos. |
| **UC-009** | Ajuste por conflicto de Calendar en UI: sesión con `adjusted_for_conflict` visible (badge) y/o flujo de importación/preview si aplica al spec. |

## Sprint 5 — tests a anticipar

Cuando existan `streak-calculator`, `points-calculator`, `achievement-checker`:

- Tablas de reglas puras (sin I/O)
- Casos límite: racha rota, mismo día, puntos negativos/no permitidos, achievement idempotente

## Comandos exactos

```bash
pnpm test:unit          # Vitest run (CI-style)
pnpm test               # Vitest watch (dev)
pnpm test:e2e           # Playwright
pnpm test:e2e:ui        # Playwright UI
pnpm test:all           # unit + e2e
```

## Cierre de tarea (reporte estructurado)

```text
## Tests agregados/modificados
- Archivos: [...]
- describe/it nuevos: [nombres]

## Comando ejecutado
- pnpm ...

## Resultado
- pass / fallos
```

**Siguiente paso:** **`code-reviewer`** antes del commit.
