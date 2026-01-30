# 7. API Specification

## 7.1 API Overview

StudyApp uses **Next.js Server Actions** for data mutations and queries instead of traditional REST APIs. Server Actions provide:

- ✅ Type-safe communication between client and server
- ✅ Automatic serialization/deserialization
- ✅ Built-in CSRF protection
- ✅ Progressive enhancement support
- ✅ No need for explicit API routes for most operations

### When to use Server Actions vs API Routes

| Use Case | Approach | Reason |
|----------|----------|--------|
| CRUD operations | Server Actions | Type-safe, less boilerplate |
| Form submissions | Server Actions | Progressive enhancement |
| Webhooks (external) | API Routes | Need public HTTP endpoint |
| Third-party integrations | API Routes | May require specific HTTP methods/headers |
| Real-time updates | Supabase Realtime | Native database subscriptions |

### Authentication

All Server Actions automatically have access to the authenticated user session via Supabase cookies. No need to pass tokens manually.

```typescript
// Server Action automatically has access to user
export async function createSubject(input: CreateSubjectInput) {
  'use server';
  
  const supabase = await createClient(); // Server client with cookies
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'No autenticado' };
  }
  
  // User is authenticated, proceed...
}
```

---

## 7.2 Response Format

### Success Response
```typescript
{
  data: T  // The requested data
}
```

### Error Response
```typescript
{
  error: string  // Human-readable error message
}
```

---

## 7.3 Authentication Actions

Location: `src/lib/supabase/` (uses Supabase Auth directly)

### Register

```typescript
// src/components/features/auth/register-form.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { error, data } = await supabase.auth.signUp({
  email: 'student@email.com',
  password: 'SecurePass123!',
  options: {
    data: {
      name: 'Juan Pérez',
    },
  },
});

// Response on success:
{
  user: {
    id: "uuid",
    email: "student@email.com",
    user_metadata: {
      name: "Juan Pérez"
    },
    created_at: "2026-01-27T10:00:00Z"
  },
  session: {
    access_token: "jwt...",
    refresh_token: "jwt...",
    expires_in: 3600
  }
}

// Response on error:
{
  error: {
    message: "User already registered",
    status: 400
  }
}
```

### Login

```typescript
// src/components/features/auth/login-form.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { error, data } = await supabase.auth.signInWithPassword({
  email: 'student@email.com',
  password: 'SecurePass123!',
});

// Response: Same as register
```

### Logout

```typescript
const supabase = createClient();
await supabase.auth.signOut();
// Redirects to /login
```

### Get Current User

```typescript
// Server Component or Server Action
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Response:
{
  user: {
    id: "uuid",
    email: "student@email.com",
    user_metadata: { name: "Juan Pérez" }
  }
}
```

---

## 7.4 Subject Actions

Location: `src/lib/actions/subjects.ts`

### Create Subject

```typescript
'use server';

import { createSubject } from '@/lib/actions/subjects';
import { CreateSubjectInput } from '@/lib/validations/subjects';

const input: CreateSubjectInput = {
  name: 'Probabilidad y Estadística',
  description: 'Materia del 2do año',
};

const result = await createSubject(input);

// Success response:
{
  data: {
    id: "uuid",
    user_id: "user-uuid",
    name: "Probabilidad y Estadística",
    description: "Materia del 2do año",
    is_active: true,
    created_at: "2026-01-27T10:00:00Z",
    updated_at: "2026-01-27T10:00:00Z"
  }
}

// Error response:
{
  error: "El nombre es requerido"
}
// or
{
  error: "No autenticado"
}
```

**Validation Schema (Zod):**

```typescript
// src/lib/validations/subjects.ts
import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
});
```

### Get All Subjects

```typescript
'use server';

import { getSubjects } from '@/lib/actions/subjects';

const subjects = await getSubjects();

// Response:
[
  {
    id: "uuid-1",
    user_id: "user-uuid",
    name: "Probabilidad y Estadística",
    description: "Materia del 2do año",
    is_active: true,
    created_at: "2026-01-27T10:00:00Z",
    updated_at: "2026-01-27T10:00:00Z"
  },
  {
    id: "uuid-2",
    name: "Análisis Matemático",
    // ...
  }
]
```

