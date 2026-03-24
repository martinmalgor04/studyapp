# 3. Architecture

## 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Browser    │  │   Mobile     │  │   Telegram   │                  │
│  │   (NextJS)   │  │   (Future)   │  │   (Future)   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 16 APP                                  │
│                    (Full Stack Application)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     FRONTEND LAYER                                │ │
│  │              (React Server Components + Client)                   │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  • App Router (Pages & Layouts)                                   │ │
│  │  • UI Components (React + TailwindCSS)                            │ │
│  │  • Client-side State (Zustand + React Query)                      │ │
│  │  • Form Management (React Hook Form + Zod)                        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │              BACKEND LAYER — Arquitectura de 4 Capas             │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  Aplicación: Server Actions (auth + validación + orquestación)    │ │
│  │  Dominio:    Services puros (algoritmos, sin Supabase)            │ │
│  │  Infra:      Repositories (único lugar con supabase.from())       │ │
│  │  Shared:     Validation Schemas (Zod), Utils, Middleware          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (BaaS)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Postgres  │  │    Auth     │  │   Storage   │  │  Realtime   │   │
│  │  (Database) │  │   (Users)   │  │   (Files)   │  │   (Future)  │   │
│  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────┼───────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                        PostgreSQL (Supabase)                            │
│   Users │ Subjects │ Exams │ Topics │ Sessions │ Stats │ Achievements  │
│                     + Row Level Security (RLS)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3.2 Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Type Safety**: TypeScript
- **State Management**: 
  - Server State: TanStack Query (React Query)
  - Client State: Zustand
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

### Backend
- **Framework**: Next.js 16 (Server Actions + API Routes)
- **Database Client**: Supabase JS Client
- **Validation**: Zod
- **Authentication**: Supabase Auth (session-based with cookies)

### Database & Infrastructure
- **Database**: PostgreSQL (via Supabase)
- **Auth Provider**: Supabase Auth
- **Storage**: Supabase Storage (for file uploads)
- **Deployment**: Vercel (production)
- **Local Dev**: Supabase CLI + Docker

### External Integrations (Future)
- **Calendar**: Google Calendar API
- **Notifications**: 
  - Email: Supabase + Resend
  - Push: OneSignal / Firebase
  - Telegram: Bot API

---

## 3.3 Project Structure

