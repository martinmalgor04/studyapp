# 📘 StudyApp - Spec Kit v2.0

> **Migración a Aplicación Escalable**  
> **Stack**: NestJS + NextJS + PostgreSQL  
> **Version**: 2.0.0  
> **Status**: Planning  

---

## 📁 Estructura del Spec Kit


| #   | Documento                                             | Descripción                         |
| --- | ----------------------------------------------------- | ----------------------------------- |
| 01  | [Executive Summary](./01-executive-summary.md)        | Visión, problema, solución          |
| 02  | [Value Proposition Canvas](./02-value-proposition.md) | Jobs, Pains, Gains + Priorización   |
| 03  | [Architecture](./03-architecture.md)                  | NestJS + NextJS + PostgreSQL        |
| 04  | [Domain Model](./04-domain-model.md)                  | DDD, Agregados, Entidades           |
| 05  | [Use Cases](./05-use-cases.md)                        | Especificaciones técnicas completas |
| 06  | [Database Schema](./06-database-schema.md)            | PostgreSQL + Prisma/TypeORM         |
| 07  | [API Specification](./07-api-specification.md)        | REST API endpoints                  |
| 08  | [Design Patterns](./08-design-patterns.md)            | GOF, GRASP, SOLID aplicados         |
| 09  | [Implementation Roadmap](./09-roadmap.md)             | Sprints y milestones                |
| —   | [Codebase Analysis](./CODEBASE_ANALYSIS.md)            | Gaps, mejoras y estado vs roadmap   |
| —   | [Pending Features](./PENDING_FEATURES.md)              | Features pendientes y deuda técnica |
| 10  | [Fixes Documentation](./fixes/README.md)               | Registro de fixes y correcciones    |

### Especificaciones Técnicas Detalladas

| Doc | Descripción | Prioridad | Estimación |
|-----|-------------|-----------|------------|
| [Email Notifications Setup](./EMAIL_NOTIFICATIONS_SETUP.md) | Configurar Resend API (código ya hecho) | 🟢 Baja | 30min |
| [Troubleshooting Email Notifications](../TROUBLESHOOTING_EMAIL_NOTIFICATIONS.md) | Debugging y logs para emails | ✅ Implementado | — |
| [Telegram Integration](./TELEGRAM_INTEGRATION.md) | Notificaciones por Telegram Bot | 🔴 Alta | 6-8h |
| [Error Handling](./ERROR_HANDLING.md) | Error boundaries y loading states | 🔴 Alta | 4-6h |
| [CI/CD Deployment](./CICD_DEPLOYMENT.md) | GitHub Actions y automatización | 🟡 Media | 3-4h |
| [E2E Testing](./E2E_TESTING.md) | Tests para UC-008 y UC-009 | 🟡 Media | 8-10h |


---

## 🎯 Quick Links

### Para Desarrolladores

- [Arquitectura](./03-architecture.md) → Entender el sistema
- [Domain Model](./04-domain-model.md) → Entidades y lógica
- [Database Schema](./06-database-schema.md) → Modelo de datos
- [Design Patterns](./08-design-patterns.md) → Patrones a seguir

### Para Product

- [Value Proposition](./02-value-proposition.md) → Prioridades
- [Use Cases](./05-use-cases.md) → Funcionalidades
- [Roadmap](./09-roadmap.md) → Plan de entregas

---

## 🔄 Changelog


| Versión | Fecha      | Cambios                     |
| ------- | ---------- | --------------------------- |
| 2.0.0   | 2026-01-20 | Migración a NestJS + NextJS |
| 1.0.0   | 2026-01-18 | Spec Kit inicial (N8N)      |


