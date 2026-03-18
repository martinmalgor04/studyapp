# Google Calendar Integration - Análisis de Gaps

## Estado Actual vs Roadmap (Sprint 4)

### ✅ Completamente Implementado

#### UC-011a: Export Sessions to Calendar
- ✅ Google OAuth Setup (`google-calendar.service.ts`)
- ✅ `createEventForSession()` - Crear eventos en GCal
- ✅ `syncSessionsToGoogleCalendar()` - Sincronización masiva
- ✅ UI: Botón "Sync to Google Calendar" en Settings
- ✅ Manejo de tokens y refresh automático

**Archivo**: `src/lib/services/google-calendar.service.ts`

#### UC-011c: Detect Schedule Conflicts (Backend)
- ✅ `checkConflicts()` - Verificar si hay eventos en un rango
- ✅ `findConflictFreeSlot()` - Buscar slot disponible (hasta 14 intentos)
- ✅ Integración con Session Generator (modo Forward y Countdown)
- ✅ Logs cuando una sesión se ajusta por conflicto

**Archivo**: `src/lib/services/session-generator.ts`

```typescript
// Implementado:
const result = await findConflictFreeSlot(userId, scheduledDate, duration);
if (result.adjusted) {
  console.log(`Session ${sessionNumber} adjusted to avoid conflict`);
}
```

#### UC-011d: Sync Session Updates (Backend)
- ✅ `GoogleCalendarEventHandler` - Observador de eventos
- ✅ `onSessionCompleted()` - Actualiza color a verde
- ✅ `onSessionAbandoned()` - Elimina evento
- ✅ Event Registry registrado
- ✅ **ACTIVADO** en `completeSessionWithRating()`, `updateSessionStatus()`, `rescheduleSession()`, `processOverdueSessions()`

**Archivo**: `src/lib/services/google-calendar-event-handler.ts`

#### UC-011b: Import Availability from Calendar (Backend)
- ✅ `AvailabilityImporterService` - Algoritmo de detección de slots
- ✅ `detectAvailableSlots()` - Encuentra gaps entre eventos
- ✅ `consolidateSlots()` - Agrupa slots contiguos
- ✅ `importAvailabilityFromGoogleCalendar()` - Server action
- ✅ Componentes UI: `WeeklyScheduler`, `AvailabilityCalendarGrid`
- ✅ Página: `/dashboard/settings/availability` con botón de importar

**Archivo**: `src/lib/services/availability-importer.service.ts`

---

## 🟡 Parcialmente Implementado (Falta UI/UX)

### 1. UC-011b: Import Availability - Preview UI 🟡

**Estado**: Backend ✅ | UI falta mejoras

**Lo que funciona:**
- Botón "Importar desde Google Calendar" existe
- Algoritmo de detección funcional
- Se guardan slots en DB

**Lo que falta:**
- Preview visual de slots detectados **ANTES** de guardar
- Mostrar cuántos slots se encontraron (ej: "42 slots detectados")
- Permitir ajustar/editar slots antes de confirmar
- Comparación lado a lado: "Actual" vs "Importado"

**Ubicación esperada:**
```tsx
// src/components/features/availability/import-preview-dialog.tsx (CREAR)

<Dialog>
  <h2>Disponibilidad detectada desde Google Calendar</h2>
  
  <Stats>
    📊 Slots detectados: 42
    ✅ Slots válidos (≥30min): 35
    ⚠️ Slots descartados (<30min): 7
  </Stats>

  <Comparison>
    <Column title="Actual">
      {/* Slots existentes */}
    </Column>
    <Column title="Nuevo (Importado)">
      {/* Slots detectados */}
    </Column>
  </Comparison>

  <Actions>
    <Button onClick={handleReplace}>Reemplazar todo</Button>
    <Button onClick={handleMerge}>Combinar con actual</Button>
    <Button onClick={handleCancel}>Cancelar</Button>
  </Actions>
</Dialog>
```

**Estimación:** 2-3h

---

### 2. UC-011c: Conflict Detection - UI Warnings/Indicators 🟡

