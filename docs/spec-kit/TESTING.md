# Testing Guide - StudyApp

**Estado:** Activo  
**Cobertura:** Unit + Integration (Vitest) + E2E (Playwright)  
**Última actualización:** 2026-03-25

---

## 1. Resumen

| Tipo | Framework | Directorio | Comando |
|------|-----------|------------|---------|
| Unit | Vitest | `src/__tests__/unit/` | `pnpm test:unit` |
| Integration | Vitest | `src/__tests__/integration/` | `pnpm test:unit` |
| E2E | Playwright | `e2e/` | `pnpm test:e2e` |

---

## 2. Comandos

```bash
# Unit + Integration
pnpm test             # Modo watch (desarrollo)
pnpm test:unit        # Single run (CI)
pnpm test:watch       # Watch explícito
pnpm test:coverage    # Con reporte de cobertura

# E2E
pnpm test:e2e           # Todos los browsers
pnpm test:e2e:ui        # Con UI interactiva de Playwright
pnpm test:e2e:chromium  # Solo Chrome
pnpm test:e2e:webkit    # Solo Safari

# Todo junto
pnpm test:all         # Unit + E2E en secuencia
```

**Prerequisitos para E2E:**

```bash
# Primera vez: instalar browsers de Playwright
pnpm exec playwright install

# Tener el servidor corriendo (el config reutiliza el existente)
pnpm dev
```

---

## 3. Estructura de archivos

```
StudyApp/
├── src/__tests__/
│   ├── setup.ts                                   # Mocks globales (Supabase, Next.js)
│   ├── unit/
│   │   └── services/
│   │       ├── priority-calculator.test.ts        # UC-006: cálculo de prioridades
│   │       └── session-generator.test.ts          # UC-006: generación de sesiones
│   └── integration/
│       └── topic-session-flow.test.ts             # Flujo completo topic → sesiones
│
├── e2e/
│   ├── global-setup.ts           # Crea usuario de test antes de todos los tests
│   ├── fixtures/
│   │   ├── auth.fixture.ts       # Fixture authenticatedPage (login automático)
│   │   └── test-helpers.ts       # Helpers reutilizables
│   ├── auth.spec.ts              # UC-001/002: Login y registro
│   └── study-flow.spec.ts        # UC-003 a UC-007: flujo completo
│
├── vitest.config.ts              # Configuración de Vitest
└── playwright.config.ts          # Configuración de Playwright
```

---

## 4. Tests unitarios e integración (Vitest)

### 4.1 Configuración (`vitest.config.ts`)

```ts
{
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/__tests__/setup.ts'],
  include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
  exclude: ['node_modules', 'dist', '.next'],
  testTimeout: 10000,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'json'],
    include: ['src/lib/**/*.ts'],
    exclude: ['src/lib/supabase/**', '**/*.d.ts'],
    thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
  },
}
```

### 4.2 Setup global (`src/__tests__/setup.ts`)

Se ejecuta antes de cada archivo de test. Configura:

- `@testing-library/jest-dom` — matchers adicionales para DOM
- `beforeEach` / `afterEach` globales — llaman a `vi.clearAllMocks()` y `vi.restoreAllMocks()`
- Mock de `@/lib/supabase/server` — `createClient()` devuelve un cliente falso con métodos chainables (`from`, `select`, `insert`, `eq`, `single`, etc.)
- Mock de `next/cache` — evita errores de `revalidatePath`
- `console.error` y `console.warn` silenciados durante los tests, restaurados en `afterEach`

```ts
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@test.com' } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}));
```

---

### 4.3 `priority-calculator.test.ts` — UC-006

Testea `calculatePriority()` y `daysBetween()` en `src/lib/services/priority-calculator.ts`.

Sin mocks externos — es lógica pura matemática.

| Grupo | Qué verifica |
|-------|-------------|
| `daysBetween` | Diferencia positiva, negativa, mismo día, entre meses |
| `Urgency Score` | Puntuación 0-40 según días hasta el examen |
| `Difficulty Score` | EASY=10, MEDIUM=20, HARD=30 |
| `Session Number Score` | R1=20, R2=18, R3=15, R4=12 |
| `Proximity Score` | Hoy=12, mañana=10, esta semana=5, lejano=2 |
| `isFinal Bonus` | Urgencia mínima 30 para exámenes finales |
| `Classification Thresholds` | CRITICAL≥85, URGENT≥70, IMPORTANT≥50, NORMAL≥30, LOW<30 |
| `Real-world Scenarios` | Escenarios de uso real (final próximo, parcial lejano) |

