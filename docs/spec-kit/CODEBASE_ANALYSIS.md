# Análisis Codebase vs Roadmap - StudyApp

**Fecha:** 2026-03-17  
**Contexto:** Revisión post-MVP con partes ya en producción.

---

## 1. Resumen ejecutivo

- **MVP + Free Study:** Completado según código y guía de testing manual.
- **Sprint 3 (Tracking & Reschedule):** Implementado en código pero el roadmap no lo refleja como completado.
- **Google Calendar:** Export, import de disponibilidad y detección de conflictos existen; la sincronización bidireccional (actualizar evento al completar) está implementada pero **desactivada** en producción (eventos no se emiten).
- **Deuda técnica y producción:** Sin CI/CD, sin error boundaries, sin `error.tsx`/`loading.tsx` a nivel de rutas, sin Sentry/Analytics. Varios TODOs abiertos.

---

## 2. Lo que falta (gaps)

### 2.1 Roadmap desactualizado

| Área | En roadmap | En codebase | Acción |
|------|------------|-------------|--------|
| Sprint 3 – Session tracking | ⏳ | ✅ `updateSessionStatus`, `completeSessionWithRating`, `rescheduleSession`, `markSessionIncomplete` | Marcar completado |
| Sprint 3 – Reschedule logic | ⏳ | ✅ Lógica en `sessions.ts` (attempts, auto-ABANDONED >3) | Marcar completado |
| Sprint 3 – Frontend Session actions | ⏳ | ✅ `SessionCard`, `CompleteSessionDialog`, `RescheduleDialog` | Marcar completado |
| Sprint 3 – Frontend Week view | ⏳ | ✅ `UnifiedCalendar` con week/2weeks/month, dashboard con `defaultView="week"` | Marcar completado |
| UC-011c – Conflict detection | ⏳ | ✅ `findConflictFreeSlot`, `checkConflicts` en session-generator y google-calendar.service | Marcar completado (falta solo UI de avisos si se desea) |
| UC-011d – Sync session updates | ⏳ | Handler listo, pero **emit desactivado** en `completeSessionWithRating` | Activar emit + marcar completado |

### 2.2 Funcionalidad incompleta o desactivada

1. **Sync a Google Calendar al completar/abandonar sesión (UC-011d)**  
   - **Dónde:** `src/lib/actions/sessions.ts` → `completeSessionWithRating` (y flujo de abandon).  
   - **Qué pasa:** `SessionEventRegistry.emitCompleted` está comentado. El handler `GoogleCalendarEventHandler` está registrado en `session-events.ts`, pero nunca se invoca.  
   - **Efecto:** En producción los eventos de Google no se actualizan (color/completado) al completar o abandonar.  
   - **Acción:** Descomentar y llamar `SessionEventRegistry.emitCompleted` (y `emitAbandoned` donde corresponda) tras actualizar la sesión en DB.

2. **Sesión parcial (tiempo restante al marcar INCOMPLETE)**  
   - **Dónde:** `src/components/features/sessions/session-card.tsx` línea ~101.  
   - **TODO:** "Implementar createPartialSession o usar reschedule modificado".  
   - **Comportamiento actual:** Se ofrece reagendar pero se abre el diálogo de reagendar normal, no se crea una sesión con duración = minutos restantes.  
   - **Acción:** Implementar `createPartialSession` (o equivalente) o documentar como mejora v1.1.

3. **Telegram notifications**  
   - **Dónde:** `src/lib/services/notifications/channels/telegram.channel.ts`.  
   - **Estado:** TODO, no implementado.  
   - **Acción:** Dejar para cuando se priorice Telegram (roadmap v1.x).

4. **Página de notificaciones completa**  
   - **Dónde:** `notification-bell.tsx` – TODO "Navegar a página de notificaciones completa si existe".  
   - **Acción:** Crear ruta `/dashboard/notifications` o eliminar TODO si no está en alcance.

### 2.3 Producción (Deployment Checklist 9.7)

| Item | Estado | Notas |
|------|--------|--------|
| CI/CD (GitHub Actions) | ❌ | No existe `.github/workflows` |
| Staging (Vercel Preview) | ? | Depende de configuración en Vercel |
| Production Supabase | ? | Asumido si “hay cosas en producción” |
| Error tracking (Sentry) | ❌ | No referencias en el repo |
| Analytics (Vercel Analytics) | ❌ | No referencias |
| Performance monitoring | ❌ | No referencias |

---

## 3. Mejoras recomendadas (lo que ya hay + producción)

### 3.1 Alta prioridad (estabilidad y producción)

