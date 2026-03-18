# Email Notifications Setup

**Estado:** 🟡 Código implementado, falta configuración  
**Tiempo restante:** 30 minutos (solo configuración)  
**Bloqueador:** API Key de Resend

---

## 1. Estado Actual

### ✅ Implementado en Código

- **Canal de email completo:** `src/lib/services/notifications/channels/email.channel.ts`
- **Templates HTML:** Diseño profesional con gradientes y botones
- **Integración:** Registrado en `NotificationService` y usado en acciones
- **Librería:** `resend@^6.9.1` instalada

### ⏳ Pendiente de Configuración

- Variable de entorno `RESEND_API_KEY`
- Dominio verificado en Resend (opcional)
- Testing de emails reales

---

## 2. Setup de Resend

### 2.1 Crear Cuenta

1. Ir a [resend.com](https://resend.com)
2. Sign up (gratis: 100 emails/día, 3,000/mes)
3. Verificar email

### 2.2 Obtener API Key

1. Dashboard → API Keys
2. Click en "Create API Key"
3. Nombre: "StudyApp Production"
4. Permisos: "Full Access"
5. Copiar el key: `re_xxxxxxxxxxxx`

**Importante:** Guardar el key, solo se muestra una vez.

---

## 3. Configuración

### 3.1 Local (.env.local)

```env
# Email Notifications (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App URL (para links en emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Vercel (Producción)

**Opción A: Dashboard**
1. Vercel Dashboard → tu proyecto
2. Settings → Environment Variables
3. Agregar:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxx`
   - Environment: Production (y Preview si querés)

**Opción B: CLI**
```bash
vercel env add RESEND_API_KEY
# Pegar el valor cuando lo pida
# Seleccionar: Production, Preview, Development
```

---

## 4. Dominio Personalizado (Opcional)

Por defecto usa `onboarding@resend.dev` (dominio de prueba de Resend).

Para usar tu dominio:

### 4.1 Agregar Dominio en Resend

1. Dashboard → Domains
2. Add Domain: `studyapp.com` (o el que tengas)
3. Agregar registros DNS:
   ```
   TXT: resend._domainkey
   TXT: _resend
   ```

### 4.2 Actualizar Código

```typescript
// src/lib/services/notifications/channels/email.channel.ts
from: 'StudyApp <notificaciones@studyapp.com>',  // ← Cambiar esto
```

**Nota:** Si no tenés dominio, dejá el de Resend. Funciona igual.

---

## 5. Testing

### 5.1 Test Manual

```bash
# 1. Configurar RESEND_API_KEY en .env.local
# 2. Iniciar app
pnpm dev

# 3. Ir a Settings
http://localhost:3000/dashboard/settings

# 4. Activar "Notificaciones por Email"

# 5. Reagendar una sesión
# → Debería llegar email

# 6. Verificar en Resend Dashboard → Logs
```

### 5.2 Test desde Código

```typescript
// Agregar en una página de test (temporal)
import { sendNotification } from '@/lib/actions/notifications';

export default async function TestEmailPage() {
  await sendNotification({
    userId: 'tu-user-id',
    type: 'SESSION_REMINDER',
    title: 'Test de Email',
    message: 'Si recibís este email, las notificaciones funcionan!',
    metadata: {}
  });

  return <div>Email enviado (verificá tu inbox)</div>;
}
```

---

## 6. Tipos de Emails Configurados

| Tipo | Trigger | Template | Icon |
|------|---------|----------|------|
| `SESSION_REMINDER` | Al reagendar | "Sesión '{topic}' reagendada para {date}" | 📚 |
| `SESSION_RESCHEDULED` | Al reagendar | "Sesión movida al {date}" | 🔄 |
| `SESSION_OVERDUE` | 24h después de vencida | "La sesión está vencida. ¿La completaste?" | ⚠️ |
| `ACHIEVEMENT_UNLOCKED` | Al desbloquear logro | "¡Nuevo logro: {achievement}!" | 🏆 |
| `EXAM_APPROACHING` | X días antes de examen | "Tu {exam} es en {days} días" | ⚠️ |
| `STREAK_WARNING` | Racha en riesgo | "Tu racha de {days} días está en riesgo" | 🔥 |

**Nota:** Solo `SESSION_RESCHEDULED` se está usando actualmente.

---

## 7. Costos y Límites

### Plan Free de Resend

| Límite | Cantidad |
|--------|----------|
| Emails por día | 100 |
| Emails por mes | 3,000 |
| Dominios verificados | 1 |
| API Keys | Ilimitadas |
| Logs retention | 30 días |

**Para tu caso:** Más que suficiente para un usuario.

### Si Necesitas Más

Plan Pro: $20/mes
- 50,000 emails/mes
- 3 dominios
- Soporte prioritario

---

## 8. Verificación de Estado

### Check si está configurado

```typescript
// En cualquier parte del código
const hasResendKey = !!process.env.RESEND_API_KEY;
console.log('Email notifications enabled:', hasResendKey);
```

### Logs a Buscar

```bash
# Si NO está configurado:
[EmailChannel] RESEND_API_KEY not configured

# Si SÍ está configurado:
[EmailChannel] Email sent successfully to: user@example.com

# Si falla:
[EmailChannel] Error sending email: <detalles>
```

---

## 9. Checklist para Activar

- [ ] Crear cuenta en Resend
- [ ] Obtener API key
- [ ] Agregar `RESEND_API_KEY` a `.env.local`
- [ ] Agregar `RESEND_API_KEY` a Vercel env
- [ ] Agregar `NEXT_PUBLIC_APP_URL` si no está (para links)
- [ ] Test: reagendar sesión y verificar email
- [ ] (Opcional) Configurar dominio propio
- [ ] (Opcional) Actualizar `from:` con dominio propio
- [ ] Actualizar roadmap marcando email como ✅

---

**Tiempo para completar:** ~30 minutos (solo config, código ya está)  
**Bloqueadores:** Ninguno (Resend es gratis y rápido de configurar)  

**Próximo paso:** Crear cuenta en Resend y agregar el API key a Vercel.