```ts
it('should return CRITICAL for score >=85', () => {
  const result = calculatePriority({
    daysToExam: 3,      // urgency: 40
    difficulty: 'HARD', // difficulty: 30
    sessionNumber: 1,   // session: 20
    daysToSession: 0,   // proximity: 12
  });
  // 40 + 30 + 20 + 12 = 102 → CRITICAL
  expect(result).toBe('CRITICAL');
});
```

---

### 4.4 `session-generator.test.ts` — UC-006

Testea `generateSessionsForTopic()` en `src/lib/services/session-generator.ts`.

Mocks usados:
- `calculatePriority` → retorna `'NORMAL'` (aísla el algoritmo de prioridad)
- `getGoogleCalendarService` → simula sin conexión a Google Calendar

**Setup de fecha:** `vi.setSystemTime(new Date('2026-01-27'))` — fija la fecha para tests determinísticos.

| Grupo | Qué verifica |
|-------|-------------|
| `Input Validation` | Lanza error si `source_date` es null en modo PARCIAL |
| `Mode Detection` | PARCIAL para PARCIAL_* y RECUPERATORIO_*; FREE_STUDY para FINAL_* |
| `PARCIAL Mode` | 4 sesiones con intervalos [1,3,7,14] días desde `source_date` |
| `FREE_STUDY Mode` | 4 sesiones con intervalos [1,3,7,14] días desde HOY |
| `Difficulty Multipliers` | EASY×0.7, MEDIUM×1.0, HARD×1.3 sobre horas base |
| `Duration Factors` | R1×0.60, R2×0.35, R3×0.30, R4×0.25, mínimo 15min |
| `Session Properties` | user_id, subject_id, topic_id, exam_id, status=PENDING, attempts=0 |
| `Priority Calculation` | `calculatePriority` recibe los parámetros correctos (isFinal, difficulty, etc.) |

```ts
it('should apply HARD multiplier (1.3) to duration', async () => {
  const topic = { ...baseTopic, difficulty: 'HARD', hours: 100 };
  const sessions = await generateSessionsForTopic(topic, parcialExam, 'user-1');
  // R1: 100 * 1.3 * 0.60 = 78 min
  expect(sessions[0].duration).toBe(78);
});
```

> Nota: los `describe` internos del test usan el nombre "COUNTDOWN mode" para finales — es un nombre histórico; en el código el modo se llama `FREE_STUDY`.

---

### 4.5 `topic-session-flow.test.ts` — Integration

Testea el server action `generateSessions()` en `src/lib/actions/sessions.ts`.

Mocks usados:
- Supabase client completo (mock manual diferenciado por tabla)
- `generateSessionsForTopic` → retorna 2 sesiones de prueba

| Caso | Escenario |
|------|-----------|
| Happy path | Fetcha topic + exam → genera sesiones → inserta en DB |
| Topic no encontrado | Retorna error, no llama al generator |
| `source_date` null para CLASS | Retorna error mencionando `source_date` |
| Sin examen (`exam_id: null`) | Llama al generator con `exam=null`, éxito |

Patrón para mockear Supabase por tabla en tests de integración:

```ts
mockSupabaseClient.from.mockImplementation((table: string) => {
  if (table === 'topics')   return { select: vi.fn().mockReturnValue(topicSelectChain) };
  if (table === 'exams')    return { select: vi.fn().mockReturnValue(examSelectChain) };
  if (table === 'sessions') return insertChain;
  return {};
});
```

---

## 5. Tests E2E (Playwright)

### 5.1 Configuración (`playwright.config.ts`)

```ts
{
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
}
// playwright.config.ts carga .env.local via dotenv antes del defineConfig
```

### 5.2 Global Setup (`e2e/global-setup.ts`)

Se ejecuta una sola vez antes de cualquier test. Garantiza que exista el usuario de test:

1. **Intento 1 — Admin API:** usa `SUPABASE_SERVICE_ROLE_KEY` para crear el usuario con email confirmado automáticamente
2. **Intento 2 — SignIn:** si el usuario ya existe, verifica que puede loguearse
3. **Intento 3 — SignUp:** crea el usuario con signup normal (requiere confirmaciones de email desactivadas)

```
Usuario de test:
  email:    test@studyapp.com
  password: TestPassword123!
```

Para E2E contra Supabase Cloud: agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`. Para Supabase local: funciona automáticamente con la service role key pública de desarrollo.

### 5.3 Fixture `authenticatedPage`

Extiende el `test` base de Playwright. Antes de cada test autenticado: navega a `/login`, llena credenciales y espera redirect al dashboard.

```ts
import { test, expect } from './fixtures/auth.fixture';