```
StudyApp/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # Register page
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts     # Auth callback
│   │   │
│   │   └── (dashboard)/             # Protected routes
│   │       ├── layout.tsx           # Dashboard layout + nav
│   │       └── dashboard/
│   │           ├── page.tsx         # Main dashboard
│   │           └── subjects/
│   │               ├── page.tsx     # Subjects list
│   │               └── [id]/
│   │                   └── page.tsx # Subject detail
│   │
│   ├── components/                   # React Components
│   │   ├── ui/                      # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   └── features/                # Feature-specific components
│   │       ├── auth/
│   │       │   ├── login-form.tsx
│   │       │   └── register-form.tsx
│   │       ├── subjects/
│   │       │   ├── subject-card.tsx
│   │       │   ├── subject-list.tsx
│   │       │   ├── subject-form.tsx
│   │       │   └── subject-dialog.tsx
│   │       ├── exams/
│   │       ├── topics/
│   │       ├── sessions/
│   │       └── dashboard/
│   │
│   ├── lib/                          # Core libraries
│   │   ├── supabase/                # Supabase clients
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── middleware.ts       # Middleware helper
│   │   │
│   │   ├── repositories/            # CAPA DE INFRAESTRUCTURA (único lugar con supabase.from())
│   │   │   ├── subjects.repository.ts
│   │   │   ├── exams.repository.ts
│   │   │   ├── topics.repository.ts
│   │   │   ├── sessions.repository.ts
│   │   │   ├── notifications.repository.ts
│   │   │   ├── user-settings.repository.ts
│   │   │   ├── availability.repository.ts
│   │   │   └── index.ts            # Re-exports
│   │   │
│   │   ├── actions/                 # CAPA DE APLICACIÓN (auth + validate + repo/service + revalidate)
│   │   │   ├── subjects.ts
│   │   │   ├── exams.ts
│   │   │   ├── topics.ts
│   │   │   ├── sessions.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── notifications.ts
│   │   │   ├── availability.ts
│   │   │   ├── google-calendar.ts
│   │   │   ├── auth.ts
│   │   │   ├── profile.ts
│   │   │   └── onboarding.ts
│   │   │
│   │   ├── services/                # CAPA DE DOMINIO (lógica pura, sin Supabase)
│   │   │   ├── session-generator.ts          # Algoritmo spaced repetition
│   │   │   ├── priority-calculator.ts        # Cálculo de prioridades
│   │   │   ├── progress-calculator.ts        # % de progreso por materia
│   │   │   ├── session-events.ts             # Event registry (puro)
│   │   │   ├── google-calendar.service.ts    # Solo Google Calendar API
│   │   │   ├── google-calendar-event-handler.ts
│   │   │   ├── google-tokens.helper.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── availability-importer.service.ts
│   │   │   └── notifications/               # Canales de notificación
│   │   │
│   │   ├── validations/             # Zod schemas
│   │   │   ├── subjects.ts
│   │   │   ├── exams.ts
│   │   │   ├── topics.ts
│   │   │   └── sessions.ts
│   │   │
│   │   └── utils/                   # Utility functions
│   │       ├── auth.ts              # getAuthenticatedUser() helper
│   │       └── ...
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-subjects.ts
│   │   ├── use-sessions.ts
│   │   └── use-user.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.types.ts       # Generated from Supabase
│   │   └── index.ts
│   │
│   └── middleware.ts                 # Next.js middleware (auth)
│
├── supabase/                         # Supabase configuration
│   ├── migrations/                  # SQL migrations
│   │   └── 20240126000001_initial_schema.sql
│   ├── functions/                   # Edge Functions (future)
│   ├── seed.sql                     # Seed data
│   └── config.toml                  # Local config
│
├── docs/                             # Documentation
│   └── spec-kit/                    # Technical specs
│
├── .env.local                        # Environment variables
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3.4 Data Flow

### Authentication Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Submit credentials
       ▼
┌─────────────────────┐
│  Register/Login     │
│  (Client Component) │
└──────┬──────────────┘
       │ 2. Call Supabase Auth
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  (Auth Provider)    │
└──────┬──────────────┘
       │ 3. Create session
       ▼
┌─────────────────────┐
│  Middleware         │
│  (Session Check)    │
└──────┬──────────────┘
       │ 4. Set cookies
       ▼
┌─────────────────────┐
│  Redirect to        │
│  /dashboard         │
└─────────────────────┘
```

### CRUD Flow (Example: Create Subject) — Arquitectura de 4 Capas

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Fill form
       ▼
┌─────────────────────┐   CAPA DE PRESENTACIÓN
│  SubjectForm        │   (Client Component)
│  ('use client')     │
└──────┬──────────────┘
       │ 2. onSubmit
       ▼
┌─────────────────────┐   CAPA DE APLICACIÓN
│  createSubject()    │   (Server Action)
│  auth + validate    │   → supabase.auth.getUser()
│  + revalidatePath() │   → createSubjectSchema.safeParse()
└──────┬──────────────┘
       │ 3. Call repository
       ▼
┌─────────────────────┐   CAPA DE INFRAESTRUCTURA
│  insertSubject()    │   (Repository — único lugar con supabase.from())
│  subjects.repo.ts   │
└──────┬──────────────┘
       │ 4. INSERT
       ▼
┌─────────────────────┐
│  PostgreSQL         │
│  (with RLS)         │
└──────┬──────────────┘
       │ 5. Return data
       ▼
┌─────────────────────┐
│  revalidatePath()   │   Next.js invalida caché → RSC se re-ejecuta
└──────┬──────────────┘
       │ 6. Re-render
       ▼
