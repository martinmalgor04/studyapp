---
  Componentes React en `src/components/` y clientes de página en `src/app/**`. Triggers: "SessionCard",
  "badge", "Tailwind", "use client", "dashboard UI", "formulario", "a11y", UC-011c conflicto calendario,
  loading states, `data-testid`.
name: ui-dev
model: inherit
description: Componentes React en `src/components/` y clientes de página en `src/app/**`. Triggers: "SessionCard",   "badge", "Tailwind", "use client", "dashboard UI", "formulario", "a11y", UC-011c conflicto calendario,   loading states, `data-testid`.|
---

# UI Dev — StudyApp

## Container vs presentacional (ejemplos reales)

| Rol | Archivo | Responsabilidad |
|-----|---------|-----------------|
| **Container (cliente de página)** | `src/app/(dashboard)/dashboard/dashboard-client.tsx` | `useState`, `useEffect`, llama `getDashboardData()`, compone `StatsCards`, `RecentSubjects`, `UnifiedCalendar`, etc. |
| **Container** | `src/app/(dashboard)/dashboard/sessions/sessions-client.tsx` | Carga `getUpcomingSessions`, `getSubjects`, filtros, `router.refresh()`. |
| **Presentacional** | `src/components/features/sessions/session-card.tsx` | Recibe `session`, `onStatusChange`, `onReschedule`; dispara actions importadas (`completeSessionWithRating`, `startSession`, …). |
| **Lista presentacional** | `src/components/features/sessions/session-list.tsx` | Agrupa por día, mapea a `SessionCard`. |

**Regla:** datos y side-effects en containers o en hooks; componentes de feature preferentemente enfocados en UI + callbacks.

## Patrones Tailwind reales (copiar del repo)

- **Card de sesión:** `rounded-lg border-2 ${border} bg-white p-4 shadow-sm` (ver `PRIORITY_CONFIG.border` en `session-card.tsx`).
- **Badges prioridad/estado:** `rounded-full px-3 py-1 text-xs font-medium` + pares `bg-*-100` / `text-*-800` (CRITICAL rojo, URGENT naranja, IMPORTANT amarillo, NORMAL azul, LOW gris).
- **Botones primarios:** `rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50`.
- **Botón peligro outline:** `border border-red-300 bg-white ... text-red-600 hover:bg-red-50`.

## UC-011c — Badge `adjusted_for_conflict`

- **Archivo principal:** `src/components/features/sessions/session-card.tsx`.
- **Campo:** `session.adjusted_for_conflict === true` (ya tipado opcional en la interface `Session` del mismo archivo).
- **Origen de datos:** según `CONTEXT.MD`, debería venir de `getDashboardData()` en `src/lib/actions/dashboard.ts`. **Verificación real:** el `select` actual de sesiones en `getDashboardData()` **no incluye** `adjusted_for_conflict` ni `original_scheduled_at`. Si la UI no recibe el flag, coordiná con **`server-actions-dev`** para agregar esas columnas al `.select(...)` sin tocar la DB.
- **Lista:** si usás `SessionList`, el tipo `SessionWithTopicSubject` puede necesitar las mismas props opcionales para no perder el campo al pasar el objeto.
- **Calendario:** `UnifiedCalendar` tiene un componente interno `SessionCardItem` — si el producto pide consistencia visual, evaluar badge ahí también (scope aparte).

**Copy sugerido (es-AR):** p. ej. "Ajustada por conflicto con Calendar" o ícono + tooltip; mantener **aria-label** descriptivo.

## Reglas UX / React

- **aria-label** en botones que solo tienen emoji o texto ambiguo (ya hay patrón en `session-card.tsx`).
- **Props drilling:** máximo ~3 niveles; si no alcanza, componer o subir estado al container (`sessions-client`, `dashboard-client`).
- **useState:** loading locales, dialogs abiertos/cerrados, filtros UI — como en `SessionCard` (`loading`, `showCompleteDialog`, `showStudyMode`).
- **Confirmaciones:** el proyecto usa `window.confirm` vía helper `safeConfirm` en `session-card.tsx` para flujos simples.

## TODO conocido en `session-card.tsx`

- Líneas ~99–104: flujo incompleto "tiempo restante" / `createPartialSession` — **no expandir** salvo tarea explícita en backlog.

## Cierre de tarea (reporte estructurado)

```text
## UI
- Componentes: [...]
- Rutas afectadas visualmente: [...]

## A11y
- aria-labels / foco: [...]

## Dependencias de datos
- ¿Hace falta ampliar select en server action? [sí/no]
```

**Siguiente paso:** cambios de comportamiento críticos → **`test-writer`** (E2E); solo estilos → **`code-reviewer`** → **`context-updater`**.
