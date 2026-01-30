# 📚 StudyApp - Sistema de Repetición Espaciada

Sistema automatizado de estudio basado en **Spaced Repetition** (repetición espaciada) con Next.js y Supabase.

## 🎯 Objetivo

Ayudar a estudiantes a organizar y optimizar su tiempo de estudio mediante:
- Generación automática de repasos basados en intervalos científicos
- Priorización inteligente según dificultad y proximidad a exámenes
- Gamificación para mantener la motivación
- Integración con Google Calendar y Telegram

## 🏗️ Stack Tecnológico

- **Frontend & Backend**: Next.js 14 (App Router + Server Actions)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Styling**: TailwindCSS
- **Type Safety**: TypeScript
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod

## 📁 Estructura del Proyecto

```
StudyApp/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── auth/callback/
│   │   └── (dashboard)/         # Rutas protegidas
│   │       └── dashboard/
│   ├── components/              # Componentes React
│   │   ├── ui/                 # Componentes base
│   │   ├── layout/             # Layout components
│   │   ├── features/           # Feature components
│   │   └── shared/             # Shared components
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase
│   │   ├── services/           # Lógica de negocio
│   │   └── utils/              # Utilidades
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   ├── config.toml             # Configuración local
│   └── seed.sql                # Datos iniciales
├── docs/
│   └── spec-kit/               # Documentación técnica
├── .env.local                  # Variables de entorno
├── package.json
└── README.md
```

## 🚀 Setup Rápido

### Prerrequisitos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase CLI (opcional para desarrollo local)

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Configurar Supabase

#### Opción A: Supabase Local (Recomendado para desarrollo)

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase

# Iniciar servicios locales (Postgres, Auth, Studio)
pnpm supabase:start

# Nota: La primera vez puede tardar varios minutos descargando imágenes Docker
```

Esto iniciará:
- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

Copia las claves que aparecen en la consola a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

#### Opción B: Supabase Cloud

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener URL y Anon Key del proyecto
3. Actualizar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

4. Aplicar migraciones:

```bash
# Conectar con tu proyecto
supabase link --project-ref <tu-project-ref>

# Aplicar migraciones
supabase db push
```

### 3. Iniciar Desarrollo

```bash
pnpm dev
```

Abre http://localhost:3000 en tu navegador.

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Inicia servidor de producción |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm supabase:start` | Inicia Supabase local |
| `pnpm supabase:stop` | Detiene Supabase local |
| `pnpm supabase:status` | Ver estado de servicios |
| `pnpm supabase:reset` | Resetear base de datos local |
| `pnpm db:types` | Generar tipos TypeScript desde schema |

## 🗄️ Base de Datos

### Schema Principal

- **users** - Usuarios (extiende auth.users de Supabase)
- **subjects** - Materias
- **exams** - Exámenes (Parciales, Finales, Recuperatorios)
- **topics** - Temas de estudio
- **sessions** - Sesiones de repaso programadas
- **user_stats** - Estadísticas y gamificación
- **achievements** - Logros
- **tasks** - Tareas (TPs, trabajos)
- **notifications** - Notificaciones

Ver [`supabase/migrations/20240126000001_initial_schema.sql`](supabase/migrations/20240126000001_initial_schema.sql) para el schema completo.

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas para que cada usuario solo pueda acceder a sus propios datos.

## 📚 Documentación

- **Spec Kit Completo**: [`docs/spec-kit/00-index.md`](docs/spec-kit/00-index.md)
- **Arquitectura**: [`docs/spec-kit/03-architecture.md`](docs/spec-kit/03-architecture.md)
- **Domain Model**: [`docs/spec-kit/04-domain-model.md`](docs/spec-kit/04-domain-model.md)
- **Use Cases**: [`docs/spec-kit/05-use-cases.md`](docs/spec-kit/05-use-cases.md)
- **API Specification**: [`docs/spec-kit/07-api-specification.md`](docs/spec-kit/07-api-specification.md)

## 🎯 Roadmap MVP (Semanas 1-4)

### Sprint 1 (Semana 1-2): Auth + Foundation
- ✅ Setup Supabase + Schema
- ✅ Auth (Login/Register)
- ✅ Database con RLS
- 🔄 Dashboard básico

### Sprint 2 (Semana 3-4): Core Study
- 🔄 CRUD de Materias
- 🔄 CRUD de Exámenes
- 🔄 CRUD de Temas
- 🔄 Generación de Sesiones (Algoritmo de Spaced Repetition)

Ver [`docs/spec-kit/09-roadmap.md`](docs/spec-kit/09-roadmap.md) para el plan completo.

## 📊 Intervalos de Repetición

Basados en la curva del olvido de Ebbinghaus:

| Dificultad | Intervalos (días) |
|------------|-------------------|
| Fácil | 1, 5, 12, 25 |
| Medio | 1, 3, 7, 14, 30 |
| Difícil | 1, 2, 4, 8, 15, 25 |

## 🎮 Gamificación

- **Rachas**: Días consecutivos completando repasos
- **Niveles por Materia**: Progresión según repasos completados
- **Puntos**: +10 completado, -5 fallido, x2 si es CRÍTICO
- **Achievements**: Logros desbloqueables

## 🔐 Autenticación

El sistema usa Supabase Auth con:
- Email/Password nativo
- Row Level Security para proteger datos
- Session management con cookies
- Middleware de Next.js para proteger rutas

## 🧪 Testing (Próximamente)

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## 📝 Contribuir

Este es un proyecto personal en desarrollo activo. Si querés contribuir:

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 👤 Autor

**Martín Malgor** - Ingeniería en Sistemas

## 📄 Licencia

Proyecto personal - Todos los derechos reservados
