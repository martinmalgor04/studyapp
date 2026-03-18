# Troubleshooting: Email Notifications

## Problema Reportado

Las notificaciones por email de "sesiones creadas" funcionan correctamente, pero las de "reagendar" y "vencidas" no se envían en producción.

## Arquitectura del Sistema de Notificaciones

```
Server Action (sessions.ts)
  ↓
sendNotification() (notifications.ts)
  ↓
NotificationService.send() (notification.service.ts)
  ↓ verifica user_settings
  ↓ determina canales activos (email, telegram, in-app)
  ↓
EmailChannel.send() (email.channel.ts)
  ↓ obtiene email de public.users
  ↓ envía via Resend API
  ↓
✅ Email enviado
```

## Flujo de Notificaciones Implementadas

### 1. Sesiones Creadas (FUNCIONA ✅)

**Ubicación:** `src/lib/actions/topics.ts:130-140`

```typescript
await sendNotification({
  userId: user.id,
  type: 'SESSION_REMINDER',
  title: 'Nuevas sesiones generadas',
  message: `Se crearon ${sessionsResult.count} sesiones...`,
  metadata: { topic_id, subject_id, sessions_count }
});
```

**Trigger:** Al crear un topic con `source_date`

**Por qué funciona:** Se ejecuta inmediatamente después del signup/creación de topic, cuando el usuario está autenticado y su email está sincronizado.

---

### 2. Sesión Reagendada (NO FUNCIONA ❌)

**Ubicación:** `src/lib/actions/sessions.ts:353-368`

```typescript
await sendNotification({
  userId: user.id,
  type: 'SESSION_RESCHEDULED',
  title: 'Sesión reagendada',
  message: `"${topicName}" se movió al ${formattedDate}`,
  metadata: { session_id, new_date, attempts }
});
```

**Trigger:** Al llamar `rescheduleSession(id, newDate)` manualmente

**Posibles causas:**
- ¿Se está llamando `rescheduleSession` en producción?
- ¿El `user.id` es correcto?
- ¿El error se está tragando silenciosamente?

---

### 3. Sesión Vencida (NO FUNCIONA ❌)

**Ubicación:** `src/lib/actions/sessions.ts:545-560`

```typescript
await sendNotification({
  userId: user.id,
  type: 'SESSION_REMINDER',
  title: 'Sesión pendiente',
  message: `La sesión "${topicName}" está vencida...`,
  metadata: { session_id }
});
```

**Trigger:** Cron job que ejecuta `processOverdueSessions()` automáticamente

**Posibles causas:**
- ¿Hay un cron configurado en Vercel para ejecutar `processOverdueSessions()`?
- ¿El cron se está ejecutando correctamente?
- ¿Hay sesiones vencidas en la BD para testear?

---

## Logging Agregado para Debugging

Se agregó logging extensivo en:

### 1. NotificationService
```typescript
console.log('[NotificationService] Processing notification:', { type, userId, title });
console.log('[NotificationService] User settings:', { email_notifications, ... });
console.log('[NotificationService] Active channels:', ['email', 'in-app']);
console.log('[NotificationService] Channel "email" succeeded');
```

### 2. EmailChannel
```typescript
console.log('[EmailChannel] Attempting to send email:', { type, userId, title });
console.log('[EmailChannel] Sending to:', email);
console.log('[EmailChannel] Email sent successfully:', { to, messageId, type });
console.error('[EmailChannel] Resend API error:', { error, type, email });
```

### 3. Server Actions
```typescript
console.log('[rescheduleSession] Sending notification for user:', userId);
console.log('[rescheduleSession] Notification sent successfully');
console.error('[rescheduleSession] Failed to send notification:', error);
```

---

## Checklist de Debugging en Producción

### Paso 1: Verificar Configuración Básica ✅

- [x] `RESEND_API_KEY` está configurada en Vercel
- [x] Email de "sesiones creadas" funciona

### Paso 2: Verificar User Settings

```sql
-- En Supabase Production
SELECT 
  user_id,
  email_notifications,
  telegram_notifications,
  in_app_notifications
FROM user_settings
WHERE user_id = '<tu-user-id>';
```