┌─────────────────────┐   CAPA DE PRESENTACIÓN (RSC)
│  SubjectsPage       │   Server Component re-fetches data
│  (RSC updated)      │
└─────────────────────┘
```

### Session Generation Flow ✅ IMPLEMENTADO

```
┌─────────────┐
│  Create     │
│  Topic      │   (topics.ts action)
└──────┬──────┘
       │ 1. createTopic() → generateSessions()
       ▼
┌─────────────────────────┐   CAPA DE APLICACIÓN
│  generateSessions()     │   (sessions.ts action)
│  (Server Action)        │   → findTopicWithFullInfo() via repo
└──────┬──────────────────┘
       │ 2. Call pure service
       ▼
┌─────────────────────────┐   CAPA DE DOMINIO (sin Supabase)
│  session-generator.ts   │   Modo Parcial: fechas hacia adelante
│  (Puro, sin createClient│   Modo Countdown: fechas hacia atrás (finales)
│   Inyección de deps)    │   Usa conflictChecker inyectado desde action
└──────┬──────────────────┘
       │ 3. Calculate priority
       ▼
┌─────────────────────────┐   CAPA DE DOMINIO (puro)
│  priority-calculator.ts │
└──────┬──────────────────┘
       │ 4. Insert sessions
       ▼
┌─────────────────────────┐   CAPA DE INFRAESTRUCTURA
│  insertSessions()       │   (sessions.repository.ts)
│  (Repository)           │
└──────┬──────────────────┘
       │ 5. Sync with Google Calendar (si está conectado)
       ▼
┌─────────────────────────┐
│  google-calendar.service│   Solo Google Calendar API (sin DB)
└─────────────────────────┘
```

---

## 3.5 Deployment Architecture

### Development

```
┌─────────────────────────────────────────────┐
│         Developer Machine (macOS)           │
├─────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Next.js Dev   │  │  Supabase CLI   │  │
│  │  (localhost:3000)│  │  (Docker)       │  │
│  └────────┬────────┘  └────────┬────────┘  │
│           │                    │            │
│           └────────────────────┘            │
└─────────────────────────────────────────────┘
```

**Services running locally:**
- Next.js: `http://localhost:3000`
- Supabase API: `http://localhost:54321`
- Supabase Studio: `http://localhost:54323`
- PostgreSQL: `postgresql://localhost:54322`

### Production

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE                          │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │         Next.js Application (SSR + Static)        │  │
│  │  • Server Components                              │  │
│  │  • Server Actions                                 │  │
│  │  • API Routes                                     │  │
│  │  • Edge Middleware                                │  │
│  └────────────────────┬──────────────────────────────┘  │
└─────────────────────┬─┴──────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE CLOUD                          │
├─────────────────────────────────────────────────────────┤
│  • PostgreSQL (Managed)                                 │
│  • Auth Service                                         │
│  • Storage Service                                      │
│  • Realtime Service                                     │
│  • Edge Functions                                       │
└─────────────────────────────────────────────────────────┘
```

**URL Structure:**
- Frontend: `https://studyapp.vercel.app`
- Supabase API: `https://[project-id].supabase.co`

---

## 3.6 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│                 Authentication Flow                 │
├─────────────────────────────────────────────────────┤
│  1. User submits credentials                        │
│  2. Supabase Auth validates                         │
│  3. JWT token issued (stored in httpOnly cookie)    │
│  4. Next.js middleware validates token on each req  │
│  5. RLS policies enforce data access                │
└─────────────────────────────────────────────────────┘
```

### Row Level Security (RLS)

Every table has RLS enabled with policies like:

```sql
-- Example: subjects table
CREATE POLICY "Users can view their own subjects"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);
```

### Environment Variables

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://studyapp.vercel.app

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For admin operations
DATABASE_URL=postgresql://...      # Direct DB access (migrations)
```

---

## 3.7 Design Principles Applied

