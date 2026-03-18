# 9. Implementation Roadmap

## 9.1 Release Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMPLEMENTATION TIMELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana    1    2    3    4    5    6    7    8    9   10   11   12        │
│           ├────┴────┴────┴────┼────┴────┴────┴────┼────┴────┴────┴────┤    │
│           │                   │                   │                   │    │
│           │       MVP         │       v1.0        │       v1.5        │    │
│           │                   │                   │                   │    │
│           │  • Auth           │  • Tracking       │  • Gamification   │    │
│           │  • Subjects       │  • Reschedule     │  • Analytics      │    │
│           │  • Topics         │  • Free Study     │  • Tasks          │    │
│           │  • Sessions       │  • Notifications  │                   │    │
│           │  • Dashboard      │  • Calendar Sync  │                   │    │
│           │                   │                   │                   │    │
│           ▼                   ▼                   ▼                   │    │
│         DEMO                BETA               LAUNCH               │    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9.2 MVP (Semanas 1-4)

### Objetivo
> Usuario puede registrarse, crear estructura de estudio (materias, exámenes, temas), 
> y el sistema genera automáticamente sesiones de repaso distribuidas.

### Sprint 1 (Semana 1-2): Foundation ✅ COMPLETADO

| Tarea | Estado | Complejidad | Horas Est. | Entregable |
|-------|--------|-------------|------------|------------|
| Setup proyecto Next.js Full Stack | ✅ | ⬜ | 4h | App scaffold completo |
| Configurar Supabase + PostgreSQL | ✅ | ⬜ | 4h | Database ready |
| Configurar Docker (Supabase Local) | ✅ | ⬜ | 2h | Dev environment |
| Schema completo (migrations) | ✅ | 🟡 | 6h | Todas las tablas creadas |
| Row Level Security (RLS) | ✅ | 🟡 | 4h | Políticas configuradas |
| Auth (register/login) | ✅ | 🟡 | 8h | Supabase Auth working |
| Trigger auto user_stats | ✅ | ⬜ | 2h | Stats creadas al registrarse |
| Frontend: Auth pages | ✅ | 🟡 | 8h | Login/Register UI |
| Frontend: Layout + Navigation | ✅ | ⬜ | 6h | Dashboard layout |
| Middleware de protección | ✅ | ⬜ | 2h | Rutas protegidas |

**Sprint Goal**: ✅ Usuario puede registrarse y loguearse, dashboard protegido.

**Cambios vs Plan Original:**
- ❌ No usamos NestJS (cambiamos a Next.js Full Stack)
- ❌ No usamos Prisma (usamos Supabase Client nativo)
- ✅ Usamos Supabase Auth (mejor que JWT custom)
- ✅ Todo el schema de DB creado desde el inicio (no incremental)

---

### Sprint 2 (Semana 3-4): Core Study - 🔄 EN PROGRESO

| Tarea | Estado | Complejidad | Horas Real | Entregable |
|-------|--------|-------------|------------|------------|
| **CRUD Subjects** | ✅ | ⬜ | 3h | Materias completo |
| - Validations (Zod) | ✅ | ⬜ | 0.5h | Schema validation |
| - Server Actions | ✅ | ⬜ | 1h | CRUD actions |
| - UI Components | ✅ | ⬜ | 1.5h | Form, List, Card, Dialog |
| - Page & Navigation | ✅ | ⬜ | 0.5h | `/dashboard/subjects` |
| **CRUD Exams** | ✅ | ⬜ | 3h | Exámenes API + UI |
| - Validations (Zod) | ✅ | ⬜ | 0.5h | Schema validation |
| - Server Actions | ✅ | ⬜ | 1h | CRUD actions |
| - UI Components | ✅ | ⬜ | 1.5h | Form, List, Card, Dialog |
| - Page (dentro de Subject) | ✅ | ⬜ | 0.5h | `/subjects/[id]` |
| **CRUD Topics** | ✅ | 🟡 | 6.5h | Temas API + UI |
| - Validations (Zod) | ✅ | ⬜ | 1h | Schema más complejo |
| - Server Actions | ✅ | ⬜ | 1.5h | CRUD actions |
| - UI Components | ✅ | 🟡 | 3h | Form complejo, List, Card |
| - Page (dentro de Subject) | ✅ | ⬜ | 1h | `/subjects/[id]/topics` |
| **Dashboard mejorado** | ✅ | 🟡 | 4h | Stats + Quick-add + Nav |
| - Stats cards | ✅ | ⬜ | 1h | 4 cards con contadores |
| - Quick-add widget | ✅ | 🟡 | 2h | Widget expandible |
| - Recent lists | ✅ | ⬜ | 1h | Subjects + Topics |
| - Clickeable cards | ✅ | ⬜ | 0.5h | Navegación mejorada |
| **Session Generator Service** | ✅ | 🟠 | 5h | Algoritmo de generación |
| - Spaced Repetition logic | ✅ | 🟡 | 2h | Intervalos por dificultad |
| - Priority Calculator | ✅ | 🟡 | 1.5h | Cálculo de score |
| - Session creation | ✅ | ⬜ | 1.5h | Insertar en DB |
| **Dashboard con sesiones** | ✅ | 🟡 | 4.5h | Vista del día |
| - Fetch today's sessions | ✅ | ⬜ | 1h | Query optimizada |
| - Session card component | ✅ | ⬜ | 2h | UI de sesión |
| - Priority badges | ✅ | ⬜ | 1h | Visual priority |
| - Quick stats | ✅ | ⬜ | 0.5h | Resumen del día |
| **Trigger automático** | ✅ | ⬜ | 0.5h | Generar al crear topic |

