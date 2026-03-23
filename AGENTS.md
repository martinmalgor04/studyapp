# StudyApp - Instrucciones para Agentes de IA

## Reglas Fundamentales

### 1. NO INVENTAR - Preguntar siempre

**Si algo no está claro, NO asumas. Preguntá.**

Ejemplos de cuándo preguntar:
- Decisiones de arquitectura no documentadas
- Comportamiento de negocio ambiguo
- Priorización de features
- Elección entre múltiples opciones válidas
- Cambios que afectan la estructura del proyecto

```
❌ MAL: "Voy a implementar esto con Redux porque es popular"
✅ BIEN: "Para el estado global, ¿preferís Zustand (más simple) o Redux (más features)?"
```

### 1.5. ACTUALIZAR ROADMAP - Después de cada implementación

**Después de completar cualquier feature o tarea de codificación, SIEMPRE actualizar `docs/spec-kit/09-roadmap.md`**

Acciones requeridas:
- Marcar las tareas completadas con ✅
- Actualizar el porcentaje de progreso del sprint
- Actualizar "MVP Completion" si aplica
- Actualizar la sección "En Progreso" con el próximo paso
- Actualizar tiempo estimado restante

```
❌ MAL: Terminar la implementación y no actualizar el roadmap
✅ BIEN: Al finalizar Topics CRUD → Actualizar roadmap marcando ✅ y calculando nuevo progreso
```

### 1.6. VALIDAR BUILD - Antes de cada commit

**Antes de hacer commit, SIEMPRE correr `pnpm build` para validar que el código compila correctamente**

Acciones requeridas:
- Ejecutar `pnpm build` antes de cada commit
- Verificar que no haya errores de ESLint ni TypeScript
- Si hay warnings, evaluarlos y corregir los relevantes
- Si el build falla, arreglar antes de commitear

```bash
# Proceso correcto antes de commit
pnpm build              # ✅ Build exitoso
pnpm lint               # ✅ Sin errores de ESLint
git add .
git commit -m "..."
git push
```

```
❌ MAL: Commitear código sin verificar que compila → Build falla en Vercel
✅ BIEN: Correr build local → Arreglar errores → Commitear código validado
```

**Razón:** Vercel usa Next.js 14.x en producción. Código que funciona en dev puede fallar en build de producción por:
- Imports no usados (ESLint error)
- Dependencias faltantes en `useEffect`
- Type errors que solo aparecen en build
- Warnings que se convierten en errores con `--strict`

### 2. Arquitectura > Velocidad

**Prioridad: Arquitectura y Escalabilidad > Tiempo y Features rápidas**

- Preferir código limpio y bien estructurado aunque tome más tiempo
- Aplicar patrones de diseño cuando corresponda (SOLID, GRASP, GOF)
- No hacer "hacks" o soluciones rápidas que comprometan la calidad
- Pensar en cómo escala antes de implementar

### 3. Simple pero Escalable

La arquitectura debe ser:
- **Simple**: Fácil de entender y mantener
- **Escalable**: Preparada para crecer sin reescribir
- **Consistente**: Patrones uniformes en todo el proyecto

### 4. Local-first, Production-ready

**Desarrollo 100% local, pero siempre listo para producción.**

- Desarrollo: Supabase local + Next.js local
- Producción: Supabase Cloud + Vercel
- El código debe funcionar igual en ambos entornos
- NO hardcodear URLs o configuraciones específicas de entorno

---

## Descripción del Proyecto

**StudyApp** es un sistema de estudio automatizado basado en **Spaced Repetition** (repetición espaciada).

### Problema que resuelve
> "No sé qué estudiar en cada momento" → Claridad diaria de qué estudiar

### Solución
- Genera repasos automáticos basados en intervalos científicos
- Prioriza según dificultad y proximidad a exámenes
- Gamificación para mantener motivación
- Integración con Google Calendar y Telegram

### Usuario
- Martín Malgor - Estudiante de Ingeniería
- Telegram Chat ID: `6886920024`

