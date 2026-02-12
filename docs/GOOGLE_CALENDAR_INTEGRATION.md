# Google Calendar Integration - Guía Completa

## Descripción General

StudyApp se integra con Google Calendar mediante **sincronización bilateral completa**:

### Flujo Bidireccional

```
    ┌──────────────────────────────────────────────────────┐
    │              Google Calendar                          │
    │  (Clases, Reuniones, Eventos personales)            │
    └────────────────┬────────────────▲────────────────────┘
                     │                │
        ①Leer eventos│                │③Exportar sesiones
         (conflictos)│                │  (visibilidad)
                     │                │
                     ▼                │
    ┌──────────────────────────────────────────────────────┐
    │                   StudyApp                            │
    │                                                       │
    │  ②Detecta horarios libres → Genera sesiones         │
    │  ④Actualiza si cambian eventos en Google             │
    └──────────────────────────────────────────────────────┘
```

### Funcionalidades (UC-011)

| Sub-UC | Nombre | Estado | Descripción |
|--------|--------|--------|-------------|
| **UC-011a** | Export Sessions to Google Calendar | ✅ Completado | Exporta sesiones de StudyApp → Google Calendar |
| **UC-011b** | Import Events for Availability | 🔄 Implementado | Lee eventos ocupados → detecta horarios libres automáticamente |
| **UC-011c** | Detect Schedule Conflicts | ⏳ Pendiente | Verifica conflictos en tiempo real antes de programar sesiones |
| **UC-011d** | Continuous Sync | ⏳ Pendiente | Mantiene sincronizados cambios bidireccionales continuamente |

---

## UC-011a: Export Sessions to Google Calendar (✅ Completado)

### ¿Qué hace?

Exporta tus sesiones de estudio pendientes a Google Calendar para verlas junto con tus otros eventos.

### Cómo usar

1. Ir a **Settings** (`/dashboard/settings`)
2. Hacer click en **"Conectar Google Calendar"**
3. Autorizar permisos en Google OAuth
4. Hacer click en **"Sincronizar Sesiones"**
5. Todas las sesiones PENDING se crearán como eventos en tu calendario

### Formato de eventos

- **Título**: `{nombre_tema} - R{número_repaso}` (ej: "Límites - R1")
- **Descripción**: Materia, duración estimada
- **Color**: Azul (colorId: 9)
- **Horario**: `scheduled_at` + `duration` minutos

### Ejemplo

```
Evento en Google Calendar:
----------------------------
Título: Integrales Definidas - R2
Descripción: 
  Materia: Análisis Matemático I
  Duración estimada: 90 minutos
  
  Generado por StudyApp
Horario: Martes 11 Feb, 14:00 - 15:30
Color: Azul
```

### Archivos implementados

- `src/lib/services/google-calendar.service.ts`
- `src/lib/actions/google-calendar.ts`
- `src/app/api/auth/google/route.ts`
- `src/app/api/auth/callback/google/route.ts`

---

## UC-011b: Import Events for Availability (🔄 Implementado)

### ¿Qué hace?

Lee tu Google Calendar de forma **bilateral y continua**, detecta eventos ocupados (clases, reuniones, trabajo), y:

1. **Genera automáticamente** tus horarios de estudio disponibles (`availability_slots`)
2. **Previene conflictos** al programar nuevas sesiones
3. **Se actualiza automáticamente** cuando agregás/modificás eventos en Google Calendar

### Problema que resuelve

**Antes**: 
- Tenías que configurar manualmente horarios disponibles (ej: Lun-Vie 08-12, 13-17)
- Si cambiaba tu horario de clases, debías actualizar manualmente
- Podías tener sesiones programadas que chocaban con otros eventos

**Después**: 
- StudyApp lee tu calendario en tiempo real
- Ve cuándo estás ocupado (clases, reuniones, etc.)
- Calcula automáticamente cuándo estás libre para estudiar
- **Se adapta automáticamente** a cambios en tu Google Calendar

### Algoritmo de detección

```typescript
1. Lee eventos del próximo mes de Google Calendar
2. Por cada día de la semana:
   a. Identifica "gaps" (huecos) entre eventos ocupados
   b. Filtra gaps < 30 minutos (demasiado cortos)
   c. Consolida gaps en slots de tiempo libre
3. Identifica patrones semanales repetidos:
   - Si un slot se repite 3+ veces el mismo día de semana → es un patrón
4. Genera `availability_slots` para cada patrón detectado
```

### Ejemplo visual