**Estado**: Backend ✅ | UI sin indicadores visuales

**Lo que funciona:**
- Detección automática de conflictos al generar sesiones
- Ajuste automático de fecha (busca slot libre)
- Logs en consola: "Session adjusted to avoid conflict"

**Lo que falta:**

#### A. Indicador en SessionCard

Mostrar badge cuando una sesión fue ajustada por conflicto:

```tsx
// src/components/features/sessions/session-card.tsx (MODIFICAR)

{session.adjusted_for_conflict && (
  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
    <svg className="w-3 h-3 mr-1">⚠️</svg>
    Reagendada por conflicto
  </Badge>
)}
```

**Problema:** La columna `adjusted_for_conflict` **no existe** en la tabla `sessions`.

**Solución:** Agregar migration:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_conflict_tracking.sql
ALTER TABLE sessions 
ADD COLUMN adjusted_for_conflict BOOLEAN DEFAULT FALSE,
ADD COLUMN original_scheduled_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN sessions.adjusted_for_conflict IS 'Si la sesión fue movida para evitar conflicto con Google Calendar';
COMMENT ON COLUMN sessions.original_scheduled_at IS 'Fecha original propuesta antes de ajustar por conflicto';
```

Modificar `findConflictFreeSlot()`:

```typescript
// src/lib/services/session-generator.ts

async function findConflictFreeSlot(...) {
  const originalDate = preferredDate;
  // ... buscar slot libre ...
  
  return { 
    date: currentDate, 
    adjusted: attempts > 0,
    originalDate: attempts > 0 ? originalDate : null 
  };
}

// Al crear sesión:
{
  scheduled_at: result.date,
  adjusted_for_conflict: result.adjusted,
  original_scheduled_at: result.originalDate
}
```

#### B. Warning al crear Topic/Session manualmente

```tsx
// src/components/features/topics/topic-form.tsx (MODIFICAR)

{hasConflicts && (
  <Alert variant="warning">
    <AlertIcon>⚠️</AlertIcon>
    <AlertTitle>Posibles conflictos detectados</AlertTitle>
    <AlertDescription>
      Tienes eventos en Google Calendar en los días propuestos.
      Las sesiones se ajustarán automáticamente.
      
      <Button onClick={showDetails}>Ver detalles</Button>
    </AlertDescription>
  </Alert>
)}
```

**Estimación:** 
- Migration: 30min
- UI indicators: 2h
- Verification: 30min
**Total: 3h**

---

### 3. UC-011d: Sync Updates - Event Listeners (Más contexto) 🟡

**Estado**: Event listeners ✅ | Falta feedback visual inmediato

**Lo que funciona:**
- `SessionEventRegistry.emitCompleted()` → Handler actualiza GCal
- `SessionEventRegistry.emitAbandoned()` → Handler elimina evento
- Se ejecuta correctamente en background

**Lo que podría mejorarse:**

#### A. Feedback visual al usuario

Actualmente el sync es silencioso. El usuario no sabe si se sincronizó.

```tsx
// src/components/features/sessions/complete-session-dialog.tsx (MODIFICAR)

const handleComplete = async (rating) => {
  const result = await completeSessionWithRating(sessionId, rating);
  
  if (result.success) {
    // Mostrar toast:
    toast.success("✅ Sesión completada y sincronizada con Google Calendar");
  }
};
```

#### B. Indicador de estado de sync

```tsx
// src/components/features/sessions/session-card.tsx

