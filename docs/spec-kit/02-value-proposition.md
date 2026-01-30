# 2. Value Proposition Canvas

## 2.1 Customer Profile

### 2.1.1 Customer Jobs

| ID | Job | Tipo | Frecuencia | Importancia |
|----|-----|------|------------|-------------|
| J1 | Aprobar parciales teóricos | Funcional | Mensual | 🔴 Crítica |
| J2 | Aprobar parciales prácticos | Funcional | Mensual | 🔴 Crítica |
| J3 | Aprobar finales | Funcional | Cuatrimestral | 🔴 Crítica |
| J4 | Recuperar parciales | Funcional | Ocasional | 🟠 Alta |
| J5 | Entregar TPs a tiempo | Funcional | Semanal | 🟠 Alta |
| J6 | Organizar tiempo de estudio | Funcional | Diario | 🔴 Crítica |
| J7 | Retener información LP | Funcional | Continuo | 🟠 Alta |
| J8 | Sentirme preparado | Emocional | Pre-examen | 🟠 Alta |
| J9 | Reducir estrés académico | Emocional | Continuo | 🟡 Media |
| J10 | Tener control del progreso | Social | Continuo | 🟡 Media |

### 2.1.2 Customer Pains

| ID | Pain | Severidad | Frecuencia | Feature que lo resuelve |
|----|------|-----------|------------|-------------------------|
| P1 | No sé qué estudiar | 🔴 Alta | Diario | Dashboard + Notificaciones |
| P2 | Procrastino | 🔴 Alta | Diario | Agenda automática |
| P3 | Me colapso pre-examen | 🔴 Alta | Pre-examen | Distribución inteligente |
| P4 | No cumplo sesiones | 🟠 Media | Semanal | Reagendado + Gamificación |
| P5 | No sé cuánto tiempo | 🟠 Media | Diario | Duración calculada |
| P6 | Olvido lo estudiado | 🟠 Media | Continuo | Spaced Repetition |
| P7 | Cuesta retomar | 🔴 Alta | Ocasional | Modo Estudio Libre |
| P8 | Sin visibilidad | 🟡 Baja | Semanal | Analytics Dashboard |
| P9 | Mezclo conceptos | 🟠 Media | Pre-examen | Sesiones separadas |
| P10 | Me frustro | 🔴 Alta | Pre-examen | Gamificación |

### 2.1.3 Customer Gains

| ID | Gain | Importancia | Feature |
|----|------|-------------|---------|
| G1 | Claridad diaria | 🔴 Crítico | Daily View |
| G2 | Automatización | 🔴 Crítico | Session Generator |
| G3 | Retención LP | 🟠 Importante | Spaced Rep Algorithm |
| G4 | Preparación | 🔴 Crítico | Priority System |
| G5 | Menos ansiedad | 🟠 Importante | Progress Tracking |
| G6 | Ver progreso | 🟡 Deseable | Analytics |
| G7 | Pomodoro | 🟡 Deseable | Timer |
| G8 | Flashcards | 🟡 Deseable | Cards Module |
| G9 | Adaptar calendario | 🟠 Importante | Calendar Sync |
| G10 | Mínimo esfuerzo | 🟠 Importante | Quick Actions |

---

## 2.2 Priorización de Features

### Matriz de Priorización (Value vs Complexity)

```
                    VALOR PARA EL USUARIO
                    Bajo ─────────────────── Alto
                    │                        │
    Baja ─────────┬─┴────────────────────────┴─┬
                  │ 📋 BACKLOG                 │ ✅ QUICK WINS
                  │                            │
                  │ • Flashcards               │ • Auth + Onboarding
    COMPLEJIDAD   │ • Pomodoro Timer           │ • Dashboard básico
    TÉCNICA       │ • IA Programas             │ • Crear sesiones manual
                  │ • Mobile App               │
                  │                            │
    Alta ─────────┼────────────────────────────┼
                  │ ⚠️ EVITAR                  │ 🎯 ESTRATÉGICOS
                  │                            │
                  │ • Multi-tenancy            │ • Spaced Rep Engine
                  │ • Real-time collab         │ • Calendar Integration
                  │                            │ • Gamificación
                  │                            │ • Analytics
                  └────────────────────────────┘
```

### Priorización Final con Value Proposition Canvas