**Resultado esperado:** `email_notifications: true`

Si no existe, se crea automáticamente con `email_notifications: true` (ver `notification.service.ts:89`)

### Paso 3: Verificar Email en public.users

```sql
-- En Supabase Production
SELECT id, email, name
FROM users
WHERE id = '<tu-user-id>';
```

**Resultado esperado:** El email debe coincidir con el de `auth.users`

Si falta, revisar trigger `on_auth_user_created` (ver `initial_schema.sql:495`)

### Paso 4: Testear Manualmente Reagendar

1. Ir a `/dashboard/sessions`
2. Reagendar una sesión a otra fecha
3. Abrir **Vercel Logs** → Filtrar por "rescheduleSession"
4. Buscar estos logs:

```
[rescheduleSession] Sending notification for user: xxx
[NotificationService] Processing notification: { type: SESSION_RESCHEDULED }
[NotificationService] User settings: { email_notifications: true }
[NotificationService] Active channels: ['in-app', 'email']
[EmailChannel] Attempting to send email: { type: SESSION_RESCHEDULED }
[EmailChannel] Sending to: tu@email.com
[EmailChannel] Email sent successfully: { to: tu@email.com, messageId: xxx }
[rescheduleSession] Notification sent successfully
```

### Paso 5: Verificar Cron Job para Overdue Sessions

**IMPORTANTE:** `processOverdueSessions()` es un cron job. Necesita configuración en Vercel.

#### Opción A: Vercel Cron Jobs (Recomendado)

Crear archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-overdue-sessions",
      "schedule": "0 0,12 * * *"
    }
  ]
}
```

Crear API Route: `src/app/api/cron/process-overdue-sessions/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { processOverdueSessions } from '@/lib/actions/sessions';

export async function GET(request: Request) {
  // Verificar token de seguridad (opcional pero recomendado)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processOverdueSessions();
  return NextResponse.json(result);
}
```

**Configurar en Vercel:**
- Project Settings → Environment Variables → Agregar `CRON_SECRET=<random-token>`
- El cron se ejecutará automáticamente cada día a las 00:00 y 12:00

#### Opción B: Llamada Manual (Para Testing)

```typescript
// Llamar directamente desde un server action o API route
import { processOverdueSessions } from '@/lib/actions/sessions';
await processOverdueSessions();
```

---

## Posibles Problemas y Soluciones

### Problema 1: Promise.allSettled traga errores

**Síntoma:** No se lanza excepción aunque falle el email

**Causa:** `NotificationService.send()` usa `Promise.allSettled` que no lanza errores

**Solución:** Los logs agregados ahora muestran claramente si un canal falló

### Problema 2: user_settings no existe

**Síntoma:** `email_notifications` es `undefined`

**Causa:** Usuario no tiene entrada en `user_settings`

**Solución:** El servicio crea automáticamente con defaults (ver `notification.service.ts:85-93`)

### Problema 3: Cron no configurado

**Síntoma:** `processOverdueSessions()` nunca se ejecuta

**Causa:** No hay cron job configurado en Vercel

**Solución:** Implementar Opción A del Paso 5

### Problema 4: Email no sincronizado

**Síntoma:** `getUserEmail()` devuelve `null`

**Causa:** Trigger `on_auth_user_created` no se ejecutó

**Solución:** Ejecutar manualmente:

```sql
INSERT INTO public.users (id, email, name)
SELECT id, email, raw_user_meta_data->>'name'
FROM auth.users
WHERE id = '<tu-user-id>'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
```

---

## Próximos Pasos

1. **Deploy a `develop`** con los logs agregados
2. **Testear manualmente** reagendar una sesión
3. **Revisar Vercel Logs** para identificar dónde falla
4. **Configurar Cron Job** si aún no existe
5. **Crear sesiones vencidas** para testear notificaciones de overdue

---

## Contacto

Si después de seguir esta guía el problema persiste, compartí los logs de Vercel para análisis detallado.