**Sprint Goal**: ✅ COMPLETADO - Usuario puede crear materias, exámenes, temas, y ver sesiones generadas automáticamente.

**Progreso Actual:**
- ✅ Subjects CRUD: 100% completado
- ✅ Exams CRUD: 100% completado
- ✅ Topics CRUD: 100% completado
- ✅ Dashboard funcional: 100% completado (stats, quick-add, recent lists, sesiones)
- ✅ Session Generator: 100% completado (algoritmo core implementado)

**Sprint 2: ✅ COMPLETADO**

---

### MVP Deliverables

- [x] Auth completo (register, login, Supabase Auth) ✅
- [x] CRUD de materias ✅
- [x] CRUD de exámenes ✅
- [x] CRUD de temas ✅
- [x] Algoritmo de Spaced Repetition funcionando ✅
- [x] Dashboard con sesiones del día ✅

**MVP Completion:** ✅ 100% (6/6 features completadas)

---

## 9.3 v1.0 (Semanas 5-8)

### Objetivo
> Sistema completo de tracking, reagendado, y sincronización con calendario externo.

### Sprint 3 (Semana 5-6): Tracking & Reschedule ✅ COMPLETADO

| Tarea | Estado | Complejidad | Horas Est. |
|-------|--------|-------------|------------|
| Session tracking (complete/incomplete) | ✅ | ⬜ | 4h |
| Reschedule logic | ✅ | 🟡 | 6h |
| Frontend: Session actions | ✅ | 🟡 | 6h |
| Frontend: Week view | ✅ | 🟡 | 8h |
| Notifications module setup | ✅ | ⬜ | 3h |
| Email notifications | 🟡 | 🟡 | 5h (código ✅, RESEND_API_KEY ✅, [troubleshooting activo](../TROUBLESHOOTING_EMAIL_NOTIFICATIONS.md)) |

**Sprint Goal**: ✅ Usuario puede marcar sesiones como completadas y reagendar (UC-008, UC-009). Vista semanal en UnifiedCalendar.

---

### Sprint 4 (Semana 7-8): Free Study & Calendar

| Tarea | Estado | Complejidad | Horas Real |
|-------|--------|-------------|------------|
| Free Study Mode | ✅ | 🟡 | 6.5h |
| - Countdown calculator | ✅ | ⬜ | 2h |
| - Topic distribution | ✅ | 🟡 | 3h |
| - UI countdown (warnings) | ✅ | ⬜ | 0.5h |
| - Auto-convert Parcial → Final | ✅ | ⬜ | 1h |
| **Google Calendar Integration (UC-011)** | 🟡 | 🟠 | ~35h |
| UC-011a: Export Sessions to Calendar | ✅ | 🟡 | 8h |
| - Google OAuth Setup | ✅ | 🟡 | 3h |
| - GoogleCalendarService | ✅ | 🟡 | 3h |
| - Sync button in Settings | ✅ | ⬜ | 2h |
| UC-011b: Import Availability from Calendar | ✅ | 🟠 | 15h |
| - AvailabilityImporterService | ✅ | 🟠 | 6h |
| - Detection algorithm | ✅ | 🟠 | 4h |
| - Onboarding integration | ✅ | 🟡 | 3h |
| - Preview UI component | ✅ | ⬜ | 2.5h |
| UC-011c: Detect Schedule Conflicts | 🟡 | 🟠 | 8h (backend ✅, faltan indicadores UI) |
| - Conflict detection algorithm | ✅ | 🟠 | 4h |
| - Integration with Session Generator | ✅ | 🟡 | 3h |
| - UI warnings/indicators | ⏳ | ⬜ | 3h (falta migration + badges) |
| UC-011d: Sync Session Updates | ✅ | 🟡 | 4h (activado, feedback opcional) |
| - Bidirectional sync (handler + color) | ✅ | 🟡 | 2h |
| - Event listeners (emitCompleted/Abandoned) | ✅ | ⬜ | - |
| - Color coding in Google Calendar | ✅ | ⬜ | 1h |