| Prioridad | Feature | Jobs | Pains | Value | Complexity | Score |
|-----------|---------|------|-------|-------|------------|-------|
| **P0** | Auth + User Management | J6 | - | 🔴 | ⬜ Baja | 95 |
| **P0** | Subject/Exam CRUD | J1,J2,J3 | P1 | 🔴 | ⬜ Baja | 93 |
| **P0** | Topic/Class CRUD | J1,J2 | P1,P5 | 🔴 | ⬜ Baja | 92 |
| **P0** | Session Generator (Spaced Rep) | J6,J7 | P1,P2,P6 | 🔴 | 🟠 Media | 90 |
| **P0** | Daily Dashboard | J6 | P1,P8 | 🔴 | ⬜ Baja | 88 |
| **P1** | Session Tracking | J6 | P4 | 🟠 | ⬜ Baja | 82 |
| **P1** | Reschedule Sessions | J6 | P4 | 🟠 | 🟡 Media | 78 |
| **P1** | Free Study Mode | J3 | P7 | 🟠 | 🟡 Media | 75 |
| **P1** | Notifications (Email/Push) | J6 | P1,P2 | 🟠 | 🟡 Media | 73 |
| **P1** | Google Calendar Sync | J6 | P2 | 🟠 | 🟠 Alta | 70 |
| **P2** | Gamification (Streaks) | J9,J10 | P4,P10 | 🟡 | 🟡 Media | 65 |
| **P2** | Analytics Dashboard | J10 | P8 | 🟡 | 🟡 Media | 60 |
| **P2** | Task/TP Management | J5 | P2 | 🟡 | ⬜ Baja | 58 |
| **P3** | Pomodoro Timer | J6 | P2 | 🟡 | ⬜ Baja | 45 |
| **P3** | Flashcards | J7 | P6 | 🟡 | 🟡 Media | 42 |
| **P3** | AI Program Loader | J6 | P5 | 🟡 | 🔴 Alta | 35 |
| **P4** | Mobile App | J6 | P1 | 🟡 | 🔴 Alta | 30 |

---

## 2.3 Release Planning

### MVP (Semanas 1-4)

**Objetivo**: Usuario puede registrarse, crear materias/temas, y recibir sesiones de estudio automatizadas.

| Feature | Descripción | Criterio de Aceptación |
|---------|-------------|------------------------|
| Auth | Registro/Login con email | Usuario puede crear cuenta |
| Subjects | CRUD de materias | Usuario puede crear/editar materias |
| Exams | CRUD de parciales/finales | Usuario puede definir fechas de exámenes |
| Topics | CRUD de temas/clases | Usuario puede registrar temas |
| Sessions | Generación automática | Sistema genera repasos con intervalos |
| Dashboard | Vista diaria | Usuario ve sesiones del día |

### v1.0 (Semanas 5-8)

**Objetivo**: Sistema completo de tracking y reagendado.

| Feature | Descripción |
|---------|-------------|
| Tracking | Marcar sesiones como completadas/no |
| Reschedule | Reagendar sesiones no completadas |
| Free Study | Modo countdown para finales |
| Notifications | Emails de recordatorio |
| Calendar Sync | Integración con Google Calendar |

### v1.5 (Semanas 9-12)

**Objetivo**: Engagement y analytics.

| Feature | Descripción |
|---------|-------------|
| Gamification | Rachas, puntos, niveles |
| Analytics | Dashboard de estadísticas |
| Tasks | Gestión de TPs |

### v2.0 (Futuro)

| Feature | Descripción |
|---------|-------------|
| Pomodoro | Timer integrado |
| Flashcards | Sistema tipo Anki |
| AI | Carga de programas con IA |
| Mobile | App nativa |

---

## 2.4 Fit Score por Release

| Release | Pains Cubiertos | Gains Cubiertos | Fit |
|---------|-----------------|-----------------|-----|
| MVP | P1, P2, P5, P6 (4/10) | G1, G2, G3 (3/10) | 40% |
| v1.0 | + P4, P7 (6/10) | + G4, G9 (5/10) | 60% |
| v1.5 | + P8, P10 (8/10) | + G5, G6 (7/10) | 80% |
| v2.0 | + P3, P9 (10/10) | + G7, G8, G10 (10/10) | 100% |