### Get Subject by ID

```typescript
'use server';

import { getSubject } from '@/lib/actions/subjects';

const result = await getSubject('uuid-1');

// Success:
{
  data: {
    id: "uuid-1",
    name: "Probabilidad y Estadística",
    // ...
  }
}

// Error (not found):
{
  error: "Materia no encontrada"
}
```

### Update Subject

```typescript
'use server';

import { updateSubject, UpdateSubjectInput } from '@/lib/actions/subjects';

const input: UpdateSubjectInput = {
  name: 'Probabilidad y Estadística II',
  description: 'Actualizada',
};

const result = await updateSubject('uuid-1', input);

// Success:
{
  data: {
    id: "uuid-1",
    name: "Probabilidad y Estadística II",
    description: "Actualizada",
    updated_at: "2026-01-27T11:00:00Z"
  }
}
```

### Delete Subject (Soft Delete)

```typescript
'use server';

import { deleteSubject } from '@/lib/actions/subjects';

const result = await deleteSubject('uuid-1');

// Success:
{
  data: {
    id: "uuid-1",
    is_active: false,  // Soft deleted
    updated_at: "2026-01-27T11:00:00Z"
  }
}
```

---

## 7.5 Exam Actions

Location: `src/lib/actions/exams.ts` (To be implemented)

### Create Exam

```typescript
'use server';

import { createExam, CreateExamInput } from '@/lib/actions/exams';

const input: CreateExamInput = {
  subject_id: 'subject-uuid',
  type: 'parcial_theory',
  exam_number: 1,
  exam_date: '2026-03-15',
  description: 'Primer parcial teórico',
};

const result = await createExam(input);

// Success:
{
  data: {
    id: "uuid",
    subject_id: "subject-uuid",
    type: "parcial_theory",
    exam_number: 1,
    exam_date: "2026-03-15T00:00:00Z",
    description: "Primer parcial teórico",
    created_at: "2026-01-27T10:00:00Z"
  }
}
```

**Exam Types:**
- `parcial_theory`: Parcial teórico
- `parcial_practice`: Parcial práctico
- `recuperatorio`: Recuperatorio
- `final`: Final

### Get Exams by Subject

```typescript
'use server';

import { getExamsBySubject } from '@/lib/actions/exams';

const exams = await getExamsBySubject('subject-uuid');

// Response:
[
  {
    id: "uuid-1",
    subject_id: "subject-uuid",
    type: "parcial_theory",
    exam_number: 1,
    exam_date: "2026-03-15T00:00:00Z",
    // ...
  },
  // ...
]
```

---

## 7.6 Topic Actions

Location: `src/lib/actions/topics.ts` (To be implemented)

### Create Topic

```typescript
'use server';

import { createTopic, CreateTopicInput } from '@/lib/actions/topics';

const input: CreateTopicInput = {
  subject_id: 'subject-uuid',
  exam_id: 'exam-uuid',  // Optional
  name: 'Distribuciones de Probabilidad',
  difficulty: 'medium',
  hours_estimated: 120,  // minutes
  source: 'class',
  class_date: '2026-01-20',
  description: 'Distribución normal, binomial, Poisson',
};

const result = await createTopic(input);

// Success:
{
  data: {
    id: "uuid",
    subject_id: "subject-uuid",
    exam_id: "exam-uuid",
    name: "Distribuciones de Probabilidad",
    difficulty: "medium",
    hours_estimated: 120,
    source: "class",
    class_date: "2026-01-20T00:00:00Z",
    description: "Distribución normal, binomial, Poisson",
    created_at: "2026-01-27T10:00:00Z"
  }
}
```

**Difficulty Levels:**
- `easy`: Fácil (4 repasos)
- `medium`: Medio (5 repasos)
- `hard`: Difícil (6 repasos)