**Sprint Goal**: ✅ Modo estudio libre completado. ✅ Google Calendar: UC-011a y UC-011b completados, UC-011c/d backend implementado (90%). 🟡 Solo falta: indicadores de conflictos UI (3h). Ver análisis: [`GOOGLE_CALENDAR_GAPS_ANALYSIS.md`](../GOOGLE_CALENDAR_GAPS_ANALYSIS.md)

---

## 9.4 v1.5 (Semanas 9-12)

### Objetivo
> Engagement del usuario mediante gamificación y analytics.

### Sprint 5 (Semana 9-10): Gamification

| Tarea | Estado | Complejidad | Horas Est. |
|-------|--------|-------------|------------|
| Streaks calculator | ⏳ | 🟡 | 4h |
| Points system | ⏳ | ⬜ | 3h |
| Levels per subject | ⏳ | 🟡 | 5h |
| Achievements system | ⏳ | 🟡 | 6h |
| Frontend: Gamification UI | ⏳ | 🟡 | 8h |
| - Streak display | ⏳ | ⬜ | 2h |
| - Points badge | ⏳ | ⬜ | 2h |
| - Level progress bars | ⏳ | 🟡 | 3h |
| - Achievements gallery | ⏳ | ⬜ | 3h |

**Sprint Goal**: Sistema de rachas, puntos y logros funcionando.

---

### Sprint 6 (Semana 11-12): Analytics & Tasks

| Tarea | Estado | Complejidad | Horas Est. |
|-------|--------|-------------|------------|
| Analytics calculator | ⏳ | 🟡 | 6h |
| - Completion rate | ⏳ | ⬜ | 2h |
| - Study time tracking | ⏳ | ⬜ | 2h |
| - Performance by subject | ⏳ | 🟡 | 3h |
| Frontend: Analytics dashboard | ⏳ | 🟡 | 10h |
| - Charts (recharts) | ⏳ | 🟡 | 5h |
| - Stats cards | ⏳ | ⬜ | 3h |
| - Heatmap calendar | ⏳ | 🟡 | 4h |
| Tasks CRUD | ⏳ | ⬜ | 5h |
| Task tracking | ⏳ | ⬜ | 3h |

**Sprint Goal**: Dashboard de estadísticas + gestión de TPs.

---

## 9.5 v2.0 (Futuro)

### Features Planeadas

| Feature | Prioridad | Complejidad | Horas Est. |
|---------|-----------|-------------|------------|
| **Pomodoro Timer** | P3 | ⬜ | 8h |
| **Flashcards System** | P3 | 🟡 | 15h |
| **AI Program Loader** | P3 | 🔴 | 20h |
| **Telegram Bot** | P2 | 🟠 | 12h |
| **Mobile App (React Native)** | P4 | 🔴 | 60h+ |

---

## 9.6 Testing Strategy ✅ IMPLEMENTADO

### Stack de Testing

| Herramienta | Propósito | Estado |
|-------------|-----------|--------|
| **Vitest** | Unit/Integration tests | ✅ Configurado |
| **Playwright** | E2E (Chrome + Safari) | ✅ Configurado |
| **@testing-library/react** | Component tests | ✅ Instalado |

### Tests Implementados

| UC | Tests | Estado |
|----|-------|--------|
| UC-001 (Registration) | 3 E2E tests | 🟢 Implementado |
| UC-002 (Login) | 4 E2E tests | 🟢 Implementado |
| UC-003 (Subjects CRUD) | 3 E2E tests | 🟢 Implementado |
| UC-004 (Exams CRUD) | 2 E2E tests | 🟢 Implementado |
| UC-005 (Topics CRUD) | 3 E2E tests | 🟢 Implementado |
| UC-006 (Session Generator) | 56 unit tests | 🟢 100% passing |
| UC-007 (Dashboard) | 5 E2E tests | 🟢 Implementado |