---

## Stack Tecnológico

### Frontend & Backend
- **Next.js 14** (App Router)
- **React 18** con Server Components
- **TypeScript** estricto
- **TailwindCSS** para estilos

### Base de Datos & Auth
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)** para seguridad
- Desarrollo: Supabase CLI local
- Producción: Supabase Cloud

### Contenedores (Local)
- **Docker Desktop** (Estándar)
- Supabase CLI usa Docker nativo

### Producción
- **Vercel** para frontend/backend
- **Supabase Cloud** para DB/Auth

### Herramientas
- **pnpm** como package manager
- **ESLint + Prettier** para linting
- **Zod** para validación
- **React Hook Form** para formularios
- **TanStack Query** para data fetching

---

## Estructura del Proyecto

```
StudyApp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Rutas públicas de auth
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── auth/callback/
│   │   ├── (dashboard)/              # Rutas protegidas
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── sessions/
│   │   │   └── settings/
│   │   ├── api/                      # API Routes (cuando necesario)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes base reutilizables
│   │   ├── layout/                   # Header, Sidebar, Footer
│   │   ├── features/                 # Componentes por feature
│   │   │   ├── auth/
│   │   │   ├── subjects/
│   │   │   ├── sessions/
│   │   │   └── dashboard/
│   │   └── shared/                   # Componentes compartidos
│   │
│   ├── lib/
│   │   ├── supabase/                 # Clientes Supabase
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   └── middleware.ts        # Middleware helper
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── session-generator.ts
│   │   │   ├── priority-calculator.ts
│   │   │   └── slot-finder.ts
│   │   └── utils/                    # Utilidades generales
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-subjects.ts
│   │   └── use-sessions.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.types.ts        # Auto-generado por Supabase
│   │   └── index.ts
│   │
│   └── middleware.ts                 # Next.js middleware (auth)
│
├── supabase/
│   ├── config.toml                   # Configuración local
│   ├── migrations/                   # SQL migrations
│   │   └── 20240126000001_initial_schema.sql
│   ├── functions/                    # Edge Functions (opcional)
│   └── seed.sql                      # Datos iniciales
│
├── docs/
│   ├── spec-kit/                     # Especificación técnica completa
│   ├── DOCKER_SETUP.md
│   └── ...
│
├── n8n/                              # Workflows legacy (referencia)
│   └── workflows/
│
├── .env.local                        # Variables de entorno (NO commitear)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## Base de Datos

### Schema Principal

Ver `supabase/migrations/20240126000001_initial_schema.sql` para el schema completo.

**Tablas principales:**

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios (extiende auth.users) |
| `subjects` | Materias |
| `exams` | Exámenes (Parciales, Finales, Recuperatorios) |
| `topics` | Temas de estudio |
| `sessions` | Sesiones de repaso programadas |
| `user_stats` | Estadísticas (rachas, puntos) |
| `achievements` | Logros disponibles |
| `user_achievements` | Logros desbloqueados |
| `tasks` | Tareas (TPs, trabajos) |
| `notifications` | Notificaciones |

### Enums

```sql
-- Dificultad de temas
difficulty: 'EASY' | 'MEDIUM' | 'HARD'

-- Tipos de examen
exam_type: 'PARCIAL_THEORY' | 'PARCIAL_PRACTICE' | 'RECUPERATORIO_THEORY' | 
           'RECUPERATORIO_PRACTICE' | 'FINAL_THEORY' | 'FINAL_PRACTICE' | 'TP'

-- Origen del tema
topic_source: 'CLASS' | 'FREE_STUDY' | 'PROGRAM'

-- Estado de sesión
session_status: 'PENDING' | 'COMPLETED' | 'INCOMPLETE' | 'RESCHEDULED' | 'ABANDONED'

-- Prioridad
priority: 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW'
```

### Row Level Security (RLS)

**Todas las tablas tienen RLS habilitado.** Cada usuario solo ve sus propios datos.

```sql
-- Ejemplo de política
CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Algoritmos de Negocio