**Source Types:**
- `class`: Desde una clase dictada
- `free_study`: Estudio libre (para finales)
- `program`: Cargado desde programa

---

## 7.7 Session Actions

Location: `src/lib/actions/sessions.ts` (To be implemented)

### Generate Sessions (Automatic on Topic Creation)

```typescript
// This happens automatically via a service when a Topic is created
// src/lib/services/session-generator.service.ts

// For a "medium" difficulty topic, generates 5 sessions:
[
  {
    topic_id: "topic-uuid",
    session_number: 1,
    scheduled_date: "2026-01-21T16:00:00Z",  // +1 day
    duration_minutes: 72,  // 60% of original
    priority: "URGENTE",
    status: "pending"
  },
  {
    session_number: 2,
    scheduled_date: "2026-01-23T16:00:00Z",  // +3 days
    duration_minutes: 42,  // 35% of original
    // ...
  },
  // ... 3 more sessions
]
```

### Get Sessions for Today

```typescript
'use server';

import { getTodaySessions } from '@/lib/actions/sessions';

const sessions = await getTodaySessions();

// Response:
[
  {
    id: "uuid",
    topic_id: "topic-uuid",
    topic: {
      name: "Distribuciones de Probabilidad",
      subject: {
        name: "Probabilidad y Estadística"
      }
    },
    session_number: 1,
    scheduled_date: "2026-01-27T16:00:00Z",
    duration_minutes: 72,
    priority: "URGENTE",
    status: "pending"
  },
  // ...
]
```

### Mark Session as Completed

```typescript
'use server';

import { completeSession } from '@/lib/actions/sessions';

const result = await completeSession('session-uuid', {
  completed: true,
});

// Success:
{
  data: {
    id: "session-uuid",
    status: "completed",
    completed_at: "2026-01-27T17:00:00Z"
  }
}
```

### Reschedule Session

```typescript
'use server';

import { rescheduleSession } from '@/lib/actions/sessions';

const result = await rescheduleSession('session-uuid', {
  new_date: '2026-01-28T15:00:00Z',
});

// Success:
{
  data: {
    id: "session-uuid",
    scheduled_date: "2026-01-28T15:00:00Z",
    status: "rescheduled",
    attempt_number: 2
  }
}
```

---

## 7.8 Stats & Gamification Actions

Location: `src/lib/actions/stats.ts` (To be implemented)

### Get User Stats

```typescript
'use server';

import { getUserStats } from '@/lib/actions/stats';

const stats = await getUserStats();

// Response:
{
  current_streak: 5,
  longest_streak: 12,
  total_points: 350,
  level: 3,
  sessions_completed: 45,
  sessions_failed: 8,
  completion_rate: 0.85,
  study_time_minutes: 2400
}
```

### Get Achievements

```typescript
'use server';

import { getUserAchievements } from '@/lib/actions/achievements';

const achievements = await getUserAchievements();

// Response:
[
  {
    id: "uuid",
    achievement_id: "achievement-uuid",
    achievement: {
      name: "First Steps",
      description: "Complete your first study session",
      icon: "🎯",
      points: 10
    },
    unlocked_at: "2026-01-20T10:00:00Z"
  },
  // ...
]
```

---

## 7.9 Error Handling

All Server Actions follow a consistent error handling pattern:

```typescript
type ActionResult<T> = 
  | { data: T; error?: never }
  | { data?: never; error: string };
```

**Common Errors:**

| Error Message | Cause | HTTP Equivalent |
|---------------|-------|-----------------|
| "No autenticado" | User not logged in | 401 Unauthorized |
| "No autorizado" | User doesn't own resource | 403 Forbidden |
| "[Field] es requerido" | Validation failed | 400 Bad Request |
| "[Resource] no encontrada" | Resource doesn't exist | 404 Not Found |
| "Error al [action]" | Database/server error | 500 Internal Server Error |

---

## 7.10 Usage Example: Full CRUD Flow

