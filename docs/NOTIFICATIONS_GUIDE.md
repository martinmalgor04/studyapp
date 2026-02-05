# Guía del Sistema de Notificaciones

## Resumen

El sistema de notificaciones está implementado con arquitectura multi-canal (In-App, Email, Telegram) usando el patrón **Facade** para centralizar el envío.

### Estado de Implementación

| Canal | Estado | Descripción |
|-------|--------|-------------|
| **In-App** | ✅ Completamente funcional | Notificaciones visibles en la campana del navbar |
| **Email** | 🟡 Infraestructura lista | Stub preparado para integrar con Resend |
| **Telegram** | 🟡 Infraestructura lista | Stub preparado para integrar con Bot API |

---

## Arquitectura

### Estructura de Archivos

```
src/lib/services/notifications/
├── channels/
│   ├── notification-channel.interface.ts  # Interfaz común
│   ├── in-app.channel.ts                  # Implementación completa
│   ├── email.channel.ts                   # Stub (TODO)
│   └── telegram.channel.ts                # Stub (TODO)
└── notification.service.ts                # Facade

src/lib/actions/
└── notifications.ts                       # Server Actions

src/components/features/notifications/
├── notification-bell.tsx                  # Componente de campana
└── notification-item.tsx                  # Item individual

src/app/(dashboard)/dashboard/settings/
└── page.tsx                               # Página de configuración
```

### Base de Datos

#### Tabla `notifications` (ya existía)
```sql
- id: UUID
- user_id: UUID
- type: notification_type (enum)
- title: TEXT
- message: TEXT
- read: BOOLEAN
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

#### Tabla `user_settings` (nueva)
```sql
- user_id: UUID (PK)
- email_notifications: BOOLEAN (default TRUE)
- telegram_notifications: BOOLEAN (default FALSE)
- in_app_notifications: BOOLEAN (default TRUE)
- daily_summary_time: TIME (default 08:00)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## Uso

### 1. Enviar una Notificación

Desde cualquier Server Action:

```typescript
import { sendNotification } from '@/lib/actions/notifications';

await sendNotification({
  userId: 'uuid-del-usuario',
  type: 'SESSION_REMINDER',
  title: 'Título de la notificación',
  message: 'Mensaje descriptivo',
  metadata: {
    // Datos adicionales (opcional)
    session_id: 'uuid',
    topic_name: 'Integrales',
  },
});
```

### 2. Tipos de Notificaciones Disponibles

```typescript
type NotificationType = 
  | 'SESSION_REMINDER'        // Recordatorio de sesión
  | 'EXAM_APPROACHING'        // Examen próximo
  | 'STREAK_WARNING'          // Racha en riesgo
  | 'ACHIEVEMENT_UNLOCKED'    // Logro desbloqueado
  | 'SESSION_RESCHEDULED'     // Sesión reagendada
  | 'GENERAL';                // Mensaje general
```

### 3. Ejemplo de Integración

Ya implementado en `src/lib/actions/topics.ts`:

```typescript
// Al crear un tema y generar sesiones
await sendNotification({
  userId: user.id,
  type: 'SESSION_REMINDER',
  title: 'Nuevas sesiones generadas',
  message: `Se crearon ${count} sesiones de repaso para "${topicName}"`,
  metadata: { topic_id, subject_id, sessions_count: count },
});
```

---

## Canales de Notificación

### In-App (Funcional)

**Cómo funciona:**
1. Se guarda en la tabla `notifications` de Supabase.
2. Aparece en el dropdown de la campana del navbar.
3. Badge muestra el contador de no leídas.
4. Click en la notificación la marca como leída.

**Ubicación UI:**
- Navbar: Campana con badge de contador.
- `/dashboard/settings`: Toggle para activar/desactivar.

### Email (Stub - Listo para implementar)

**Archivo:** `src/lib/services/notifications/channels/email.channel.ts`

**Pasos para activar:**
1. Instalar Resend: `pnpm add resend`
2. Obtener API Key de https://resend.com
3. Agregar a `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Descomentar código en `email.channel.ts`:
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   await resend.emails.send({
     from: 'StudyApp <no-reply@studyapp.com>',
     to: userEmail,
     subject: notification.title,
     html: `<p>${notification.message}</p>`,
   });
   ```

### Telegram (Stub - Listo para implementar)

**Archivo:** `src/lib/services/notifications/channels/telegram.channel.ts`

**Pasos para activar:**
1. Crear bot con @BotFather en Telegram.
2. Obtener token del bot.
3. Agregar a `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```
4. El usuario debe:
   - Iniciar chat con el bot.
   - Obtener su `chat_id` (puede ser mediante comando `/start`).
   - Guardar `telegram_chat_id` en su perfil.
5. Descomentar código en `telegram.channel.ts`:
   ```typescript
   await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       chat_id: chatId,
       text: `*${notification.title}*\n\n${notification.message}`,
       parse_mode: 'Markdown',
     }),
   });
   ```

---

## Testing

### Probar In-App

1. Levantá el servidor: `pnpm dev`
2. Creá un tema nuevo con fecha de clase.
3. Mirá la campana en el navbar (debería aparecer un badge con "1").
4. Click en la campana para ver la notificación.
5. Click en la notificación para marcarla como leída.

### Probar Configuración

1. Andá a "Configuración" en el navbar o el menú de usuario.
2. Cambiá los switches de canales.
3. Guardá cambios.
4. Creá otro tema y verificá que la notificación se envíe solo a los canales activos (verás logs en consola del servidor).

---

## Arquitectura (Patrón Facade)

```
┌─────────────────────────────────────────────┐
│         NotificationService (Facade)        │
│  - Consulta user_settings                   │
│  - Determina canales activos                │
│  - Despacha a channels                      │
└──────────┬──────────────────────────────────┘
           │
    ┌──────┴──────┬────────────────┐
    │             │                │
    ▼             ▼                ▼
┌────────┐  ┌──────────┐  ┌──────────────┐
│ In-App │  │  Email   │  │  Telegram    │
│  ✅     │  │  🟡      │  │   🟡         │
└────────┘  └──────────┘  └──────────────┘
   (DB)      (Resend)       (Bot API)
```

### Beneficios del Patrón

1. **Desacoplamiento**: Agregar un nuevo canal (ej: WhatsApp) es simplemente crear una nueva clase que implemente `INotificationChannel`.
2. **Configurabilidad**: El usuario controla qué canales usa desde la UI.
3. **Resiliencia**: Si un canal falla, los demás siguen funcionando (Promise.allSettled).

---

## Próximos Pasos

1. **Implementar Email Channel**:
   - Integrar con Resend.
   - Crear template HTML básico para emails.
   - Configurar dominio verificado.

2. **Implementar Telegram Channel**:
   - Crear bot.
   - Agregar flow de vinculación (usuario conecta Telegram a su cuenta).
   - Guardar `telegram_chat_id` en perfil de usuario.

3. **Agregar Triggers Automáticos**:
   - Edge Function o Cron Job para enviar recordatorios diarios a las 8 AM.
   - Trigger cuando un examen está a 7/3/1 días (EXAM_APPROACHING).
   - Trigger cuando una racha está en riesgo (STREAK_WARNING).

4. **Mejorar UI**:
   - Página completa de historial de notificaciones.
   - Filtros por tipo.
   - Acción bulk "Eliminar todas leídas".

---

_Última actualización: Febrero 2026_