**Total**: 56 unit + 20 E2E = **76 tests**

### Scripts Disponibles

```bash
pnpm test          # Run Vitest watch mode
pnpm test:unit     # Run unit tests once
pnpm test:coverage # Run with coverage report
pnpm test:e2e      # Run Playwright E2E
pnpm test:all      # Run all tests
```

### Archivos de Testing

```
src/__tests__/
├── setup.ts                              # Config + mocks
└── unit/services/
    ├── session-generator.test.ts         # 27 tests
    └── priority-calculator.test.ts       # 29 tests

e2e/
├── auth.spec.ts                          # UC-001, UC-002 (7 tests)
├── study-flow.spec.ts                    # UC-003 a UC-007 (13 tests)
└── fixtures/
    ├── auth.fixture.ts                   # Fixture autenticación
    └── test-helpers.ts                   # Helpers generales
```

📖 **Ver**: [`docs/TESTING.md`](../TESTING.md) para guía completa

---

## 9.7 Technical Debt & Improvements

📋 **Ver especificaciones detalladas:** [`PENDING_FEATURES.md`](PENDING_FEATURES.md)

### High Priority

| Item | Razón | Horas Est. | Estado | Spec |
|------|-------|------------|--------|------|
| Unit tests (Session Generator) | Core algorithm | 3h | ✅ Hecho | — |
| Unit tests (Priority Calculator) | Core algorithm | 1h | ✅ Hecho | — |
| **Error boundaries** | Better UX on errors | 4-6h | ⏳ | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| **Loading states** | Better perceived performance | *incluido* | ⏳ | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| **Telegram Notifications** | Notificaciones inmediatas | 6-8h | ⏳ | [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md) |

### Medium Priority

| Item | Razón | Horas Est. | Estado | Spec |
|------|-------|------------|--------|------|
| **CI/CD Automation** | GitHub Actions + branch protection | 3-4h | ⏳ | [CICD_DEPLOYMENT.md](CICD_DEPLOYMENT.md) |
| **E2E tests (UC-008/009)** | Completar y reagendar sesiones | 8-10h | ⏳ | [E2E_TESTING.md](E2E_TESTING.md) |
| Unit tests (CRUD Actions) | Quality assurance | 4h | ⏳ | — |
| Optimistic updates | Mejor UX | 5h | ⏳ | — |
| Offline support (PWA) | Funciona sin red | 10h | ⏳ | — |
| Dark mode | Accesibilidad | 6h | ⏳ | — |
| Accessibility audit | WCAG compliance | 8h | ⏳ | — |

### Low Priority

| Item | Razón | Horas Est. |
|------|-------|------------|
| Animations | Polish | 8h |
| Keyboard shortcuts | Power users | 5h |
| Export to CSV/PDF | Data portability | 6h |

---

## 9.7 Deployment Checklist

### Pre-MVP

- [x] Local development setup (Supabase CLI)
- [x] TypeScript configured
- [x] Git repository initialized
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment (Vercel Preview)

### MVP Launch

- [ ] Production Supabase project
- [ ] Environment variables configured
- [ ] Domain configured
- [ ] SSL/HTTPS
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)
- [ ] Performance monitoring

### Post-MVP

- [ ] Backup strategy
- [ ] Monitoring alerts
- [ ] Rate limiting
- [ ] CDN for static assets
- [ ] Database indexing optimization

---

## 9.8 Current Sprint Focus

### ✅ Completado

