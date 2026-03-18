# Pending Features & Technical Debt

**Fecha:** 2026-03-17  
**Estado:** Documentado  

Este documento índice reúne todas las especificaciones técnicas para features pendientes y deuda técnica identificadas en el análisis de codebase.

---

## Resumen Ejecutivo

| Feature | Prioridad | Estimación | Bloqueadores | Spec |
|---------|-----------|------------|--------------|------|
| **Email Notifications** | 🟢 Baja | 30min | API key de Resend | [EMAIL_NOTIFICATIONS_SETUP.md](EMAIL_NOTIFICATIONS_SETUP.md) |
| **Telegram Notifications** | 🔴 Alta | 6-8h | Bot token pendiente | [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md) |
| **Error Boundaries** | 🔴 Alta | 4-6h | Ninguno | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| **CI/CD Automation** | 🟡 Media | 3-4h | Ninguno | [CICD_DEPLOYMENT.md](CICD_DEPLOYMENT.md) |
| **E2E Tests (UC-008/009)** | 🟡 Media | 8-10h | Setup Supabase local | [E2E_TESTING.md](E2E_TESTING.md) |

**Total estimado:** 22-29 horas de desarrollo

---

## 1. Email Notifications (Baja Prioridad - Solo Config)

### Contexto
Email notifications **ya está implementado en código** con Resend. Solo falta configurar el API key.

### Código Existente
- ✅ `EmailChannel` completo con templates HTML
- ✅ Integrado en `NotificationService`
- ✅ Se usa en `rescheduleSession` y `processOverdueSessions`
- ✅ UI para activar/desactivar en Settings

### Lo Único que Falta
- Crear cuenta en Resend (gratis: 100 emails/día)
- Obtener API key
- Agregar `RESEND_API_KEY` a `.env.local` y Vercel

### Siguiente Paso
1. Ir a resend.com y crear cuenta
2. Copiar API key
3. Agregar a Vercel env
4. Test: reagendar sesión y verificar email

📄 **Guía completa:** [EMAIL_NOTIFICATIONS_SETUP.md](EMAIL_NOTIFICATIONS_SETUP.md)

---

## 2. Telegram Notifications (Alta Prioridad)

### Contexto
Canal de notificaciones implementado pero sin lógica real. Usuario quiere priorizar para v1.0.

### Alcance
- Implementar `TelegramNotificationChannel` completo
- Integración con Bot API de Telegram
- UI para conectar/desconectar en Settings
- 5 tipos de notificaciones (recordatorios, reagendados, etc.)

### Dependencias
- Bot token (usuario lo creará cuando esté listo)
- Variable de entorno en Vercel

### Siguiente Paso
1. Crear bot con @BotFather
2. Agregar token a Vercel
3. Implementar según spec

📄 **Spec completa:** [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md)

---

## 3. Error Handling & Loading States (Alta Prioridad)

### Contexto
No hay error boundaries ni loading states a nivel de rutas. Usuarios ven pantallas blancas o crashes no manejados.

### Alcance
- `global-error.tsx` para errores críticos
- `error.tsx` en rutas principales (app, dashboard, features)
- `loading.tsx` con skeletons user-friendly
- Componente `LoadingSpinner` reutilizable

### Beneficios
- ✅ Mejor UX en errores y carga
- ✅ Feedback claro al usuario
- ✅ Evita pantallas blancas
- ✅ Preparado para tracking futuro (Sentry)

### Siguiente Paso
Implementar en orden:
1. `global-error.tsx` (crítico)
2. `error.tsx` en dashboard
3. `loading.tsx` en rutas principales

📄 **Spec completa:** [ERROR_HANDLING.md](ERROR_HANDLING.md)

---

## 4. CI/CD Automation (Media Prioridad)

### Contexto
Deploy manual en Vercel funciona, pero no hay validación automática en PRs. Riesgo de romper producción.

### Alcance
- GitHub Actions workflow para PRs (lint + test + build)
- Branch protection rules en main
- Badges de CI/CD en README
- Rollback strategy documentada

### Beneficios
- ✅ Evita merges que rompen producción
- ✅ Feedback inmediato en PRs
- ✅ Confianza para hacer cambios
- ✅ Deploy automatizado

### Siguiente Paso
1. Crear `.github/workflows/ci.yml`
2. Configurar secrets en GitHub
3. Activar branch protection

📄 **Spec completa:** [CICD_DEPLOYMENT.md](CICD_DEPLOYMENT.md)

---

## 5. E2E Testing (UC-008 & UC-009) (Media Prioridad)