### Intervalos de Repetición Espaciada (Anki Standard)

```typescript
// UNIVERSAL: Siempre 4 sesiones para TODOS los temas
// Basado en algoritmo de Anki para óptima retención
const INTERVALS = [1, 3, 7, 14]; // días desde source_date

// Reducción de duración por sesión (no por dificultad)
const DURATION_FACTORS = [0.60, 0.35, 0.30, 0.25];
// R1 = 60% del tiempo base, R2 = 35%, R3 = 30%, R4 = 25%

// Multiplicadores de duración por DIFICULTAD
const DIFFICULTY_MULTIPLIERS = {
  EASY: 0.7,    // Temas fáciles requieren menos tiempo
  MEDIUM: 1.0,  // Duración estándar
  HARD: 1.3     // Temas difíciles requieren más tiempo
};

// Cálculo de duración de sesión:
// duration = topic.hours × DIFFICULTY_MULTIPLIERS[difficulty] × DURATION_FACTORS[sessionIndex]
// Ejemplo: topic.hours=120min, HARD, R1 → 120 × 1.3 × 0.60 = 93.6min
```

### Cálculo de Prioridad

```typescript
// Score total (0-100+)
const calculatePriority = (params) => {
  const urgency = getUrgencyScore(daysToExam);      // 0-40
  const difficulty = getDifficultyScore(level);     // 10-30
  const sessionNumber = getSessionScore(number);    // 5-20 (R1 más importante)
  const proximity = getProximityScore(daysToSession); // 2-12
  
  // BONUS para Finales: urgency mínima = 30
  if (isFinalExam && urgency < 30) urgency = 30;
  
  const score = urgency + difficulty + sessionNumber + proximity;
  
  // Clasificación
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'URGENT';
  if (score >= 50) return 'IMPORTANT';
  if (score >= 30) return 'NORMAL';
  return 'LOW';
};
```

**Ver documentación completa:** `AGENTS.md` (sección "Algoritmos de Negocio" más arriba)

### Energía Circadiana

```typescript
// Multiplicador de productividad por hora
const CIRCADIAN_ENERGY = {
  6: 0.4, 7: 0.5, 8: 0.6, 9: 0.75, 10: 0.9, 11: 1.0,   // Mañana
  12: 0.7, 13: 0.6, 14: 0.5,                             // Post-almuerzo
  15: 0.7, 16: 0.9, 17: 1.0, 18: 0.95, 19: 0.85,       // Tarde (óptimo)
  20: 0.7, 21: 0.6, 22: 0.4, 23: 0.3                    // Noche
};

// Usar para priorizar slots de horario
// Sesiones difíciles → horarios con energía >= 0.9
```

### Modos de Generación de Sesiones

**HAY DOS MODOS según el tipo de examen asociado al topic:**

#### Modo A: Parcial/Recuperatorio (Con Clases)

```typescript
// Topic con exam_id → PARCIAL_* o RECUPERATORIO_*
// source = 'CLASS'
// source_date = fecha de la clase

// Generación: HACIA ADELANTE desde la clase
// R1: source_date + 1 día
// R2: source_date + 3 días  
// R3: source_date + 7 días
// R4: source_date + 14 días (Total: 25 días)

// Prioridad: Calculada según algoritmo estándar
```

#### Modo B: Final (Estudio Libre / Countdown)

```typescript
// Topic con exam_id → FINAL_*
// source = 'FREE_STUDY'
// source_date = created_at (fecha de creación del topic)

// Generación: HACIA ATRÁS desde el examen
// Si exam.date - today >= 25 días:
//   R4: exam.date - 1 día   (repaso final)
//   R3: exam.date - 3 días
//   R2: exam.date - 7 días
//   R1: exam.date - 14 días
//
// Si exam.date - today < 25 días:
//   Comprimir proporcionalmente + mostrar warning
//   "⚠️ Tiempo ajustado: sesiones comprimidas por proximidad del examen"

// Prioridad: URGENT o CRITICAL por default (finales son más importantes)
```

