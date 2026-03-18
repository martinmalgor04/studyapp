# Telegram Integration Specification

**Prioridad:** Alta (v1.0)  
**Estado:** Pendiente  
**Estimación:** 6-8 horas

---

## 1. Objetivo

Implementar notificaciones por Telegram para sesiones, reagendados y recordatorios, proporcionando una experiencia más inmediata que el email.

---

## 2. Casos de Uso

### UC-012: Send Telegram Notifications

**Actor:** Sistema  
**Trigger:** Evento de sesión o recordatorio

**Flujo Principal:**

1. Sistema detecta evento notificable (sesión próxima, reagendada, etc.)
2. Sistema verifica que usuario tenga Telegram conectado y notificaciones activas
3. Sistema construye mensaje según tipo de evento
4. Sistema envía mensaje via Telegram Bot API
5. Sistema registra notificación en tabla `notifications`

**Precondiciones:**
- Usuario tiene `telegram_chat_id` configurado en `user_settings`
- Usuario tiene `telegram_notifications: true`
- Bot token configurado en env vars

**Postcondiciones:**
- Notificación enviada y registrada
- Usuario recibe mensaje en Telegram

---

## 3. Tipos de Notificaciones

| Tipo | Trigger | Mensaje Template | Prioridad |
|------|---------|------------------|-----------|
| `SESSION_REMINDER` | 2h antes de sesión | "🔔 Recordatorio: Tenés '{topicName}' en 2 horas (R{number})" | Alta |
| `SESSION_TODAY` | 8:00 AM si hay sesiones hoy | "☀️ Buenos días! Hoy tenés {count} sesiones pendientes" | Media |
| `SESSION_RESCHEDULED` | Al reagendar | "🔄 Sesión '{topicName}' reagendada para {date}" | Media |
| `SESSION_OVERDUE` | 24h después de vencida | "⚠️ La sesión '{topicName}' está vencida. ¿La completaste?" | Baja |
| `ACHIEVEMENT_UNLOCKED` | Al desbloquear logro | "🏆 ¡Nuevo logro desbloqueado: {achievementName}!" | Baja |

---

## 4. Setup del Bot

### 4.1 Crear Bot en Telegram

```bash
# 1. Hablar con @BotFather en Telegram
# 2. Enviar: /newbot
# 3. Seguir instrucciones (nombre y username)
# 4. Copiar el token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 4.2 Variables de Entorno

```env
# .env.local
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**En Vercel:**
```bash
# Agregar en dashboard o via CLI
vercel env add TELEGRAM_BOT_TOKEN
```

### 4.3 Obtener Chat ID del Usuario

**Opción 1: Comando /start en el bot**

1. Usuario envía `/start` al bot
2. Bot responde con su chat_id
3. Usuario copia chat_id y lo pega en Settings

**Opción 2: Link mágico (recomendado)**

1. Usuario clickea "Conectar Telegram" en Settings
2. Sistema genera token temporal
3. Redirige a: `https://t.me/StudyAppBot?start={token}`
4. Bot recibe mensaje con token, obtiene chat_id
5. Sistema asocia chat_id con usuario via API callback

---

## 5. Implementación

### 5.1 Archivo: `src/lib/services/notifications/channels/telegram.channel.ts`

```typescript
import { INotificationChannel, NotificationPayload } from './notification-channel.interface';

interface TelegramConfig {
  botToken: string;
}

export class TelegramNotificationChannel implements INotificationChannel {
  private apiUrl: string;

  constructor(private config: TelegramConfig) {
    this.apiUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Obtener chat_id del usuario
    const chatId = await this.getUserChatId(payload.userId);
    if (!chatId) {
      console.log(`[Telegram] User ${payload.userId} has no chat_id configured`);
      return;
    }

    // Construir mensaje
    const message = this.formatMessage(payload);

    // Enviar via Telegram API
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Telegram] Send error:', error);
      } else {
        console.log(`[Telegram] Message sent to user ${payload.userId}`);
      }
    } catch (error) {
      console.error('[Telegram] Network error:', error);
    }
  }

  private async getUserChatId(userId: string): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_settings')
      .select('telegram_chat_id, telegram_notifications')
      .eq('user_id', userId)
      .single();

    if (!data?.telegram_notifications) return null;
    return data.telegram_chat_id;
  }

  private formatMessage(payload: NotificationPayload): string {
    const { type, title, message } = payload;

    // Usar HTML para formato
    let formatted = `<b>${this.escapeHtml(title)}</b>\n\n`;
    formatted += this.escapeHtml(message);

    // Agregar emoji según tipo
    const emoji = this.getEmojiForType(type);
    formatted = `${emoji} ${formatted}`;

    return formatted;
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      SESSION_REMINDER: '🔔',
      SESSION_TODAY: '☀️',
      SESSION_RESCHEDULED: '🔄',
      SESSION_OVERDUE: '⚠️',
      ACHIEVEMENT_UNLOCKED: '🏆',
    };
    return emojiMap[type] || '📢';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Factory
export function createTelegramChannel(): TelegramNotificationChannel | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not configured');
    return null;
  }
  return new TelegramNotificationChannel({ botToken });
}
```

