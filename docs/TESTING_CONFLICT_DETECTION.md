# 🧪 Testing Manual: Conflict Detection & UI Indicators (UC-011c)

**Feature**: UC-011c - Detectar conflictos con Google Calendar y mostrar indicadores visuales  
**Implementado**: 2026-03-18  
**Versión**: 1.0

---

## 🎯 Objetivo

Verificar que las sesiones ajustadas por conflictos con Google Calendar:
1. Se detecten correctamente durante la generación
2. Se guarden con los campos `adjusted_for_conflict` y `original_scheduled_at`
3. Se muestren con un badge visual en la UI

---

## 📋 Pre-requisitos

- [ ] Google Calendar conectado en `/dashboard/settings`
- [ ] Al menos 2 eventos futuros en Google Calendar (para crear conflictos)
- [ ] Supabase local corriendo con la migration `20260318111719_add_conflict_tracking.sql` aplicada
- [ ] Base de datos con al menos 1 subject y 1 exam

---

## 🧪 Casos de Prueba

### Test 1: Generar sesiones CON conflictos

**Objetivo**: Verificar que el sistema detecta conflictos y ajusta automáticamente

**Pasos**:
1. Ir a Google Calendar y crear un evento:
   - Fecha: Mañana a las 10:00
   - Duración: 2 horas
   
2. En StudyApp, crear un nuevo topic:
   - Subject: Cualquier materia
   - Exam: Cualquier parcial/final con fecha en 2 semanas
   - Hours: 120 minutos
   - Source Date: Hoy (para que R1 caiga mañana)

3. Guardar el topic y esperar a que se generen las sesiones

**Resultado esperado**:
- ✅ Las sesiones se generan exitosamente
- ✅ En la consola del servidor aparece: `[SessionGenerator] Session N adjusted to avoid conflict: <nueva_fecha>`
- ✅ Al menos una sesión tiene `adjusted_for_conflict = true`
- ✅ Esa sesión tiene `original_scheduled_at` con la fecha que iba a ser originalmente

**Verificación en DB**:
```sql
SELECT 
  id, 
  number, 
  scheduled_at, 
  original_scheduled_at,
  adjusted_for_conflict
FROM sessions
WHERE topic_id = '<topic_id>'
ORDER BY number;
```

---

### Test 2: Visualizar badge de conflicto

**Objetivo**: Verificar que el badge visual aparece en la UI

**Pasos**:
1. Ir a `/dashboard/sessions` (vista de lista)
2. Buscar la sesión que fue ajustada en Test 1

**Resultado esperado**:
- ✅ La tarjeta de sesión muestra un badge adicional: `⚠️ Ajustada por conflicto`
- ✅ El badge tiene estilo amber (bg-amber-100, text-amber-800)
- ✅ Al hacer hover sobre el badge, aparece un tooltip con la fecha original

**Apariencia esperada**:
```
┌─────────────────────────────────────────┐
│ 🟠 URGENTE  ⏰ Pendiente                │
│ ⚠️ Ajustada por conflicto               │ ← ESTE BADGE
│                                          │
│ R1 - Matemática: Límites                │
│ 📅 Mañana, 18/03 - 12:00                │ ← Fecha ajustada
│ ⏱️ 72 minutos                            │
│                                          │
│ [Comenzar] [Completar] [Reagendar]      │
└─────────────────────────────────────────┘
```

---

### Test 3: Generar sesiones SIN conflictos

**Objetivo**: Verificar que sesiones sin conflictos no se marcan como ajustadas

**Pasos**:
1. Crear un nuevo topic con fecha de clase en una semana (sin eventos en Google Calendar)
2. Guardar y verificar las sesiones generadas

**Resultado esperado**:
- ✅ Todas las sesiones tienen `adjusted_for_conflict = false`
- ✅ Todas las sesiones tienen `original_scheduled_at = null`
- ✅ No aparece ningún badge de conflicto en la UI

---

### Test 4: Tooltip con fecha original

**Objetivo**: Verificar que el tooltip muestra la fecha original formateada correctamente

**Pasos**:
1. Usar una sesión ajustada del Test 1
2. Hacer hover sobre el badge "⚠️ Ajustada por conflicto"