```
Tu Google Calendar (Lunes):
┌─────────────────────────────────┐
│ 08:00 - 10:00  [Clase de Análisis] │ ← Ocupado
│ 10:00 - 12:00  [LIBRE]            │ ← ✓ Detectado (2h)
│ 12:00 - 13:00  [Almuerzo]          │ ← Ocupado
│ 13:00 - 15:00  [LIBRE]            │ ← ✓ Detectado (2h)
│ 15:00 - 18:00  [Trabajo]           │ ← Ocupado
│ 18:00 - 22:00  [LIBRE]            │ ← ✓ Detectado (4h)
└─────────────────────────────────┘

Resultado en StudyApp:
→ Lunes 10:00 - 12:00 ✓
→ Lunes 13:00 - 15:00 ✓
→ Lunes 18:00 - 22:00 ✓
```

### Cómo usar (Onboarding - Usuarios nuevos)

1. Completar registro
2. En la pantalla de **Onboarding**, verás 2 opciones:
   - **Configurar Manualmente**: Elegir turnos predefinidos (Mañana/Tarde/Noche)
   - **Importar desde Google Calendar**: Detectar automáticamente (recomendado)
3. Hacer click en **"Importar desde Google Calendar"**
4. Autorizar permisos en Google OAuth
5. El sistema detecta tus horarios libres del próximo mes
6. Se muestra un **preview** con los slots detectados
7. Confirmar para importar
8. ¡Listo! Tus horarios están configurados automáticamente

### Cómo usar (Settings - Usuarios existentes)

#### Opción A: Configuración Manual con Sincronización

1. Ir a **Settings → Availability** (`/dashboard/settings/availability`)
2. Ver dos opciones principales:

   **📅 Configurar Manualmente**
   - Elegir días y horarios manualmente
   - Botón: "Usar configuración manual"
   
   **🔗 Conectar con Google Calendar** ⭐ RECOMENDADO
   - Botón destacado: "Conectar Google Calendar"
   - Sincronización automática y continua
   
3. Si elegís **Conectar Google Calendar**:
   - Si no conectaste tu cuenta antes, autorizar OAuth
   - El sistema detecta tus horarios libres del próximo mes
   - Se muestra un **preview** con los slots detectados
   - Elegir estrategia:
     - **Reemplazar**: Borra tus horarios actuales, usa solo los detectados
     - **Combinar**: Mantiene tus horarios existentes + agrega los nuevos
   - Confirmar para importar
   
4. **Sincronización Continua Activada** ✅:
   - Cada vez que generás sesiones, StudyApp lee tu Google Calendar
   - Detecta automáticamente eventos nuevos/modificados
   - Ajusta disponibilidad en tiempo real
   - No necesitás volver a importar manualmente

#### Opción B: Sincronización Manual (Re-importar)

1. Ir a **Settings → Availability**
2. Si ya conectaste Google Calendar, verás botón: **"Actualizar desde Google Calendar"**
3. Click para forzar una nueva importación
4. Útil si querés revisar cambios manualmente antes de confirmar

### Preview UI

Cuando se detectan los slots, se muestra una ventana de preview:

```
┌─────────────────────────────────────────────┐
│ Horarios detectados en tu Google Calendar   │
│                                              │
│ Lunes                                        │
│  ├─ 10:00 - 12:00 (120 min)                │
│  └─ 13:00 - 15:00 (120 min)                │
│                                              │
│ Martes                                       │
│  ├─ 09:00 - 11:30 (150 min)                │
│  └─ 14:00 - 17:00 (180 min)                │
│                                              │
│ ... (otros días)                             │
│                                              │
│ [Cancelar]  [Confirmar e Importar]          │
└─────────────────────────────────────────────┘
```

### Parámetros configurables

- **Rango de fechas**: Por defecto próximos 30 días
- **Duración mínima de slot**: Por defecto 30 minutos
- **Horario de trabajo**: Por defecto 06:00 - 23:00
- **Umbral de patrón**: Slot debe repetirse 3+ veces para considerarlo un patrón

### Archivos implementados

- `src/lib/services/availability-importer.service.ts` - Algoritmo de detección
- `src/lib/actions/availability.ts` - Action `importAvailabilityFromGoogleCalendar()`
- `src/app/(auth)/onboarding/page.tsx` - Opción de importar en onboarding
- `src/components/features/availability/import-preview-dialog.tsx` - Preview UI

### OAuth Scopes requeridos

```typescript
scope: [
  'https://www.googleapis.com/auth/calendar.events',   // Crear/editar eventos
  'https://www.googleapis.com/auth/calendar.readonly', // Leer calendario completo
]
```

⚠️ **IMPORTANTE**: Se agregó el scope `calendar.readonly` necesario para leer el calendario.

### Edge Cases manejados

| Caso | Solución |
|------|----------|
| Usuario sin eventos en Google Calendar | Muestra mensaje: "No se detectaron eventos. ¿Deseas configurar manualmente?" |
| Todos los días completamente ocupados | Warning: "No se encontraron slots libres de 30+ min. Revisa tu calendario." |
| Eventos recurrentes | Google Calendar API devuelve instancias expandidas → funciona correctamente |
| Múltiples zonas horarias | Normaliza todo a `America/Argentina/Buenos_Aires` |
| Slots muy fragmentados | Solo importa slots >= 30 minutos |

