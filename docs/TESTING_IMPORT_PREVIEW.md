# Testing: Import Preview Dialog

## Implementación Completada

Se ha implementado el flujo completo de preview antes de importar disponibilidad desde Google Calendar.

## Archivos Modificados

1. **`src/lib/actions/availability.ts`**
   - ✅ Agregada `previewAvailabilityFromGoogleCalendar()`
   - Detecta slots sin guardar en BD
   - Calcula estadísticas (total, válidos, descartados, horas totales)
   - Obtiene slots existentes para comparación

2. **`src/components/features/availability/import-preview-dialog.tsx`**
   - ✅ Actualizada interface con `existingSlots` y `stats`
   - ✅ Agregadas Stats Cards (Total, Válidos, Descartados)
   - ✅ Agregada comparación "Actual vs Importado"

3. **`src/app/(dashboard)/dashboard/settings/availability/page.tsx`**
   - ✅ Importados componentes y tipos necesarios
   - ✅ Agregados estados para preview
   - ✅ Reemplazado `handleImportFromGoogle()` con flujo de preview
   - ✅ Agregados handlers `handleConfirmImport()` y `handleCancelImport()`
   - ✅ Agregado JSX del diálogo

## Pasos de Testing

### Prerequisitos

1. Tener Google Calendar conectado desde `/dashboard/settings`
2. Tener algunos eventos en Google Calendar para detectar gaps
3. Opcionalmente tener slots de disponibilidad ya configurados

### Test 1: Preview con slots detectados

1. Ir a `/dashboard/settings/availability`
2. Click en "Importar desde Google Calendar"
3. **Verificar:**
   - ✅ Aparece el diálogo de preview
   - ✅ Muestra 3 stats cards:
     - Slots detectados (azul)
     - Válidos ≥30min (verde)
     - Descartados <30min (ámbar)
   - ✅ Muestra lista de slots agrupados por día
   - ✅ Cada slot muestra horario y duración en minutos

### Test 2: Comparación con slots existentes

**Si hay slots configurados previamente:**

4. **Verificar:**
   - ✅ Aparece sección "Horarios Actuales vs Horarios Nuevos"
   - ✅ Muestra cantidad de slots en cada lado
   - ✅ Aparecen opciones de estrategia:
     - "Reemplazar mis horarios actuales"
     - "Combinar con mis horarios actuales"

**Si NO hay slots existentes:**

4. **Verificar:**
   - ✅ NO aparece sección de comparación
   - ✅ NO aparecen opciones de estrategia
   - ✅ Solo botón "Confirmar e Importar"

### Test 3: Confirmar importación (REPLACE)

5. Seleccionar "Reemplazar mis horarios actuales" (si hay slots existentes)
6. Click en "Confirmar e Importar"
7. **Verificar:**
   - ✅ Botón muestra "Importando..."
   - ✅ Diálogo se cierra después de importar
   - ✅ Aparece mensaje de éxito
   - ✅ Página se refresca automáticamente
   - ✅ Calendario muestra los nuevos slots
   - ✅ Slots anteriores fueron eliminados (si había)

### Test 4: Confirmar importación (MERGE)

8. Volver a abrir "Importar desde Google Calendar"
9. Seleccionar "Combinar con mis horarios actuales"
10. Click en "Confirmar e Importar"
11. **Verificar:**
    - ✅ Se agregan slots nuevos sin eliminar existentes
    - ✅ NO se duplican slots idénticos

### Test 5: Cancelar importación

12. Abrir "Importar desde Google Calendar"
13. Click en "Cancelar"
14. **Verificar:**
    - ✅ Diálogo se cierra
    - ✅ NO se guarda nada en BD
    - ✅ Calendario mantiene slots actuales

### Test 6: Error - Google Calendar no conectado

15. Desconectar Google Calendar desde Settings
16. Intentar "Importar desde Google Calendar"
17. **Verificar:**
    - ✅ Aparece mensaje de error
    - ✅ "Google Calendar no conectado. Conectá tu cuenta primero."
    - ✅ NO se abre el diálogo de preview

### Test 7: Error - Sin slots detectados

18. Crear un día completamente ocupado en Google Calendar
19. Intentar importar
20. **Verificar:**
    - ✅ Aparece mensaje de error
    - ✅ "No se detectaron horarios libres..."
    - ✅ NO se abre el diálogo

## Casos Edge Detectados

### ✅ Slots descartados (<30min)

El servicio `AvailabilityImporterService` ya filtra slots menores a 30min mediante `minSlotDuration: 30`. Por lo tanto, `stats.discarded` siempre será 0 con la implementación actual.

**Mejora futura:** Si se desea mostrar slots descartados, modificar el servicio para retornar también los slots filtrados.

### ✅ Cálculo de horas totales

Se calcula correctamente la duración de cada slot y se suma el total, redondeado a 1 decimal.

Ejemplo: Si hay 5 slots de 2 horas cada uno → `totalHours: 10.0`

### ✅ Estrategia MERGE

La estrategia MERGE compara `day_of_week`, `start_time` y `end_time` para evitar duplicados exactos.

**Nota:** Slots que se solapan parcialmente NO se detectan como duplicados y se agregarán ambos.

## Verificación de Sintaxis

- ✅ TypeScript types correctos
- ✅ Props interfaces actualizadas
- ✅ Imports completos
- ✅ Estados manejados correctamente
- ✅ Handlers async con try-catch implícito en server actions

## Próximos Pasos Sugeridos

1. **Testing en ambiente local:**
   ```bash
   cd /Users/martinmalgor/Documents/StudyApp
   pnpm dev
   # Navegar a http://localhost:3000/dashboard/settings/availability
   ```

2. **Testing en producción:**
   - Merge a `main` después de testing local exitoso
   - Verificar en Vercel deployment

3. **Mejoras futuras (opcionales):**
   - Agregar animaciones al diálogo (fade in/out)
   - Mostrar spinner durante detección de slots
   - Preview visual de calendario con slots detectados
   - Detectar y alertar sobre slots que se solapan en MERGE

## Resultado Esperado

Al finalizar todos los tests, el usuario debe poder:

1. ✅ Ver preview detallado de slots antes de importar
2. ✅ Ver estadísticas claras (total, válidos, descartados)
3. ✅ Comparar con slots existentes si los tiene
4. ✅ Elegir estrategia REPLACE o MERGE
5. ✅ Cancelar sin guardar cambios
6. ✅ Confirmar e importar con feedback visual

**Estimación de testing manual:** 15-20 minutos