#### Transición Automática: Parcial → Final

```typescript
// Caso: Ya estudiaste temas para parcial, ahora tenés final

// TRIGGER: Se crea un Exam tipo FINAL_* para la materia
// ACCIÓN AUTOMÁTICA:
//   1. Buscar TODOS los topics de esa materia
//   2. Para cada topic:
//      - Si tiene exam_id de un parcial → cambiar exam_id al final
//      - Eliminar sesiones viejas (del parcial)
//      - Regenerar sesiones en modo countdown (invertido)
//      - Actualizar source = 'FREE_STUDY'
//      - source_date = NOW (empezamos a estudiar desde hoy)

// Ejemplo:
// Sept: Clase "Límites" → sesiones para Parcial 1 (Oct)
// Nov: Se carga Final (Dic)
// → "Límites" se convierte automáticamente en topic de final
// → Se generan sesiones R4, R3, R2, R1 hacia el final
```

---

## Patrones de Diseño

### Services (Lógica de Negocio)

Ubicación: `src/lib/services/`

```typescript
// Ejemplo: session-generator.service.ts
export class SessionGeneratorService {
  constructor(
    private priorityCalculator: PriorityCalculatorService,
    private slotFinder: SlotFinderService
  ) {}

  async generate(topic: Topic, exam: Exam): Promise<Session[]> {
    const intervals = this.getIntervals(topic.difficulty);
    const sessions: Session[] = [];

    for (let i = 0; i < intervals.length; i++) {
      const scheduledAt = this.calculateDate(topic, intervals[i]);
      const priority = this.priorityCalculator.calculate({...});
      const slot = await this.slotFinder.findBest(scheduledAt, duration);
      
      sessions.push({
        number: i + 1,
        scheduledAt: slot.startTime,
        duration: this.calculateDuration(topic.hours, i),
        priority,
        // ...
      });
    }

    return sessions;
  }
}
```

### Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  React Components, Pages, Forms                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  Server Actions, API Routes, Hooks                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN/SERVICE LAYER                    │
│  SessionGenerator, PriorityCalculator, SlotFinder           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
│  Supabase Client, Database Queries                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Comandos de Desarrollo

### Setup Inicial

```bash
# Instalar dependencias
pnpm install

# Iniciar Supabase local (requiere Docker Desktop)
pnpm supabase:start

# Copiar keys a .env.local (ver output del comando anterior)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Iniciar Next.js
pnpm dev
```

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm supabase:start` | Iniciar Supabase local |
| `pnpm supabase:stop` | Detener Supabase local |
| `pnpm supabase:status` | Ver estado de servicios |
| `pnpm supabase:reset` | Resetear DB (aplica migrations + seed) |
| `pnpm db:types` | Generar tipos TypeScript desde schema |

### URLs Locales

| Servicio | URL |
|----------|-----|
| Next.js | http://localhost:3000 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |
| PostgreSQL | postgresql://postgres:postgres@localhost:54322/postgres |

---

## Configuración de Entorno

### .env.local (NO commitear)

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# Supabase Cloud (para producción)
# NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuración de Docker

Supabase CLI usa Docker Desktop por defecto. Asegurate de tenerlo instalado y corriendo.

```bash
# Verificar instalación
docker info
```

---

## Convenciones de Código

### TypeScript

- Strict mode habilitado
- No usar `any` - preferir `unknown` y type guards
- Interfaces para objetos, Types para unions/primitivos
- Zod para validación en runtime

```typescript
// ✅ BIEN
interface CreateSubjectDto {
  name: string;
  description?: string;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// ❌ MAL
const data: any = fetchData();
```

### Componentes React

- Componentes funcionales siempre
- Server Components por defecto, 'use client' solo cuando necesario
- Props tipadas con interfaces
- Hooks custom para lógica reutilizable

```typescript
// Server Component (default)
export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('subjects').select();
  return <SubjectList subjects={data} />;
}