### Contexto
E2E actual cubre hasta UC-007 (Dashboard). Faltan tests para completar y reagendar sesiones.

### Alcance
- **UC-008:** 5 tests para completar sesión con rating
- **UC-009:** 5 tests para reagendar (quick, custom, auto-abandon)
- Bonus: Tests para Study Mode (pomodoro)
- Setup de Supabase local para testing aislado

### Beneficios
- ✅ Confianza en features críticas
- ✅ Prevenir regresiones
- ✅ Documentación viva del comportamiento

### Bloqueadores
- Requiere configurar Supabase local para tests (2h primera vez)
- Agregar `data-testid` en componentes

### Siguiente Paso
1. Setup ambiente de test con Supabase local
2. Implementar tests UC-008
3. Implementar tests UC-009

📄 **Spec completa:** [E2E_TESTING.md](E2E_TESTING.md)

---

## 6. Roadmap de Implementación Sugerido

### Sprint Inmediato (1-2 semanas)

**Prioridad Alta - Mejoras de Producción:**

```
Semana 1:
├── Email Notifications (30min)
│   └── Configurar RESEND_API_KEY en Vercel
├── Error Boundaries (4-6h)
│   ├── global-error.tsx
│   ├── dashboard error.tsx
│   └── feature error.tsx
└── Loading States (incluido en error boundaries)
    ├── dashboard loading.tsx
    └── features loading.tsx

Semana 2:
├── CI/CD Automation (3-4h)
│   ├── GitHub Actions workflow
│   ├── Branch protection
│   └── Badges & docs
└── Telegram Notifications (6-8h)
    ├── Crear bot
    ├── Implementar canal
    └── UI en Settings
```

**Total Semana 1-2:** 14-19 horas

### Sprint Siguiente (3-4 semanas)

**Prioridad Media - Testing & Quality:**

```
Semana 3:
└── E2E Testing Setup (8-10h)
    ├── Supabase local config
    ├── Seed data
    └── Tests UC-008 & UC-009

Semana 4:
└── Refinamientos
    ├── Ajustes en tests
    ├── Documentación
    └── Mejoras según feedback
```

---

## 7. Checklist General

### Pre-Implementación
- [x] Análisis de codebase completado
- [x] Specs técnicas creadas
- [x] Prioridades definidas con usuario
- [ ] Sprint planning con estimaciones

### En Progreso
- [ ] Bot de Telegram creado
- [ ] Token agregado a Vercel env
- [ ] Error boundaries implementados
- [ ] Loading states implementados
- [ ] GitHub Actions configurado
- [ ] E2E ambiente configurado

### Post-Implementación
- [ ] Tests manuales en staging
- [ ] Documentación actualizada
- [ ] README con badges
- [ ] Roadmap actualizado
- [ ] Deployment a producción

---

## 8. Notas de Implementación

### Para Email (Solo Config)
- Crear cuenta en resend.com (gratis)
- API key: `RESEND_API_KEY` en Vercel
- Testing: reagendar sesión para verificar

### Para Telegram
- Crear bot antes de implementar: `@BotFather` en Telegram
- Variables de entorno: `TELEGRAM_BOT_TOKEN`
- Testing: usar cuenta personal de Telegram

### Para Error Boundaries
- Testear forzando errores: `throw new Error('test')`
- Verificar en prod y dev (comportamientos diferentes)
- No mostrar stack traces en producción

### Para CI/CD
- Secrets necesarios en GitHub: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Valores dummy para build, reales en Vercel
- Branch protection: bloquear merge si fallan checks

### Para E2E
- Supabase local: requiere Docker corriendo
- Tests secuenciales (1 worker) para evitar conflictos
- Seed data: crear usuario + materia + topic + sesiones

---

## 9. Contacto y Feedback

Si tenés dudas sobre alguna spec o querés ajustar prioridades:
1. Revisar la spec completa en el link correspondiente
2. Verificar que las dependencias estén claras
3. Estimar si necesitás ayuda en algún setup específico

**Specs creadas:**
- [`EMAIL_NOTIFICATIONS_SETUP.md`](EMAIL_NOTIFICATIONS_SETUP.md) ⚡ Solo config
- [`TELEGRAM_INTEGRATION.md`](TELEGRAM_INTEGRATION.md)
- [`ERROR_HANDLING.md`](ERROR_HANDLING.md)
- [`CICD_DEPLOYMENT.md`](CICD_DEPLOYMENT.md)
- [`E2E_TESTING.md`](E2E_TESTING.md)

---

**Última actualización:** 2026-03-17  
**Por:** Cursor AI Assistant  
**Status:** Ready for implementation