### Testing

Para probar la importación:

1. Crea eventos en tu Google Calendar (ej: clases, reuniones)
2. Deja algunos huecos libres entre eventos
3. Ejecuta la importación desde Onboarding o Settings
4. Verifica que los slots detectados coinciden con tus huecos reales

---

## UC-011c: Detect Schedule Conflicts (⏳ Pendiente → Integrado en UC-011b)

### ¿Qué hace?

Cuando el sistema genera sesiones automáticamente (UC-006) y el usuario tiene Google Calendar conectado, **verifica automáticamente** si hay conflictos con eventos existentes antes de programar.

### Integración con generación de sesiones

Esta funcionalidad se **integra directamente** en el flujo de generación de sesiones (no es un paso separado):

### Flujo Automático

```
1. Usuario crea topic (UC-005)
2. Sistema va a generar sesión para "Integrales - R2"
3. Fecha/hora preferida: Martes 14:00 (según algoritmo de repetición espaciada)
4. Sistema verifica:
   a) ¿Usuario tiene Google Calendar conectado? → SÍ
   b) Consulta Google Calendar API: ¿Hay eventos en Martes 14:00-15:30?
   c) Encuentra conflicto: "Reunión de equipo 14:00-16:00"
5. Sistema busca alternativa:
   → Lee availability_slots del usuario (horarios permitidos)
   → Busca siguiente slot libre: Martes 17:00 (sin eventos en Google)
   → Verifica nuevamente en Google Calendar: ✅ Libre
6. Programa sesión en Martes 17:00 (slot sin conflictos)
7. Notifica al usuario: "Sesión ajustada a las 17:00 para evitar conflicto"
```

### Casos de uso reales

| Escenario | Comportamiento |
|-----------|----------------|
| **Sin Google Calendar conectado** | Genera sesiones normalmente usando solo `availability_slots` locales |
| **Con Google Calendar pero sin eventos** | Genera sesiones en horarios preferidos sin ajustes |
| **Con conflictos menores** | Ajusta horarios automáticamente, notifica al usuario |
| **Con conflictos mayores (agenda llena)** | Muestra warning: "Agenda muy ocupada, revisa las sesiones generadas" |

### Estado

🔄 **En Progreso** - Lógica base implementada, falta refinamiento

Integrado con UC-011b (Import Events). Cada generación de sesiones consulta Google Calendar en tiempo real.

Ver especificación completa en: `docs/spec-kit/05-use-cases.md` (UC-011c)

---

## UC-011d: Continuous Sync (⏳ Pendiente)

### ¿Qué hará?

Sincronización **bidireccional y continua** de cambios entre StudyApp y Google Calendar:

#### Dirección 1: StudyApp → Google Calendar (Exportar cambios)

| Acción en StudyApp | Acción en Google Calendar |
|-------------------|---------------------------|
| Sesión completada | Evento marcado como completado (color verde) |
| Sesión reagendada | Evento actualizado con nueva fecha/hora |
| Sesión eliminada | Evento eliminado |
| Sesión abandonada | Evento marcado como cancelado (color rojo) |

#### Dirección 2: Google Calendar → StudyApp (Detectar cambios externos)

| Acción en Google Calendar | Acción en StudyApp |
|--------------------------|-------------------|
| Evento nuevo agregado | Actualiza `availability_slots`, verifica conflictos con sesiones existentes |
| Evento modificado (hora) | Recalcula disponibilidad, puede reagendar sesiones automáticamente |
| Evento eliminado | Libera ese horario para sesiones |
| Evento recurrente modificado | Actualiza patrón de disponibilidad semanal |

### Estrategias de Sincronización

#### Opción A: Polling (Implementación inicial)

```typescript
// Cada 15 minutos, para usuarios con Google Calendar conectado
async function syncAvailabilityFromGoogle(userId: string) {
  const lastSync = await getLastSyncTime(userId);
  const events = await googleCalendar.events.list({
    calendarId: 'primary',
    timeMin: lastSync,
    timeMax: addMonths(new Date(), 1),
  });
  
  // Detectar cambios
  const changed = detectChanges(events, lastSync);
  
  if (changed) {
    // Regenerar availability_slots
    await updateAvailabilitySlots(userId, events);
    
    // Verificar conflictos con sesiones existentes
    await checkSessionConflicts(userId);
  }
}
```

#### Opción B: Webhooks (Ideal, implementación futura)