test('mi test autenticado', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard');
  // ya está logueado como test@studyapp.com
});
```

### 5.4 `auth.spec.ts` — UC-001 & UC-002

Tests sin autenticación previa.

| Test | Verifica |
|------|----------|
| Registro muestra formulario | `#name`, `#email`, `#password`, submit visible |
| Formulario vacío no navega | URL permanece en `/register` |
| Link a login visible | `a[href="/login"]` |
| Login muestra formulario | `#email`, `#password`, submit visible |
| Credenciales inválidas muestran error | `.bg-red-50` visible |
| Link a registro visible | `a[href="/register"]` |
| Dashboard sin sesión redirige a login | URL termina en `/login` |

### 5.5 `study-flow.spec.ts` — UC-003 a UC-007

Tests autenticados. Requieren al menos una materia existente en la DB de test.

| UC | Tests |
|----|-------|
| UC-003 Create Subject | Crear materia, navegar al detalle, eliminar materia |
| UC-004 Create Exam | Crear parcial (PARCIAL_THEORY), crear final (FINAL_THEORY) |
| UC-005 Create Topic | Crear tema con dificultad EASY, MEDIUM y HARD |
| UC-006 Session Generation | Verificar que sesiones se generan al crear topic |
| UC-007 View Dashboard | Stats cards, sección materias, navegación, branding, email de usuario |

---

## 6. Cobertura

Medida con V8 (Vitest) sobre `src/lib/**/*.ts`:

| Métrica | Umbral mínimo |
|---------|--------------|
| Lines | 70% |
| Functions | 70% |
| Branches | 60% |
| Statements | 70% |

```bash
pnpm test:coverage
# Reporte en terminal
# Reporte HTML detallado:
open coverage/index.html      # macOS
xdg-open coverage/index.html  # Linux
```

---

## 7. Cómo escribir nuevos tests

### 7.1 Test unitario

```ts
// src/__tests__/unit/services/mi-servicio.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks ANTES del import del módulo a testear
vi.mock('@/lib/services/dependencia', () => ({
  miFuncion: vi.fn(() => 'valor-mockeado'),
}));

import { miFuncionATestear } from '@/lib/services/mi-servicio';

describe('UC-XXX: Mi Servicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-01-27')); // si usás fechas
  });

  it('should hacer algo esperado', () => {
    const result = miFuncionATestear({ param: 'valor' });
    expect(result).toBe('esperado');
  });
});
```

### 7.2 Test de integración de un server action

```ts
// src/__tests__/integration/mi-accion.test.ts
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  })),
}));

import { miAccion } from '@/lib/actions/mi-modulo';

describe('Integration: Mi Acción', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'mi_tabla') {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
        };
      }
      return {};
    });
  });

  it('should retornar success en happy path', async () => {
    const result = await miAccion('param');
    expect(result.success).toBe(true);
  });
});
```

### 7.3 Test E2E

```ts
// e2e/mi-feature.spec.ts
import { test, expect } from './fixtures/auth.fixture'; // con auth
// import { test, expect } from '@playwright/test';     // sin auth

test.describe('UC-XXX: Mi Feature', () => {
  test('should hacer algo en el browser', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/mi-ruta');
    await page.waitForLoadState('networkidle');

    await page.click('text=Mi Botón');
    await page.waitForSelector('input[name="campo"]', { timeout: 10000 });
    await page.fill('input[name="campo"]', 'valor');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Resultado esperado')).toBeVisible({ timeout: 10000 });
  });
});
```

---

## 8. Convenciones

- **Nomenclatura:** `describe('UC-XXX: Nombre del Use Case')` para trazar tests a requerimientos
- **Fechas determinísticas:** siempre usar `vi.setSystemTime()` en tests con lógica de fechas
- **Orden de mocks:** declarar `vi.mock()` antes del `import` del módulo a testear
- **Selectores E2E:** preferir `data-testid`, luego `name` en inputs, luego texto visible
- **Timeouts E2E:** siempre `{ timeout: 10000 }` en `waitFor*` y `toBeVisible`
- **Aislamiento:** cada test debe poder correr en cualquier orden sin depender de estado previo

---

## 9. Troubleshooting

**"Cannot find module '@/lib/...'" en Vitest**
El alias `@` está configurado en `vitest.config.ts`. Verificar que el import use `@/` y no rutas relativas.

**"Test user can't login" en E2E**
El `global-setup.ts` no pudo crear el usuario. Soluciones:
- Agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env.local` (obtener de Supabase Dashboard → Settings → API)
- Desactivar "Email confirmations" en Supabase Dashboard → Authentication → Settings

**"Server is not running" en E2E**
Correr `pnpm dev` antes de `pnpm test:e2e`. El config usa `reuseExistingServer: true`.

**Cobertura por debajo del umbral**
Abrir `coverage/index.html` para identificar funciones no cubiertas por archivo.
