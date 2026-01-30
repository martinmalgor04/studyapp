# E2E Tests - StudyApp

Tests end-to-end usando Playwright para Chrome y Safari.

## ⚠️ Requisitos Previos

**IMPORTANTE**: Antes de correr los tests E2E, debes tener:

1. **Supabase corriendo localmente**:
   ```bash
   pnpm supabase:start
   ```

2. **Next.js dev server corriendo**:
   ```bash
   pnpm dev
   ```

3. **Usuario de test creado** con credenciales:
   - Email: `test@studyapp.com`
   - Password: `TestPassword123!`
   - Name: `Test User`

## Correr Tests

```bash
# Todos los tests (Chrome + Safari)
pnpm test:e2e

# Solo Chrome
pnpm test:e2e:chromium

# Solo Safari
pnpm test:e2e:webkit

# UI Mode (interactivo - recomendado para desarrollo)
pnpm test:e2e:ui
```

## Estructura

```
e2e/
├── auth.spec.ts              # Tests de autenticación (UC-001, UC-002)
├── study-flow.spec.ts        # Tests de flujos de estudio (UC-003 a UC-007)
└── fixtures/
    ├── auth.fixture.ts       # Fixture para tests autenticados
    └── test-helpers.ts       # Helpers generales
```

## Tests por Use Case

| Archivo | Use Cases | Tests |
|---------|-----------|-------|
| `auth.spec.ts` | UC-001 (Register), UC-002 (Login) | 7 tests |
| `study-flow.spec.ts` | UC-003 (Subjects), UC-004 (Exams), UC-005 (Topics), UC-007 (Dashboard) | ~15 tests |

## Crear Usuario de Test

### Opción 1: Via UI (Recomendado)

1. Asegurar que Supabase y Next.js estén corriendo
2. Ir a `http://localhost:3000/register`
3. Crear cuenta con credenciales arriba

### Opción 2: SQL Directo

```sql
-- En Supabase Studio (http://127.0.0.1:54323)
-- SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@studyapp.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Test User"}'::jsonb
);
```

## Troubleshooting

### Páginas en blanco

**Causa**: Supabase no está corriendo.

**Solución**:
```bash
pnpm supabase:status  # Verificar
pnpm supabase:start   # Iniciar si está parado
```

### Tests timeout

**Aumentar timeouts en `playwright.config.ts`**:
```typescript
use: {
  actionTimeout: 15000,
  navigationTimeout: 45000,
}
```

### Usuario no existe

Crear usuario manualmente (ver arriba).

## Escribir Nuevos Tests

### Test sin autenticación

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/some-page');
  // ...
});
```

### Test con autenticación

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('my authenticated test', async ({ authenticatedPage: page }) => {
  // Ya está logueado automáticamente
  await page.goto('/dashboard');
  // ...
});
```

## Mejores Prácticas

1. **Siempre usar `waitForLoadState('networkidle')`** después de `goto()`
2. **Usar `data-testid`** para selectores robustos
3. **Nombres únicos con timestamp** para evitar colisiones:
   ```typescript
   const name = `Test Item ${Date.now()}`;
   ```
4. **Esperar elementos antes de interactuar**:
   ```typescript
   await page.waitForSelector('#email', { timeout: 10000 });
   ```

## Ver Resultados

Después de correr tests:

```bash
# Ver reporte HTML
pnpm exec playwright show-report
```

Los screenshots de fallos se guardan en `test-results/`.