```typescript
// Google Calendar Push Notifications
// Notifica en tiempo real cuando cambia el calendario
app.post('/webhooks/google-calendar', async (req) => {
  const { userId, channelId } = req.body;
  
  // Disparado automáticamente por Google cuando hay cambios
  await syncAvailabilityFromGoogle(userId);
});
```

### Frecuencia de Sincronización

| Método | Frecuencia | Uso |
|--------|-----------|-----|
| **Manual** | On-demand | Usuario hace click en "Actualizar desde Google Calendar" |
| **Automática (polling)** | Cada 15 minutos | Background job para usuarios conectados |
| **Tiempo real (webhooks)** | Instantáneo | Futuro: notificaciones push de Google |
| **Pre-generación** | Cada vez que se generan sesiones | Verifica conflictos antes de programar |

### Estado

⏳ **Pendiente de Implementación**

**Prioridad**: Media-Alta (después de completar UC-011b + UC-011c)

Ver especificación completa en: `docs/spec-kit/05-use-cases.md` (UC-011d)

---

## Configuración de Desarrollo

### Variables de entorno

```env
# Google OAuth (necesario para ambos UC-011a y UC-011b)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

### Google Cloud Console Setup

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar **Google Calendar API**
3. Crear credenciales OAuth 2.0:
   - Application type: Web application
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (prod)
4. Copiar Client ID y Client Secret a `.env.local`

### Scopes necesarios

```
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
```

---

## Testing

### UC-011a (Export)

```bash
1. Registrarse en la app
2. Crear una materia, examen, y topic
3. Verificar que se generaron sesiones
4. Ir a Settings → Conectar Google Calendar
5. Sincronizar sesiones
6. Abrir Google Calendar → verificar que aparecen los eventos
```

### UC-011b (Import)

```bash
# Preparación: Crear eventos en tu Google Calendar
1. Abrir Google Calendar
2. Crear eventos de ejemplo:
   - Lunes 08:00-10:00: "Clase Análisis"
   - Lunes 13:00-15:00: "Trabajo"
   - Martes 09:00-12:00: "Reunión"
3. Dejar huecos libres entre eventos

# Testing en Onboarding (usuario nuevo)
1. Registrarse en StudyApp
2. En pantalla de Onboarding, elegir "Importar desde Google Calendar"
3. Autorizar OAuth
4. Verificar preview de slots detectados
5. Confirmar importación
6. Ir a Settings → Availability → verificar slots importados

# Testing en Settings (usuario existente)
1. Loguearse
2. Ir a Settings → Availability
3. Click en "Importar desde Google Calendar"
4. Elegir estrategia (Reemplazar o Combinar)
5. Verificar preview
6. Confirmar
7. Verificar slots actualizados
```

---

## Limitaciones Conocidas

1. **Rate Limit**: Google Calendar API tiene límite de 10,000 requests/día
2. **Detección de patrones**: Requiere al menos 3 ocurrencias del mismo slot para considerarlo un patrón
3. **Eventos de día completo**: No se consideran como "ocupados" (solo eventos con hora específica)
4. **Zonas horarias**: Todo se normaliza a `America/Argentina/Buenos_Aires`
5. **Caching**: No hay caching de eventos (se consulta siempre en tiempo real)

---

## Próximos Pasos

### Fase 1: Completar Sincronización Bilateral Básica
- [x] UC-011a: Export Sessions ✅
- [x] UC-011b: Import Availability (detección inicial) ✅
- [ ] UC-011b: Opción destacada en `/settings/availability` (UI)
- [ ] UC-011c: Detección de conflictos en tiempo real
- [ ] UC-011d: Sincronización bidireccional (polling cada 15min)

### Fase 2: Optimizaciones
- [ ] Caching de eventos de Google Calendar (15 minutos)
- [ ] Configuración de parámetros:
  - Frecuencia de sincronización automática
  - Duración mínima de slots libres
  - Horario de trabajo personalizado
- [ ] Notificaciones cuando se detectan conflictos
- [ ] Preview de cambios antes de aplicar sincronización

### Fase 3: Sincronización Avanzada
- [ ] Google Calendar Webhooks (notificaciones push en tiempo real)
- [ ] Sincronización de múltiples calendarios (personal, trabajo, facultad)
- [ ] Resolución inteligente de conflictos con IA
- [ ] Sugerencias de reagendado cuando cambia la agenda

### Fase 4: Analytics
- [ ] Dashboard de uso: ¿cuántos usuarios usan importación vs manual?
- [ ] Métricas de conflictos detectados y resueltos
- [ ] Tasa de sesiones ajustadas automáticamente

---

## Referencias

- **Use Cases detallados**: `docs/spec-kit/05-use-cases.md` (sección 5.7)
- **Google Calendar API**: https://developers.google.com/calendar/api/v3/reference
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **Supabase Auth**: https://supabase.com/docs/guides/auth

---

_Última actualización: Febrero 2026_