1. ✅ Setup completo (Next.js + Supabase)
2. ✅ Autenticación funcional
3. ✅ CRUD de Subjects
4. ✅ CRUD de Exams
5. ✅ CRUD de Topics
6. ✅ Dashboard mejorado (stats, quick-add, navegación)
7. ✅ Session Generator Service (modo Parcial)
8. ✅ Dashboard con sesiones del día
9. ✅ **Free Study Mode (Countdown para Finales)** - UC-010
10. ✅ **Conversión automática Parcial → Final**
11. ✅ **Testing Setup (Vitest + Playwright)**
12. ✅ **56 Unit Tests para Session Generator**
13. ✅ **20 E2E Tests para UC-001 a UC-007**
14. ✅ **Fixture de autenticación reutilizable**
15. ✅ **Documentación completa de testing**
16. ✅ **Modo Automático Estudio Libre** - Simplifica formulario cuando solo hay Finales
17. ✅ **User Menu Dropdown** - Menú desplegable con perfil y logout
18. ✅ **Página de Perfil** - Editar nombre, cambiar contraseña, eliminar cuenta
19. ✅ **Logout Funcional** - Cierre de sesión con limpieza de cookies
20. ✅ **Vista de Sesiones (UC-020)** - Página dedicada para ver/gestionar sesiones
21. ✅ **Filtros de Sesiones** - Por estado, prioridad y materia
22. ✅ **Acciones de Sesiones** - Completar, Reagendar, Eliminar
23. ✅ **Link en Navbar** - Acceso rápido a Sesiones
24. ✅ **Fix: Query topics sin user_id** - Validar a través de subjects
25. ✅ **Cambio: Free Study desde HOY** - Finales arrancan desde hoy, no countdown
26. ✅ **Test de integración** - Topic → Session flow (60 unit + 4 integration = 64 tests)
27. ✅ **Documentación actualizada** - SESSION_GENERATION_LOGIC_V2.md
28. ✅ **Sistema de Documentación de Fixes** - docs/spec-kit/fixes/ con 24 fixes documentados
29. ✅ **Actualización Design Patterns** - Documentación con implementaciones reales
30. ✅ **Sprint 3 (Tracking & Reschedule)** - UC-008, UC-009, vista semanal, acciones de sesión
31. ✅ **UC-011c Conflict detection** - findConflictFreeSlot + checkConflicts en Session Generator
32. ✅ **Análisis codebase vs roadmap** - [`CODEBASE_ANALYSIS.md`](CODEBASE_ANALYSIS.md) (gaps + mejoras + producción)
33. ✅ **Activación UC-011d** - Eventos de sesión para sync bidireccional con Google Calendar
34. ✅ **Fix: Completar sesiones desde calendario** - Diálogo de rating en UnifiedCalendar
35. ✅ **Specs técnicas para features pendientes** - 4 documentos detallados ([PENDING_FEATURES.md](PENDING_FEATURES.md))
36. ✅ **Troubleshooting Email Notifications** - Logging extensivo + guía de debugging ([TROUBLESHOOTING_EMAIL_NOTIFICATIONS.md](../TROUBLESHOOTING_EMAIL_NOTIFICATIONS.md))
37. ✅ **Análisis Google Calendar Gaps** - Documentación de lo que falta (85% → 100%) ([GOOGLE_CALENDAR_GAPS_ANALYSIS.md](../GOOGLE_CALENDAR_GAPS_ANALYSIS.md))
38. ✅ **UC-011b Preview Dialog** - Diálogo de preview con stats y comparación antes de importar disponibilidad ([TESTING_IMPORT_PREVIEW.md](../TESTING_IMPORT_PREVIEW.md))

### 🎉 MVP + FREE STUDY MODE + TRACKING + UC-011d COMPLETADO

**Estado:** Sprint 1 ✅ + Sprint 2 ✅ + Sprint 4 (Free Study) ✅ = **MVP + UC-010 100%**

**Archivos actualizados (2026-01-27):**
- `docs/spec-kit/05-use-cases.md` - Agregada columna Estado, UC-010 marcado como completado
- `src/lib/services/session-generator.ts` - Modo Countdown implementado
  - Intervalos universales Anki [1, 3, 7, 14] para todos
  - Multiplicadores de dificultad (EASY: 0.7, MEDIUM: 1.0, HARD: 1.3)
  - `generateCountdownSessions()` para finales
  - `generateParcialSessions()` para parciales/recuperatorios
  - Detección automática de modo según tipo de examen
- `src/lib/services/priority-calculator.ts` - Bonus de urgencia para finales
- `src/lib/actions/exams.ts` - Trigger `convertTopicsToFinal()` automático
- `src/components/features/topics/topic-form.tsx` - Warning de tiempo ajustado (<25 días)

**Funcionalidad:**
1. **Modo Parcial** (CLASS): Sesiones hacia ADELANTE desde clase (parciales, recuperatorios)
2. **Modo Countdown** (FREE_STUDY): Sesiones hacia ATRÁS desde examen (finales)
3. Al crear examen FINAL → todos los topics se convierten automáticamente
4. Warning si se crea topic con final en < 25 días
5. Prioridad URGENT/CRITICAL por defecto para finales

**Próximo paso:** Activar UC-011d (emit en sessions.ts). Luego Sprint 5 - Gamificación.

---

## 9.9 Metrics & KPIs