### 0. Layered Architecture (4 Capas)
```
Presentación → Aplicación → Dominio → Infraestructura
  (RSC Pages)   (Actions)  (Services)  (Repositories)
```
- **Repositories**: único lugar con `supabase.from()`. Encapsulan todas las queries.
- **Services**: lógica de negocio pura, sin dependencias de infraestructura. Testeables sin DB.
- **Actions**: autentican, validan (Zod), orquestan repos/services, revalidan caché.
- **Pages (RSC)**: fetch de datos server-side, sin `useEffect` para carga inicial.

### 1. Server-First Architecture
- Use Server Components by default
- Client Components only when needed (interactivity, browser APIs)
- Server Actions for data mutations (no REST API needed for most operations)

### 2. Type Safety
- TypeScript everywhere
- Auto-generated types from Supabase schema
- Zod for runtime validation
- Type-safe Server Actions

### 3. Performance
- React Server Components (zero JS for static content)
- Streaming with Suspense
- Partial prerendering (PPR)
- Edge runtime where possible
- TanStack Query for client-side caching

### 4. Developer Experience
- Hot reload with Fast Refresh
- Type checking on save
- Supabase Studio for DB inspection
- Local development parity (Supabase CLI)

### 5. Security
- Row Level Security (RLS) at database level
- Server Actions protected by default
- CSRF protection via Next.js
- httpOnly cookies for sessions

---

## 3.8 Migration from N8N System

### Previous Architecture (N8N)
- Google Sheets as database
- N8N workflows for business logic
- Telegram as primary UI
- Google Calendar for scheduling

### Current Architecture (Next.js + Supabase)
- PostgreSQL (Supabase) as database
- Next.js Server Actions for business logic
- Web app as primary UI
- Telegram integration planned for v2.0

### Migration Benefits
1. **Scalability**: Proper relational database vs spreadsheets
2. **Maintainability**: TypeScript codebase vs visual workflows
3. **User Experience**: Rich web UI vs bot commands
4. **Performance**: Indexed queries vs sheet scans
5. **Multi-user**: RLS support vs single-user sheets

---

## 3.9 Future Enhancements

### Phase 1 (Current MVP)
- ✅ Authentication
- ✅ CRUD for Subjects, Exams, Topics
- ✅ Session generation with Spaced Repetition
- ✅ Daily dashboard

### Phase 2 (v1.0)
- Google Calendar integration
- Email notifications
- Session tracking & rescheduling
- Free study mode (countdown for finals)

### Phase 3 (v1.5)
- Gamification (streaks, levels, achievements)
- Analytics dashboard
- Task management (TPs)
- Mobile-responsive PWA

### Phase 4 (v2.0)
- Telegram bot integration
- Pomodoro timer
- Flashcards system
- AI program loader
- Native mobile app (React Native)

---

## 3.10 Technology Rationale

### Why Next.js 16?
- ✅ Full-stack framework (frontend + backend)
- ✅ Server Actions (no need for separate API)
- ✅ App Router with React Server Components
- ✅ Built-in TypeScript support
- ✅ Great developer experience
- ✅ Easy deployment (Vercel)

### Why Supabase?
- ✅ PostgreSQL (battle-tested relational DB)
- ✅ Built-in authentication
- ✅ Row Level Security (RLS)
- ✅ Auto-generated TypeScript types
- ✅ Real-time subscriptions (future)
- ✅ Excellent local development (CLI + Docker)
- ✅ Free tier generous for MVP

### Why NOT NestJS?
- ❌ Overkill for this project size
- ❌ Requires separate deployment (frontend + backend)
- ❌ More boilerplate code
- ❌ Next.js Server Actions cover 90% of needs
- ❌ Added complexity without clear benefit

### Why Server Actions over REST API?
- ✅ Type-safe by default (no HTTP layer)
- ✅ Automatic serialization
- ✅ Built into Next.js (no setup)
- ✅ Progressive enhancement
- ✅ Less boilerplate
- ✅ Can still use API Routes when needed (webhooks, external integrations)
