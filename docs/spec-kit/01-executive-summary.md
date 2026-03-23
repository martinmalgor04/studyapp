# 1. Executive Summary

## 1.1 Problem Statement

Los estudiantes universitarios enfrentan un problema crítico: **la procrastinación y falta de organización del estudio**. Esto resulta en:

- No saber **qué** estudiar en cada momento
- No saber **cuándo** estudiar cada tema
- Pérdida de tiempo valioso
- Estrés acumulado cerca de exámenes
- Bajo rendimiento académico

## 1.2 Solution

**StudyApp** es una plataforma web de planificación de estudio basada en:

- **Spaced Repetition**: Intervalos científicamente probados
- **Active Recall**: Técnicas de recuperación activa
- **Automatización Total**: El sistema decide qué, cuándo y cuánto
- **Integración**: Calendar, notificaciones, tracking

## 1.3 Value Proposition

> *"Te digo qué estudiar y cuándo, para que solo tengas que sentarte y hacerlo."*

## 1.4 Target User

**Persona Principal**: Estudiante universitario de carreras técnicas que:

- Cursa múltiples materias simultáneamente
- Tiene exámenes teóricos y prácticos
- Lucha con la organización y procrastinación
- Usa tecnología activamente

## 1.5 Technical Vision

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 (Full Stack)                      │
│                                                                 │
│   Presentation: React 19 │ App Router │ Server Components       │
│   Application:  Server Actions │ API Routes                     │
│   Domain:       Services │ Priority Calculator │ Session Gen    │
│   Styling:      TailwindCSS                                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Supabase Client (SSR)
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      SUPABASE                                   │
│                                                                 │
│   Database:     PostgreSQL + Row Level Security (RLS)           │
│   Auth:         Supabase Auth (JWT + Sessions)                  │
│   Realtime:     Supabase Realtime (futuro)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Principios de Diseño


| Principio              | Aplicación                                                   |
| ---------------------- | ------------------------------------------------------------ |
| **SOLID**              | Single Responsibility en Services, Open/Closed en Strategies |
| **DDD**                | Bounded Contexts, Aggregates, Domain Events                  |
| **Clean Architecture** | Capas independientes, inyección de dependencias              |
| **CQRS**               | Separación de comandos y queries (futuro)                    |


### Escalabilidad


| Fase   | Usuarios | Arquitectura                  |
| ------ | -------- | ----------------------------- |
| MVP    | 1-100    | Monolito modular              |
| Growth | 100-10K  | Monolito + Redis cache        |
| Scale  | 10K+     | Microservicios + Event-driven |


## 1.6 Success Metrics


| Métrica                         | Target MVP | Target v1.0 |
| ------------------------------- | ---------- | ----------- |
| Tasa de completitud de sesiones | 60%        | 75%         |
| Retención de usuarios (D7)      | 40%        | 60%         |
| NPS                             | 30         | 50          |
| Tiempo de planificación manual  | -80%       | -95%        |