// Client Component (solo cuando necesario)
'use client';
export function SubjectForm() {
  const [name, setName] = useState('');
  // ...
}
```

### Nombres

- **Archivos**: kebab-case (`session-generator.ts`)
- **Componentes**: PascalCase (`SessionCard.tsx` o `session-card.tsx`)
- **Variables/Funciones**: camelCase (`calculatePriority`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (`CreateSessionDto`)

### Estructura de Features

Cada feature sigue esta estructura:

```
src/
├── app/(dashboard)/subjects/
│   ├── page.tsx                    # Lista
│   ├── [id]/page.tsx               # Detalle
│   └── new/page.tsx                # Crear
├── components/features/subjects/
│   ├── subject-list.tsx
│   ├── subject-form.tsx
│   └── subject-card.tsx
├── lib/services/
│   └── subjects.service.ts
└── hooks/
    └── use-subjects.ts
```

---

## Flujo de Estados (Sesiones)

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  COMPLETED  │          │ INCOMPLETE  │
       └─────────────┘          └──────┬──────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                          ▼                         ▼
                   ┌─────────────┐          ┌─────────────┐
                   │ RESCHEDULED │          │  ABANDONED  │
                   └──────┬──────┘          └─────────────┘
                          │                 (después de 2 intentos)
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       ┌─────────────┐         ┌─────────────┐
       │  COMPLETED  │         │  ABANDONED  │
       └─────────────┘         └─────────────┘
```

---

## Roadmap de Desarrollo

### MVP (Sprint 1-4)

| Sprint | Semanas | Features |
|--------|---------|----------|
| 1 | 1-2 | Setup + Auth + Dashboard base |
| 2 | 3-4 | CRUD Subjects, Exams, Topics |
| 3 | 5-6 | Session Generator + Tracking |
| 4 | 7-8 | Dashboard completo + Calendar |

### v1.0 (Sprint 5-6)

- Reagendado con opciones
- Modo Estudio Libre (countdown)
- Integración Google Calendar
- Notificaciones

### v1.5 (Sprint 7-8)

- Gamificación (rachas, puntos, niveles)
- Analytics dashboard
- Gestión de TPs/Tareas

### Futuro

- Mobile app (React Native)
- Telegram bot
- Carga de programas con IA
- Sistema adaptativo

---

## Documentación Adicional

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Spec Kit completo | `docs/spec-kit/` | Especificación técnica detallada |
| Value Proposition | `docs/spec-kit/02-value-proposition.md` | Canvas del producto |
| Use Cases | `docs/spec-kit/05-use-cases.md` | Casos de uso detallados |
| Database Schema | `docs/spec-kit/06-database-schema.md` | Schema completo |
| Design Patterns | `docs/spec-kit/08-design-patterns.md` | SOLID, GRASP, GOF aplicados |
| Roadmap | `docs/spec-kit/09-roadmap.md` | Plan de implementación |
| Supabase Setup | `docs/DOCKER_SETUP.md` | Guía de configuración local con Docker |

---

## Checklist para Nuevas Features

Antes de implementar una feature, verificar:

- [ ] ¿Está clara la especificación? Si no, **preguntar**
- [ ] ¿Hay schema de DB necesario? → Crear migration
- [ ] ¿Hay tipos TypeScript? → Regenerar con `pnpm db:types`
- [ ] ¿Sigue la estructura de carpetas definida?
- [ ] ¿Tiene RLS configurado si es tabla nueva?
- [ ] ¿El código es testeable (servicios separados)?
- [ ] ¿Funciona igual en local y producción?

---

## Contacto

- **Usuario**: Martín Malgor
- **Proyecto**: StudyApp - Sistema de Repetición Espaciada
- **Telegram**: @martinmalgor (chat_id: `6886920024`)
- **Repo**: github.com/martinmalgor04/studyapp