### Development Metrics (MVP)

| Métrica | Target | Actual |
|---------|--------|--------|
| Code coverage (services) | > 60% | ✅ ~70% |
| Unit tests passing | 100% | ✅ 60/60 |
| E2E tests passing | 100% | 🟡 20/20 (requiere setup) |
| Total tests | > 50 | ✅ 80 tests |
| TypeScript strict mode | Yes | ✅ Yes |
| Lighthouse Performance | > 90 | TBD |
| Lighthouse Accessibility | > 95 | TBD |
| Build time | < 30s | ✅ ~10s |

### User Metrics (Post-Launch)

| Métrica | Target (Mes 1) |
|---------|----------------|
| Daily Active Users | 10 |
| Session completion rate | > 70% |
| Average sessions per day | 3-5 |
| User retention (7 days) | > 50% |

---

## 9.10 Risk Management

### High Risk

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Session generation toma mucho tiempo | 🟡 Media | 🔴 Alto | Optimizar queries, cachear cálculos |
| Usuarios no completan sesiones | 🟡 Media | 🟠 Medio | Gamificación, notificaciones |
| Conflictos de calendario complejos | 🟡 Media | 🟠 Medio | Algoritmo robusto de slot-finding |

### Medium Risk

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Supabase límites free tier | 🟢 Baja | 🟡 Medio | Monitorear uso, optimizar queries |
| Escalabilidad con muchos temas | 🟡 Media | 🟡 Medio | Paginación, virtual scrolling |
| UX confusa para nuevos usuarios | 🟠 Alta | 🟡 Medio | Onboarding, tooltips |

---

## 9.11 Success Criteria

### MVP Success

El MVP se considera exitoso si:

1. ✅ Usuario puede registrarse en < 1 minuto
2. ⏳ Usuario puede crear una materia con examen y tema en < 3 minutos
3. ⏳ Sistema genera sesiones automáticamente en < 5 segundos
4. ⏳ Dashboard muestra sesiones del día de forma clara
5. ⏳ Algoritmo de prioridad es correcto (validación manual)

### v1.0 Success

1. ⏳ Tasa de completitud de sesiones > 60%
2. ⏳ Usuarios reagendan en vez de abandonar
3. ⏳ Sincronización con Calendar funciona sin errores

### v1.5 Success

1. ⏳ Usuarios mantienen racha > 5 días
2. ⏳ Engagement aumenta 30% con gamificación
3. ⏳ Analytics muestra patrones útiles

---

## 9.12 Technology Decisions Log

### Decisiones Tomadas

| Decisión | Fecha | Razón |
|----------|-------|-------|
| Next.js Full Stack (no NestJS) | 2026-01-26 | Menor complejidad, mejor DX, menos deployment overhead |
| Supabase (no Prisma standalone) | 2026-01-26 | Auth incluido, RLS nativo, mejor local dev |
| Server Actions (no REST API) | 2026-01-27 | Type-safe, menos boilerplate, mejor para MVP |
| Docker (cambio desde Podman) | 2026-01-27 | Mejor compatibilidad con Supabase CLI |
| TailwindCSS (no MUI) | 2026-01-26 | Más ligero, mejor customización |
| Countdown Mode implementado | 2026-01-27 | Completado UC-010 (v1.0), funcionalidad crítica para finales |

### Decisiones Pendientes

| Decisión | Opciones | Fecha Estimada |
|----------|----------|----------------|
| Chart library | Recharts vs Chart.js | Sprint 6 |
| Email provider | Resend vs SendGrid | Sprint 4 |
| Push notifications | OneSignal vs Firebase | v1.5 |

---

## Summary

**Estado actual:** Sprint 1 ✅, Sprint 2 ✅, Sprint 3 (Tracking & Reschedule) ✅, Sprint 4 (Free Study + Calendar) ✅

**Próximo paso:** Activar emit de SessionEventRegistry en completar/abandonar sesión (UC-011d en producción). Luego Sprint 5 - Gamificación.

**MVP + v1.0 (parcial):** ✅ COMPLETADO. Ver análisis detallado en [`CODEBASE_ANALYSIS.md`](CODEBASE_ANALYSIS.md).

**Cambios principales vs plan original:**
- ✅ Arquitectura simplificada (Next.js Full Stack)
- ✅ Menos complejidad de deployment
- ✅ Mejor Developer Experience
- ✅ Más rápido de iterar
- ✅ Countdown Mode implementado (v1.0 UC-010 adelantado)