1. **Activar eventos de sesión para Google Calendar**  
   - Descomentar en `sessions.ts` la llamada a `SessionEventRegistry.emitCompleted` (y `emitAbandoned` si se usa).  
   - Verificar que `topic_id` esté en el `select` de la sesión para el payload del evento.  
   - Impacto: UC-011d funciona en producción sin cambiar contrato del handler.

2. **Error boundaries y rutas de error**  
   - Roadmap 9.7: "Error boundaries – 3h" en High Priority, estado ⏳.  
   - No hay `error.tsx` en `src/app`.  
   - **Acción:** Añadir `error.tsx` (y opcionalmente `global-error.tsx`) en rutas clave: `(dashboard)`, `(auth)`, y/o rutas hijas críticas.

3. **Loading a nivel de ruta**  
   - Roadmap: "Loading states – 4h" ⏳.  
   - No hay `loading.tsx` en rutas; hay loading local en componentes (dashboard, sessions, subjects, settings, profile).  
   - **Acción:** Añadir `loading.tsx` en layouts/rutas principales para Suspense y mejor perceived performance.

4. **CI/CD mínimo**  
   - Ejecutar en cada PR: `lint`, `test:unit`, `build`.  
   - Opcional: `test:e2e` en un job separado o en schedule.  
   - Reduce riesgo de romper producción.

### 3.2 Prioridad media

5. **Tests E2E para UC-008 y UC-009**  
   - `e2e/study-flow.spec.ts` cubre hasta UC-007 y quick-add.  
   - No hay E2E para: completar sesión, reagendar, marcar incompleto.  
   - Añadir tests para flujo de sesiones (página `/dashboard/sessions`, completar, reagendar) aumentaría confianza en cambios de tracking.

6. **Optimistic updates (roadmap 9.7)**  
   - Estado ⏳.  
   - En listas (sesiones, materias, temas) se podría optimizar UX actualizando UI antes de la respuesta del servidor y revirtiendo en caso de error.

7. **Página dedicada a notificaciones**  
   - Si el producto apuesta por notificaciones in-app, una página `/dashboard/notifications` con lista y “marcar todas leídas” completaría el flujo (y permite quitar el TODO del bell).

### 3.3 Mejoras de código / consistencia

8. **Tipado en `notifications.ts`**  
   - Uso de `createClient() as any` en varios puntos.  
   - Mejorar con tipos de Supabase generados (`createClient()` sin cast) donde sea posible.

9. **Session events y topic_id**  
   - En `completeSessionWithRating` el `select` actual es `started_at, duration`.  
   - Para emitir `SessionCompletedEvent` se necesita `topic_id`; asegurar que esté en el select al activar el emit.

10. **Documentar comportamiento de conflictos**  
    - UC-011c: `checkConflicts` considera “cualquier evento” en el rango como conflicto.  
    - Si en el futuro se excluyen eventos de StudyApp o “disponible”, conviene documentarlo en `SESSION_GENERATION_LOGIC` o en el spec de UC-011.

---

## 4. Estado real por sprint (para actualizar roadmap)

- **Sprint 1:** ✅ Completado.  
- **Sprint 2:** ✅ Completado.  
- **Sprint 3:** ✅ Completado en código (tracking, reschedule, week view, acciones de sesión). Pendiente: actualizar 9.2/9.3 y 9.8 del roadmap y activar emit para UC-011d.  
- **Sprint 4:**  
  - Free Study: ✅.  
  - UC-011a (export): ✅.  
  - UC-011b (import disponibilidad): ✅.  
  - UC-011c (conflictos): ✅ en backend; UI de avisos opcional.  
  - UC-011d (sync updates): Handler ✅; falta activar emit en `sessions.ts`.  
- **Sprint 5–6 (Gamificación, Analytics, Tasks):** No iniciados; `user_stats` y tablas existen; `SessionEventRegistry` preparado para gamificación (comentado en `sessions.ts`).

---

## 5. Checklist de acciones sugeridas

- [ ] Actualizar `09-roadmap.md`: marcar Sprint 3 como completado y actualizar UC-011c/011d según párrafos anteriores.  
- [ ] Activar `SessionEventRegistry.emitCompleted` (y `emitAbandoned` si aplica) en `sessions.ts` y asegurar `topic_id` en el select.  
- [ ] Añadir `error.tsx` (y opcionalmente `loading.tsx`) en rutas principales.  
- [ ] Añadir workflow de GitHub Actions para lint + test:unit + build.  
- [ ] (Opcional) E2E para UC-008 y UC-009.  
- [ ] (Opcional) Resolver o documentar TODO `createPartialSession` en session-card.  
- [ ] (Futuro) Sentry, Vercel Analytics y métricas cuando se priorice producción formal.

---

*Documento generado a partir de análisis de codebase y `docs/spec-kit/09-roadmap.md`.*