**Resultado esperado**:
- ✅ Aparece un tooltip HTML nativo
- ✅ El tooltip muestra: `"Reagendada desde <fecha_original>"`
- ✅ La fecha está en formato español: `dd/mm/yyyy, HH:MM`

**Ejemplo de tooltip**:
```
Reagendada desde 18/03/2026, 10:00
```

---

### Test 5: Modo Countdown (Finales)

**Objetivo**: Verificar que el conflict detection funciona también en modo countdown

**Pasos**:
1. Crear un evento en Google Calendar:
   - Fecha: Dentro de 2 días a las 15:00
   - Duración: 1 hora

2. Crear un topic de tipo Final:
   - Exam: Final en 2 semanas
   - Hours: 90 minutos

3. Guardar y verificar sesiones

**Resultado esperado**:
- ✅ Las sesiones se generan en orden inverso (R4 cerca del final)
- ✅ Si alguna sesión cae en el evento de Google Calendar, se ajusta
- ✅ El badge de conflicto aparece correctamente

---

## 🐛 Casos Edge

### Edge 1: Múltiples conflictos consecutivos

**Escenario**: Varios eventos seguidos en Google Calendar

**Pasos**:
1. Crear 3 eventos consecutivos en días seguidos
2. Crear topic que genere sesiones en esas fechas

**Resultado esperado**:
- ✅ El algoritmo salta día por día hasta encontrar slot libre
- ✅ Máximo 14 intentos (configurable en `findConflictFreeSlot`)
- ✅ Si no encuentra slot, usa la fecha preferida y muestra warning en consola

---

### Edge 2: Sin Google Calendar conectado

**Escenario**: Usuario sin tokens de Google Calendar

**Pasos**:
1. Desconectar Google Calendar desde `/dashboard/settings`
2. Crear un nuevo topic

**Resultado esperado**:
- ✅ Las sesiones se generan normalmente
- ✅ Todas tienen `adjusted_for_conflict = false`
- ✅ No hay badges de conflicto
- ✅ No hay errores en consola

---

### Edge 3: Conflicto parcial (evento más corto)

**Escenario**: Evento de Google Calendar más corto que la sesión

**Pasos**:
1. Crear evento de 30 minutos a las 10:00
2. Crear topic con sesiones de 90 minutos

**Resultado esperado**:
- ✅ Si la sesión se superpondría aunque sea parcialmente, se detecta conflicto
- ✅ La sesión se mueve al día siguiente

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Detección de conflictos | 100% | ⏳ Por verificar |
| Ajuste automático | 100% | ⏳ Por verificar |
| Badge visible en UI | 100% | ⏳ Por verificar |
| Tooltip funcional | 100% | ⏳ Por verificar |
| Sin errores en consola | 0 errores | ⏳ Por verificar |

---

## 🔍 Logs a Monitorear

Durante el testing, verificar estos logs en la consola del servidor:

```bash
# Conflicto detectado y ajustado
[SessionGenerator] Session 1 adjusted to avoid conflict: 2026-03-19T10:00:00.000Z

# No se pudo encontrar slot sin conflictos (edge case)
[SessionGenerator] No conflict-free slot found after 14 attempts, using preferred date
```

---

## ✅ Checklist Final

- [ ] Test 1: Sesiones con conflictos se ajustan correctamente
- [ ] Test 2: Badge de conflicto aparece en UI
- [ ] Test 3: Sesiones sin conflictos no tienen badge
- [ ] Test 4: Tooltip muestra fecha original
- [ ] Test 5: Modo countdown funciona con conflictos
- [ ] Edge 1: Múltiples conflictos manejados
- [ ] Edge 2: Sin Google Calendar no rompe nada
- [ ] Edge 3: Conflictos parciales detectados
- [ ] Logs de servidor muestran información correcta
- [ ] Base de datos tiene datos consistentes

---

## 🚀 Próximos Pasos

Una vez completado el testing manual:

1. ✅ Marcar UC-011c como 100% completado en roadmap
2. ⏳ Regenerar tipos TypeScript cuando Docker esté disponible (`pnpm db:types`)
3. ⏳ Considerar agregar tests automatizados con Playwright (ver `E2E_TESTING.md`)
4. ⏳ Considerar agregar warning en TopicForm si se detectan conflictos potenciales

---

**Documentado por**: AI Agent  
**Fecha**: 2026-03-18  
**Estado**: ✅ Implementación completa, testing manual pendiente