```typescript
// src/app/(dashboard)/dashboard/subjects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/lib/actions/subjects';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);

  // Load subjects
  useEffect(() => {
    async function load() {
      const data = await getSubjects();
      setSubjects(data);
    }
    load();
  }, []);

  // Create
  async function handleCreate(data) {
    const result = await createSubject(data);
    if (result.error) {
      alert(result.error);
    } else {
      setSubjects([...subjects, result.data]);
    }
  }

  // Update
  async function handleUpdate(id, data) {
    const result = await updateSubject(id, data);
    if (result.error) {
      alert(result.error);
    } else {
      setSubjects(subjects.map(s => s.id === id ? result.data : s));
    }
  }

  // Delete
  async function handleDelete(id) {
    const result = await deleteSubject(id);
    if (result.error) {
      alert(result.error);
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  }

  return (/* UI */);
}
```

---

## 7.11 Direct Supabase Queries (Alternative)

For read operations in Server Components, you can also query Supabase directly:

```typescript
// src/app/(dashboard)/dashboard/subjects/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function SubjectsPage() {
  const supabase = await createClient();
  
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div>
      {subjects.map(subject => (
        <div key={subject.id}>{subject.name}</div>
      ))}
    </div>
  );
}
```

**When to use direct queries vs Server Actions:**

| Use Case | Approach | Reason |
|----------|----------|--------|
| Simple read in Server Component | Direct query | Fewer files, clearer code |
| Complex business logic | Server Action | Encapsulation, reusability |
| Mutations (write/update/delete) | Server Action | Validation, error handling, revalidation |
| Client Component needs | Server Action | Can be called from client |

---

## 7.12 API Routes (for external integrations)

Location: `src/app/api/` (only when needed)

### Webhook Example (Future: Telegram Bot)

```typescript
// src/app/api/webhooks/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Verify Telegram signature
  // Process webhook
  // Call Server Actions internally
  
  return NextResponse.json({ ok: true });
}
```

### Google Calendar Callback (Future)

```typescript
// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  // Exchange code for tokens
  // Store in database
  // Redirect to dashboard
  
  return NextResponse.redirect('/dashboard');
}
```

---

## 7.13 Type Safety

All Server Actions are fully type-safe:

```typescript
// Client knows exact types
import { createSubject } from '@/lib/actions/subjects';
import type { CreateSubjectInput } from '@/lib/validations/subjects';

// TypeScript will error if input is invalid
const input: CreateSubjectInput = {
  name: 'Test',
  description: 'Test',
  invalidField: 'this will error',  // ❌ TypeScript error
};

const result = await createSubject(input);

// TypeScript knows result structure
if (result.error) {
  // result.error is string
  console.log(result.error);
} else {
  // result.data is Subject
  console.log(result.data.name);
}
```

---

## 7.14 Comparison: REST API vs Server Actions

### Traditional REST API (what we're NOT doing)

```typescript
// ❌ Old way: Fetch to API endpoint
const response = await fetch('/api/subjects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ name: 'Test' }),
});

const data = await response.json();
```

**Problems:**
- Manual serialization/deserialization
- Manual error handling
- No type safety across HTTP boundary
- Need to manage tokens manually
- More boilerplate

### Server Actions (what we're using)

```typescript
// ✅ New way: Direct function call
import { createSubject } from '@/lib/actions/subjects';

const result = await createSubject({ name: 'Test' });
```

**Benefits:**
- Type-safe end-to-end
- Automatic serialization
- Built-in authentication
- Less code
- Better DX

---

## Summary

StudyApp uses **Next.js Server Actions** as the primary API layer, providing:

- ✅ Full type safety from client to database
- ✅ Automatic CSRF protection
- ✅ Built-in authentication via Supabase cookies
- ✅ Consistent error handling
- ✅ Less boilerplate than REST APIs
- ✅ Can still use API Routes when needed (webhooks, OAuth callbacks)

All actions follow the pattern:
```typescript
type ActionResult<T> = { data: T } | { error: string };
```