### 5.2 Registrar Canal en Notification Service

**Archivo:** `src/lib/services/notifications/notification.service.ts`

```typescript
import { createTelegramChannel } from './channels/telegram.channel';

// En getNotificationService()
const telegramChannel = createTelegramChannel();
if (telegramChannel) {
  service.registerChannel(telegramChannel);
}
```

### 5.3 Conectar Telegram desde Settings

**Archivo:** `src/app/(dashboard)/dashboard/settings/page.tsx`

```typescript
// Agregar sección
<div className="border-t pt-6">
  <h3 className="text-lg font-semibold mb-4">Telegram</h3>
  
  {settings.telegram_chat_id ? (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        ✅ Telegram conectado (Chat ID: {settings.telegram_chat_id})
      </p>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.telegram_notifications}
          onChange={(e) => updateSettings({ telegram_notifications: e.target.checked })}
        />
        <span className="text-sm">Recibir notificaciones por Telegram</span>
      </label>
      <button
        onClick={disconnectTelegram}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Desconectar Telegram
      </button>
    </div>
  ) : (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-2">
        Recibí notificaciones instantáneas en Telegram
      </p>
      <button
        onClick={connectTelegram}
        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        📱 Conectar Telegram
      </button>
    </div>
  )}
</div>
```

---

## 6. Migrations

### 6.1 Agregar campos a `user_settings`

```sql
-- Migration: add_telegram_fields.sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_settings_telegram_chat_id 
ON user_settings(telegram_chat_id) 
WHERE telegram_chat_id IS NOT NULL;
```

---

## 7. Testing

### 7.1 Test Manual

1. Configurar `TELEGRAM_BOT_TOKEN` en `.env.local`
2. Ejecutar: `pnpm dev`
3. Ir a Settings → Telegram
4. Enviar `/start` al bot para obtener chat_id
5. Pegar chat_id y activar notificaciones
6. Crear sesión para hoy o mañana
7. Verificar que llegue notificación

### 7.2 Test de Integración

```typescript
// __tests__/integration/telegram-notifications.test.ts
import { TelegramNotificationChannel } from '@/lib/services/notifications/channels/telegram.channel';

describe('Telegram Notifications', () => {
  it('should send notification when user has chat_id', async () => {
    const channel = new TelegramNotificationChannel({
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
    });

    const payload = {
      userId: 'test-user-id',
      type: 'SESSION_REMINDER',
      title: 'Recordatorio de Sesión',
      message: 'Tenés "Cálculo I" en 2 horas (R1)',
      metadata: {},
    };

    await expect(channel.send(payload)).resolves.not.toThrow();
  });
});
```

---

## 8. Consideraciones

### 8.1 Rate Limits

Telegram Bot API tiene límites:
- 30 mensajes/segundo por bot
- 1 mensaje/segundo por chat

**Solución:** Implementar queue si se superan límites (future).

### 8.2 Privacidad

- Chat ID es sensible, no mostrarlo en UI pública
- Usuario puede desconectar en cualquier momento
- Respetar preferencias de notificaciones

### 8.3 Fallback

Si falla Telegram:
- No bloquear flujo principal
- Log error pero continuar
- Enviar por email si está configurado

---

## 9. Checklist de Implementación

- [ ] Crear bot en Telegram (@BotFather)
- [ ] Agregar `TELEGRAM_BOT_TOKEN` a Vercel env
- [ ] Agregar migration para campos de telegram
- [ ] Implementar `TelegramNotificationChannel`
- [ ] Registrar canal en `NotificationService`
- [ ] Agregar UI en Settings para conectar
- [ ] Implementar endpoint/webhook para recibir chat_id
- [ ] Test manual con bot real
- [ ] Documentar en README cómo configurar
- [ ] Actualizar roadmap marcando UC-012 completado

---

**Tiempo estimado total:** 6-8 horas  
**Bloqueadores:** Ninguno (bot token se agrega cuando esté listo)
