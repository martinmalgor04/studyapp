# 6. Database Schema

> **IMPORTANTE**: El schema real y canónico está en `supabase/migrations/`.  
> Este documento describe las tablas, relaciones y enums de alto nivel.

## 6.1 Tecnología

| Elemento | Tecnología |
|----------|------------|
| Motor | PostgreSQL (vía Supabase) |
| Migrations | Supabase CLI (`pnpm supabase db reset`) |
| Tipos TypeScript | Auto-generados con `pnpm db:types` |
| Seguridad | Row Level Security (RLS) en todas las tablas |

**Migrations actuales** (en `supabase/migrations/`):

| Archivo | Descripción |
|---------|-------------|
| `20240126000001_initial_schema.sql` | Schema inicial (tablas principales) |
| `20260129205003_subject_extended_fields.sql` | Campos extendidos de subjects |
| `20260204211510_user_settings.sql` | Tabla user_settings |
| `20260205105237_availability_slots.sql` | Tabla availability_slots |
| `20260205112024_add_onboarding_completed.sql` | Campo onboarding en user_settings |
| `20260205191009_session_tracking_fields.sql` | Campos de tracking en sessions |
| `20260208213945_google_calendar_tokens.sql` | Tokens de Google Calendar |
| `20260211142226_google_calendar_bidirectional_sync.sql` | Sync bidireccional |
| `20260318111719_add_conflict_tracking.sql` | Tracking de conflictos |

---

## 6.2 Enums

```sql
CREATE TYPE difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');

CREATE TYPE exam_type AS ENUM (
  'PARCIAL_THEORY', 'PARCIAL_PRACTICE',
  'RECUPERATORIO_THEORY', 'RECUPERATORIO_PRACTICE',
  'FINAL_THEORY', 'FINAL_PRACTICE',
  'TP'
);

CREATE TYPE topic_source AS ENUM ('CLASS', 'FREE_STUDY', 'PROGRAM');

CREATE TYPE session_status AS ENUM (
  'PENDING', 'COMPLETED', 'INCOMPLETE', 'RESCHEDULED', 'ABANDONED'
);

CREATE TYPE priority AS ENUM ('CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW');

CREATE TYPE notification_type AS ENUM (
  'SESSION_REMINDER', 'EXAM_APPROACHING', 'STREAK_WARNING',
  'ACHIEVEMENT_UNLOCKED', 'SESSION_RESCHEDULED', 'GENERAL'
);
```

---

## 6.3 Tablas Principales

### `users` (extiende `auth.users`)
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `subjects`
```sql
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  year        INTEGER,
  semester    INTEGER,
  status      TEXT DEFAULT 'CURSANDO',
  professors  TEXT[],
  schedule    JSONB,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `exams`
```sql
CREATE TABLE exams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  type        exam_type NOT NULL,
  number      INTEGER,
  date        DATE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `topics`
```sql
CREATE TABLE topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id     UUID REFERENCES exams(id),
  name        TEXT NOT NULL,
  description TEXT,
  difficulty  difficulty DEFAULT 'MEDIUM',
  hours       INTEGER NOT NULL,  -- minutos totales
  source      topic_source DEFAULT 'CLASS',
  source_date TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `sessions`
```sql
CREATE TABLE sessions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id),
  topic_id               UUID REFERENCES topics(id),
  subject_id             UUID REFERENCES subjects(id),
  number                 INTEGER NOT NULL,  -- R1, R2, R3, R4
  scheduled_at           TIMESTAMPTZ NOT NULL,
  duration               INTEGER NOT NULL,  -- minutos
  priority               priority DEFAULT 'NORMAL',
  status                 session_status DEFAULT 'PENDING',
  -- tracking fields
  completed_at           TIMESTAMPTZ,
  actual_duration        INTEGER,
  completion_rating      TEXT,
  attempts               INTEGER DEFAULT 0,
  -- Google Calendar
  google_event_id        TEXT,
  adjusted_for_conflict  BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_settings`
```sql
CREATE TABLE user_settings (
  user_id                    UUID PRIMARY KEY REFERENCES users(id),
  onboarding_completed       BOOLEAN DEFAULT FALSE,
  email_notifications        BOOLEAN DEFAULT TRUE,
  telegram_notifications     BOOLEAN DEFAULT FALSE,
  in_app_notifications       BOOLEAN DEFAULT TRUE,
  daily_summary_time         TIME DEFAULT '08:00:00',
  google_access_token        TEXT,
  google_refresh_token       TEXT,
  google_token_expiry        TIMESTAMPTZ,
  google_calendar_enabled    BOOLEAN DEFAULT FALSE,
  google_calendar_last_sync  TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);
```

### `availability_slots`
```sql
CREATE TABLE availability_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  day_of_week INTEGER NOT NULL,  -- 0=Dom, 1=Lun, ..., 6=Sáb
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_enabled  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.4 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Patrón estándar:

```sql
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subjects"
  ON subjects
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Ver el detalle completo en las migrations.

---

## 6.5 Relaciones

```
auth.users
    ├── users (1:1, trigger crea al registrarse)
    │   ├── subjects (1:N)
    │   │   ├── exams (1:N)
    │   │   └── topics (1:N)
    │   │       └── sessions (1:N)
    │   ├── sessions (1:N, redundante para RLS)
    │   ├── user_settings (1:1)
    │   ├── availability_slots (1:N)
    │   ├── notifications (1:N)
    │   └── user_stats (1:1)
    └── user_achievements (1:N)
```