{session.google_event_id && (
  <Tooltip content="Sincronizada con Google Calendar">
    <GoogleIcon className="w-4 h-4 text-blue-500" />
  </Tooltip>
)}
```

**Estimación:** 1-2h (opcional, nice-to-have)

---

## 📊 Resumen de Gaps

| Feature | Backend | UI | Gap | Estimación |
|---------|---------|-----|-----|------------|
| UC-011a Export | ✅ | ✅ | - | - |
| UC-011b Import | ✅ | 🟡 | Preview Dialog falta | 2-3h |
| UC-011c Conflicts | ✅ | 🟡 | Indicadores visuales faltan | 3h |
| UC-011d Sync Updates | ✅ | 🟡 | Feedback visual opcional | 1-2h |

**Total estimado para completar al 100%:** 6-8h

---

## 🎯 Priorización Sugerida

### Alta Prioridad (Hacer ahora)

1. **UC-011c UI Indicators** (3h)
   - **Por qué**: Mejora UX significativamente. Usuario necesita saber si sus sesiones están en conflicto.
   - **Impacto**: Alto - Visibilidad de un feature ya implementado
   - Migration + UI changes

### Media Prioridad (Próximo sprint)

2. **UC-011b Preview Dialog** (2-3h)
   - **Por qué**: Permite al usuario revisar antes de importar masivamente
   - **Impacto**: Medio - Previene errores en configuración inicial

### Baja Prioridad (Nice-to-have)

3. **UC-011d Sync Feedback** (1-2h)
   - **Por qué**: El sync ya funciona, solo falta feedback visual
   - **Impacto**: Bajo - Mejora percepción pero no funcionalidad

---

## 🚀 Plan de Implementación

### Sprint Actual (Semana actual)

**Objetivo:** Completar UC-011c UI warnings

**Tareas:**

```markdown
- [ ] Migration: Agregar `adjusted_for_conflict`, `original_scheduled_at` a `sessions`
- [ ] Modificar `findConflictFreeSlot()` para retornar `originalDate`
- [ ] Modificar Session Generator para guardar campos de tracking
- [ ] Agregar badge en `SessionCard` para mostrar ajustes
- [ ] Agregar warning en `TopicForm` si hay conflictos detectados
- [ ] Testing: Crear topic con fechas que conflictúen con GCal
- [ ] Verificar que el badge aparece correctamente
```

**Entregable:** UC-011c al 100% ✅

### Próximo Sprint

**Objetivo:** Completar UC-011b Preview

**Tareas:**

```markdown
- [ ] Crear `ImportPreviewDialog.tsx`
- [ ] Endpoint: `importAvailabilityFromGoogleCalendar()` retornar preview
- [ ] UI: Mostrar stats (slots detectados, válidos, descartados)
- [ ] UI: Comparación lado a lado (actual vs importado)
- [ ] Opciones: Reemplazar / Combinar / Cancelar
- [ ] Testing: Importar desde calendario con 20+ eventos
```

**Entregable:** UC-011b al 100% ✅

---

## 🔍 Notas Técnicas

### Tabla `sessions` - Campos para Conflict Tracking

```sql
CREATE TABLE sessions (
  -- ... campos existentes ...
  
  -- NUEVOS (para UC-011c)
  adjusted_for_conflict BOOLEAN DEFAULT FALSE,
  original_scheduled_at TIMESTAMPTZ NULL,
  
  -- Existente
  google_event_id TEXT NULL
);
```

### Flow Completo UC-011c

```
1. Usuario crea Topic (UC-005)
   ↓
2. Session Generator calcula fechas ideales
   ↓
3. findConflictFreeSlot() verifica cada fecha:
   ├─ NO conflict → usar fecha propuesta
   └─ SI conflict → buscar siguiente día libre
   ↓
4. Guardar sesión con:
   - scheduled_at: fecha final (ajustada o no)
   - adjusted_for_conflict: true/false
   - original_scheduled_at: fecha propuesta (si ajustada)
   ↓
5. UI muestra badge:
   "⚠️ Reagendada por conflicto"
   Tooltip: "Propuesta: 15/03 → Final: 17/03"
```

---

## ✅ Conclusión

**Google Calendar Integration está 85% completo:**

- Core functionality: ✅ 100%
- Backend services: ✅ 100%
- Basic UI: ✅ 100%
- **Advanced UI/UX: 🟡 60%** ← Esto es lo que falta

Las funcionalidades críticas están implementadas y funcionando. Lo que falta son **mejoras de UX** para hacer el feature más visible y usable para el usuario final.

**Recomendación:** Implementar UC-011c UI warnings primero (3h), es el gap más crítico en términos de experiencia de usuario.
