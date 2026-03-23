# E2E Testing Specification - UC-008 & UC-009

**Prioridad:** Media (Technical Debt)  
**Estado:** Parcial (solo hasta UC-007)  
**Estimación:** 8-10 horas (setup + tests)

---

## 1. Objetivo

Extender la suite de tests E2E con Playwright para cubrir:
- **UC-008:** Track Session Completion (completar sesión con rating)
- **UC-009:** Reschedule Session (reagendar con intentos y auto-abandon)

Actualmente tenemos E2E hasta UC-007 (Dashboard). Necesitamos agregar los flujos de gestión de sesiones.

---

## 2. Stack de Testing Actual

```
Testing Stack:
├── Vitest (unit/integration)
│   └── 64 tests (session-generator, priority-calculator)
└── Playwright (E2E)
    └── 20 tests (auth + study flow hasta UC-007)
```

**Gaps identificados:**
- ❌ No hay E2E para completar sesión
- ❌ No hay E2E para reagendar sesión
- ❌ No hay E2E para flujo de study mode (pomodoro)
- ❌ No hay ambiente de testing aislado

---

## 3. Ambiente de Testing

### 3.1 Opciones de Setup

#### Opción A: Supabase Local (Recomendada)

**Pros:**
- Gratis, completamente aislado
- Reset completo entre tests
- Mismo comportamiento que prod

**Cons:**
- Requiere Docker corriendo
- Setup inicial más complejo

#### Opción B: Supabase Project de Testing

**Pros:**
- No requiere Docker local
- Más rápido de configurar

**Cons:**
- Requiere limpiar DB entre tests
- Posible conflicto si tests corren en paralelo

**Decisión:** Usar **Opción A** (Supabase Local) con script de setup automatizado.

### 3.2 Setup de Ambiente de Testing

**Archivo:** `e2e/setup/test-environment.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setupTestEnvironment() {
  console.log('Setting up test environment...');

  // 1. Start Supabase local
  console.log('Starting Supabase...');
  await execAsync('pnpm supabase:start');

  // 2. Reset database
  console.log('Resetting database...');
  await execAsync('pnpm supabase:reset');

  // 3. Seed test data
  console.log('Seeding test data...');
  await seedTestData();

  console.log('Test environment ready!');
}

export async function teardownTestEnvironment() {
  console.log('Tearing down test environment...');
  // Opcional: detener Supabase si querés
  // await execAsync('pnpm supabase:stop');
}

async function seedTestData() {
  // Crear usuario de test, materias, exámenes, temas, sesiones
  // Ver sección 3.3
}
```

### 3.3 Test Data Seeding

**Archivo:** `e2e/fixtures/seed-data.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const TEST_USER = {
  email: 'test-sessions@studyapp.com',
  password: 'Test123!SessionFlow',
  name: 'Test User Sessions',
};

export async function seedSessionTestData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Bypass RLS
  );

  // 1. Crear usuario
  const { data: authData } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
  });

  if (!authData.user) throw new Error('Failed to create test user');
  const userId = authData.user.id;

  // 2. Crear materia
  const { data: subject } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: 'Cálculo I - Test',
      description: 'Materia para testing de sesiones',
    })
    .select()
    .single();

  // 3. Crear examen (Parcial 1)
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 14); // En 2 semanas

  const { data: exam } = await supabase
    .from('exams')
    .insert({
      subject_id: subject!.id,
      type: 'PARCIAL_THEORY',
      number: 1,
      date: examDate.toISOString(),
    })
    .select()
    .single();

  // 4. Crear topic con sesiones
  const sourceDate = new Date();
  sourceDate.setDate(sourceDate.getDate() - 2); // Hace 2 días

  const { data: topic } = await supabase
    .from('topics')
    .insert({
      subject_id: subject!.id,
      exam_id: exam!.id,
      name: 'Límites - Test',
      difficulty: 'MEDIUM',
      hours: 60,
      source: 'CLASS',
      source_date: sourceDate.toISOString(),
    })
    .select()
    .single();

  // 5. Las sesiones se generan automáticamente por trigger
  // Pero podemos crearlas manualmente si trigger no está activo en test

  return {
    user: { id: userId, email: TEST_USER.email, password: TEST_USER.password },
    subject: subject!,
    exam: exam!,
    topic: topic!,
  };
}
```

---

## 4. Tests para UC-008: Track Session Completion

### 4.1 Archivo: `e2e/session-completion.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';
import { seedSessionTestData } from './fixtures/seed-data';

test.describe('UC-008: Track Session Completion', () => {
  test.beforeAll(async () => {
    // Seed data una vez para todos los tests
    await seedSessionTestData();
  });

  test('should complete session with EASY rating', async ({ authenticatedPage: page }) => {
    // 1. Navegar a sesiones
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    // 2. Encontrar sesión PENDING
    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await expect(pendingSession).toBeVisible();

    // 3. Click en "Completar"
    await pendingSession.locator('button:has-text("Completar")').click();

    // 4. Esperar diálogo de rating
    await expect(page.locator('text=¿Cómo te fue con este tema?')).toBeVisible();

    // 5. Seleccionar "Fácil"
    await page.locator('button:has-text("Fácil")').click();

    // 6. Verificar que la sesión cambió a COMPLETED
    await expect(page.locator('text=Completada')).toBeVisible({ timeout: 5000 });

    // 7. Verificar que desapareció de pendientes
    await page.goto('/dashboard/sessions');
    const completedSessions = await page.locator('[data-status="COMPLETED"]').count();
    expect(completedSessions).toBeGreaterThan(0);
  });

  test('should complete session with HARD rating', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await pendingSession.locator('button:has-text("Completar")').click();

    await expect(page.locator('text=¿Cómo te fue con este tema?')).toBeVisible();
    await page.locator('button:has-text("Difícil")').click();

    await expect(page.locator('text=Completada')).toBeVisible({ timeout: 5000 });
  });

  test('should show completed sessions in calendar', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que el calendario muestra sesiones completadas
    const completedBadge = page.locator('text=✅ Completada');
    await expect(completedBadge.first()).toBeVisible();
  });

  test('should mark completed session as incomplete', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    // Encontrar sesión completada
    const completedSession = page.locator('[data-status="COMPLETED"]').first();
    await expect(completedSession).toBeVisible();

    // Click en "Marcar Incompleta"
    await completedSession.locator('button:has-text("Marcar Incompleta")').click();

    // Verificar que volvió a PENDING
    await expect(page.locator('text=Pendiente')).toBeVisible({ timeout: 5000 });
  });

  test('should show completion stats in dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar stats de completadas
    const statsCard = page.locator('text=Completadas').locator('..');
    await expect(statsCard).toBeVisible();

    // Debería tener al menos 1 completada
    const count = await statsCard.locator('text=/\\d+/').textContent();
    expect(parseInt(count || '0')).toBeGreaterThan(0);
  });
});
```

---

## 5. Tests para UC-009: Reschedule Session

### 5.1 Archivo: `e2e/session-reschedule.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('UC-009: Reschedule Session', () => {
  test('should reschedule session to tomorrow', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    // 1. Encontrar sesión pendiente
    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await expect(pendingSession).toBeVisible();

    // Guardar nombre del topic para verificar después
    const topicName = await pendingSession.locator('[data-testid="topic-name"]').textContent();

    // 2. Click en "Reagendar"
    await pendingSession.locator('button:has-text("Reagendar")').click();

    // 3. Esperar diálogo de reagendar
    await expect(page.locator('text=Reagendar sesión')).toBeVisible();

    // 4. Seleccionar "Mañana a las 9:00"
    await page.locator('button:has-text("Mañana")').click();

    // 5. Verificar que se reagendó
    await expect(page.locator('text=Reagendada')).toBeVisible({ timeout: 5000 });

    // 6. Verificar que incrementó attempts
    // (En UI podríamos mostrar "Intento 1/3")
  });

  test('should reschedule to custom date', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await pendingSession.locator('button:has-text("Reagendar")').click();

    await expect(page.locator('text=Reagendar sesión')).toBeVisible();

    // Switch a modo custom
    await page.locator('button:has-text("Fecha personalizada")').click();

    // Seleccionar fecha (próxima semana)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateString = nextWeek.toISOString().split('T')[0];

    await page.fill('input[type="datetime-local"]', `${dateString}T10:00`);
    await page.locator('button:has-text("Confirmar")').click();

    await expect(page.locator('text=Reagendada')).toBeVisible({ timeout: 5000 });
  });

  test('should auto-abandon session after 3 reschedules', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    const pendingSession = page.locator('[data-status="PENDING"]').first();

    // Reagendar 3 veces
    for (let i = 0; i < 3; i++) {
      await pendingSession.locator('button:has-text("Reagendar")').click();
      await page.locator('button:has-text("Mañana")').first().click();
      await page.waitForTimeout(1000);
    }

    // Intentar reagendar 4ta vez → debería auto-abandonar
    await pendingSession.locator('button:has-text("Reagendar")').click();
    await page.locator('button:has-text("Mañana")').first().click();

    // Verificar que se abandonó
    await expect(page.locator('text=Abandonada')).toBeVisible({ timeout: 5000 });
  });

  test('should show reschedule warning with attempts count', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await pendingSession.locator('button:has-text("Reagendar")').click();

    // Diálogo debería mostrar cuántos intentos lleva
    await expect(page.locator('text=/Intentos: \\d\/3/')).toBeVisible();
  });

  test('should send notification when rescheduled', async ({ authenticatedPage: page }) => {
    // Este test requiere verificar notificaciones in-app
    await page.goto('/dashboard/sessions');
    await page.waitForLoadState('networkidle');

    const pendingSession = page.locator('[data-status="PENDING"]').first();
    await pendingSession.locator('button:has-text("Reagendar")').click();
    await page.locator('button:has-text("Mañana")').click();

    // Verificar notificación (si está implementado)
    await page.goto('/dashboard');
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await expect(page.locator('text=/reagendada/')).toBeVisible();
    }
  });
});
```

---

## 6. Tests Adicionales (Bonus)

### 6.1 Study Mode Flow

```typescript
// e2e/study-mode.spec.ts
test.describe('Study Mode (Pomodoro)', () => {
  test('should start study mode and track time', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    const session = page.locator('[data-status="PENDING"]').first();
    
    await session.locator('button:has-text("Estudiar")').click();
    
    // Verificar que se abrió el diálogo de study mode
    await expect(page.locator('text=Modo Estudio')).toBeVisible();
    
    // Verificar timer (debería empezar en duración de sesión)
    await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
  });

  test('should complete session from study mode', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    const session = page.locator('[data-status="PENDING"]').first();
    
    await session.locator('button:has-text("Estudiar")').click();
    
    // Click en "Completar sesión"
    await page.locator('button:has-text("Completar sesión")').click();
    
    // Debería abrir diálogo de rating
    await expect(page.locator('text=¿Cómo te fue')).toBeVisible();
  });

  test('should mark incomplete with partial time', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/sessions');
    const session = page.locator('[data-status="PENDING"]').first();
    
    await session.locator('button:has-text("Estudiar")').click();
    
    // Click en "Marcar incompleta"
    await page.locator('button:has-text("Marcar incompleta")').click();
    
    // Debería cerrar y ofrecer reagendar tiempo restante
    // (si confirm() acepta)
  });
});
```

---

## 7. Configuración de Playwright

### 7.1 Actualizar `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  fullyParallel: false,  // Secuencial para tests de sesiones
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,  // 1 worker para evitar conflictos de DB
  
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Opcional: Safari para verificar cross-browser
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 7.2 Scripts en `package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:sessions": "playwright test e2e/session-*.spec.ts",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 8. Data Attributes para Testing

Agregar `data-testid` en componentes clave:

```typescript
// SessionCard.tsx
<div 
  className="session-card" 
  data-testid="session-card"
  data-status={session.status}
  data-session-id={session.id}
>
  <h3 data-testid="topic-name">{session.topic?.name}</h3>
  {/* ... */}
</div>

// SessionFilters.tsx
<select data-testid="status-filter">
  {/* options */}
</select>

// CompleteSessionDialog.tsx
<button 
  data-testid="rating-easy"
  onClick={() => handleRating('EASY')}
>
  Fácil
</button>
```

---

## 9. CI Integration

### 9.1 Agregar a `.github/workflows/ci.yml`

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  timeout-minutes: 15
  
  services:
    postgres:
      image: supabase/postgres:15.1.0.117
      env:
        POSTGRES_PASSWORD: postgres
      ports:
        - 54322:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Setup Supabase CLI
      run: |
        curl -fsSL https://github.com/supabase/supabase-cli/releases/download/v1.127.0/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
    
    - name: Start Supabase
      run: supabase start
    
    - name: Install Playwright
      run: pnpm exec playwright install --with-deps chromium
    
    - name: Run E2E tests
      run: pnpm test:e2e
      env:
        NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Upload Playwright Report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

---

## 10. Checklist de Implementación

### Setup
- [ ] Configurar Supabase local para testing
- [ ] Crear `seed-data.ts` con datos de test
- [ ] Agregar `data-testid` en componentes de sesiones
- [ ] Actualizar `playwright.config.ts` para 1 worker

### Tests UC-008
- [ ] Test: completar sesión con EASY
- [ ] Test: completar sesión con HARD
- [ ] Test: sesión completada aparece en calendar
- [ ] Test: marcar completada como incompleta
- [ ] Test: stats de completadas en dashboard

### Tests UC-009
- [ ] Test: reagendar a mañana
- [ ] Test: reagendar a fecha custom
- [ ] Test: auto-abandon después de 3 intentos
- [ ] Test: warning con contador de intentos
- [ ] Test: notificación al reagendar

### Tests Bonus (Study Mode)
- [ ] Test: iniciar study mode
- [ ] Test: completar desde study mode
- [ ] Test: marcar incompleta con tiempo parcial

### CI/CD
- [ ] Agregar job de E2E a GitHub Actions
- [ ] Configurar timeout y retries
- [ ] Upload de artifacts (reports, videos)

### Documentación
- [ ] Actualizar README con comandos de E2E
- [ ] Documentar cómo correr tests localmente
- [ ] Documentar cómo debuggear tests fallidos

---

**Tiempo estimado:** 8-10 horas  
**Bloqueadores:** Setup de Supabase local (2h primera vez)  
**Beneficios:**
- ✅ Confianza en features críticas de sesiones
- ✅ Prevenir regresiones en flujos complejos
- ✅ Documentación viva del comportamiento esperado

---

## 11. Manual Testing Checklist

Mientras se implementan los tests E2E automatizados, esta sección documenta las guías de testing manual para features críticas que requieren verificación inmediata.

### 11.1 UC-011c: Conflict Detection & UI Indicators

**Objetivo:** Verificar que las sesiones ajustadas por conflictos con Google Calendar se detecten correctamente y se muestren con indicadores visuales.

#### Pre-requisitos

- [ ] Google Calendar conectado en `/dashboard/settings`
- [ ] Al menos 2 eventos futuros en Google Calendar (para crear conflictos)
- [ ] Supabase local corriendo con la migration `20260318111719_add_conflict_tracking.sql` aplicada
- [ ] Base de datos con al menos 1 subject y 1 exam

#### Test 1: Generar sesiones CON conflictos

**Pasos:**
1. Ir a Google Calendar y crear un evento:
   - Fecha: Mañana a las 10:00
   - Duración: 2 horas
   
2. En StudyApp, crear un nuevo topic:
   - Subject: Cualquier materia
   - Exam: Cualquier parcial/final con fecha en 2 semanas
   - Hours: 120 minutos
   - Source Date: Hoy (para que R1 caiga mañana)

3. Guardar el topic y esperar a que se generen las sesiones

**Resultado esperado:**
- ✅ Las sesiones se generan exitosamente
- ✅ En la consola del servidor aparece: `[SessionGenerator] Session N adjusted to avoid conflict: <nueva_fecha>`
- ✅ Al menos una sesión tiene `adjusted_for_conflict = true`
- ✅ Esa sesión tiene `original_scheduled_at` con la fecha que iba a ser originalmente

**Verificación en DB:**
```sql
SELECT 
  id, 
  number, 
  scheduled_at, 
  original_scheduled_at,
  adjusted_for_conflict
FROM sessions
WHERE topic_id = '<topic_id>'
ORDER BY number;
```

#### Test 2: Visualizar badge de conflicto

**Pasos:**
1. Ir a `/dashboard/sessions` (vista de lista)
2. Buscar la sesión que fue ajustada en Test 1

**Resultado esperado:**
- ✅ La tarjeta de sesión muestra un badge adicional: `⚠️ Ajustada por conflicto`
- ✅ El badge tiene estilo amber (bg-amber-100, text-amber-800)
- ✅ Al hacer hover sobre el badge, aparece un tooltip con la fecha original

**Apariencia esperada:**
```
┌─────────────────────────────────────────┐
│ 🟠 URGENTE  ⏰ Pendiente                │
│ ⚠️ Ajustada por conflicto               │ ← ESTE BADGE
│                                          │
│ R1 - Matemática: Límites                │
│ 📅 Mañana, 18/03 - 12:00                │ ← Fecha ajustada
│ ⏱️ 72 minutos                            │
│                                          │
│ [Comenzar] [Completar] [Reagendar]      │
└─────────────────────────────────────────┘
```

#### Test 3: Generar sesiones SIN conflictos

**Pasos:**
1. Crear un nuevo topic con fecha de clase en una semana (sin eventos en Google Calendar)
2. Guardar y verificar las sesiones generadas

**Resultado esperado:**
- ✅ Todas las sesiones tienen `adjusted_for_conflict = false`
- ✅ Todas las sesiones tienen `original_scheduled_at = null`
- ✅ No aparece ningún badge de conflicto en la UI

#### Test 4: Tooltip con fecha original

**Pasos:**
1. Usar una sesión ajustada del Test 1
2. Hacer hover sobre el badge "⚠️ Ajustada por conflicto"

**Resultado esperado:**
- ✅ Aparece un tooltip HTML nativo
- ✅ El tooltip muestra: `"Reagendada desde <fecha_original>"`
- ✅ La fecha está en formato español: `dd/mm/yyyy, HH:MM`

**Ejemplo:** `Reagendada desde 18/03/2026, 10:00`

#### Casos Edge

**Edge 1: Múltiples conflictos consecutivos**
- Crear 3 eventos consecutivos en días seguidos
- Crear topic que genere sesiones en esas fechas
- Verificar que el algoritmo salta día por día hasta encontrar slot libre (máximo 14 intentos)

**Edge 2: Sin Google Calendar conectado**
- Desconectar Google Calendar desde `/dashboard/settings`
- Crear un nuevo topic
- Verificar que las sesiones se generan normalmente sin badges de conflicto

**Edge 3: Conflicto parcial (evento más corto)**
- Crear evento de 30 minutos a las 10:00
- Crear topic con sesiones de 90 minutos
- Verificar que si la sesión se superpondría aunque sea parcialmente, se detecta conflicto

#### Logs a Monitorear

```bash
# Conflicto detectado y ajustado
[SessionGenerator] Session 1 adjusted to avoid conflict: 2026-03-19T10:00:00.000Z

# No se pudo encontrar slot sin conflictos (edge case)
[SessionGenerator] No conflict-free slot found after 14 attempts, using preferred date
```

---

### 11.2 UC-011b: Import Availability Preview

**Objetivo:** Verificar el flujo completo de preview antes de importar disponibilidad desde Google Calendar.

#### Pre-requisitos

- [ ] Tener Google Calendar conectado desde `/dashboard/settings`
- [ ] Tener algunos eventos en Google Calendar para detectar gaps
- [ ] Opcionalmente tener slots de disponibilidad ya configurados

#### Test 1: Preview con slots detectados

**Pasos:**
1. Ir a `/dashboard/settings/availability`
2. Click en "Importar desde Google Calendar"

**Resultado esperado:**
- ✅ Aparece el diálogo de preview
- ✅ Muestra 3 stats cards:
  - Slots detectados (azul)
  - Válidos ≥30min (verde)
  - Descartados <30min (ámbar)
- ✅ Muestra lista de slots agrupados por día
- ✅ Cada slot muestra horario y duración en minutos

#### Test 2: Comparación con slots existentes

**Si hay slots configurados previamente:**
- ✅ Aparece sección "Horarios Actuales vs Horarios Nuevos"
- ✅ Muestra cantidad de slots en cada lado
- ✅ Aparecen opciones de estrategia:
  - "Reemplazar mis horarios actuales"
  - "Combinar con mis horarios actuales"

**Si NO hay slots existentes:**
- ✅ NO aparece sección de comparación
- ✅ NO aparecen opciones de estrategia
- ✅ Solo botón "Confirmar e Importar"

#### Test 3: Confirmar importación (REPLACE)

**Pasos:**
1. Seleccionar "Reemplazar mis horarios actuales" (si hay slots existentes)
2. Click en "Confirmar e Importar"

**Resultado esperado:**
- ✅ Botón muestra "Importando..."
- ✅ Diálogo se cierra después de importar
- ✅ Aparece mensaje de éxito
- ✅ Página se refresca automáticamente
- ✅ Calendario muestra los nuevos slots
- ✅ Slots anteriores fueron eliminados (si había)

#### Test 4: Confirmar importación (MERGE)

**Pasos:**
1. Volver a abrir "Importar desde Google Calendar"
2. Seleccionar "Combinar con mis horarios actuales"
3. Click en "Confirmar e Importar"

**Resultado esperado:**
- ✅ Se agregan slots nuevos sin eliminar existentes
- ✅ NO se duplican slots idénticos

#### Test 5: Cancelar importación

**Pasos:**
1. Abrir "Importar desde Google Calendar"
2. Click en "Cancelar"

**Resultado esperado:**
- ✅ Diálogo se cierra
- ✅ NO se guarda nada en BD
- ✅ Calendario mantiene slots actuales

#### Casos Edge

**Edge 1: Google Calendar no conectado**
- Desconectar Google Calendar desde Settings
- Intentar "Importar desde Google Calendar"
- Verificar mensaje de error: "Google Calendar no conectado. Conectá tu cuenta primero."
- Verificar que NO se abre el diálogo de preview

**Edge 2: Sin slots detectados**
- Crear un día completamente ocupado en Google Calendar
- Intentar importar
- Verificar mensaje de error: "No se detectaron horarios libres..."
- Verificar que NO se abre el diálogo

**Edge 3: Slots descartados (<30min)**
- El servicio `AvailabilityImporterService` filtra slots menores a 30min mediante `minSlotDuration: 30`
- Por lo tanto, `stats.discarded` siempre será 0 con la implementación actual

**Edge 4: Estrategia MERGE con solapamiento**
- La estrategia MERGE compara `day_of_week`, `start_time` y `end_time` para evitar duplicados exactos
- Slots que se solapan parcialmente NO se detectan como duplicados y se agregarán ambos

---

### 11.3 Métricas de Éxito del Testing Manual

| Métrica | Objetivo | UC-011c | UC-011b |
|---------|----------|---------|---------|
| Detección de conflictos | 100% | ⏳ | N/A |
| Ajuste automático | 100% | ⏳ | N/A |
| Badge visible en UI | 100% | ⏳ | N/A |
| Tooltip funcional | 100% | ⏳ | N/A |
| Preview dialog funcional | 100% | N/A | ⏳ |
| Stats cards correctas | 100% | N/A | ⏳ |
| Comparación lado a lado | 100% | N/A | ⏳ |
| Estrategias REPLACE/MERGE | 100% | N/A | ⏳ |
| Sin errores en consola | 0 errores | ⏳ | ⏳ |

---

### 11.4 Checklist Consolidado

**UC-011c: Conflict Detection**
- [ ] Test 1: Sesiones con conflictos se ajustan correctamente
- [ ] Test 2: Badge de conflicto aparece en UI
- [ ] Test 3: Sesiones sin conflictos no tienen badge
- [ ] Test 4: Tooltip muestra fecha original
- [ ] Edge 1: Múltiples conflictos manejados
- [ ] Edge 2: Sin Google Calendar no rompe nada
- [ ] Edge 3: Conflictos parciales detectados
- [ ] Logs de servidor muestran información correcta
- [ ] Base de datos tiene datos consistentes

**UC-011b: Import Preview**
- [ ] Test 1: Preview con stats cards completas
- [ ] Test 2: Comparación actual vs importado
- [ ] Test 3: Importar con REPLACE funciona
- [ ] Test 4: Importar con MERGE funciona
- [ ] Test 5: Cancelar importación no guarda nada
- [ ] Edge 1: Error si Google Calendar no conectado
- [ ] Edge 2: Error si sin slots detectados
- [ ] Edge 3: Slots <30min se filtran correctamente
- [ ] Edge 4: MERGE no duplica slots idénticos

---

**Estimación de testing manual:** 30-40 minutos total  
**Documentado:** 2026-03-18 (UC-011c), 2026-03-19 (UC-011b)  
**Próximos pasos:** Automatizar estos tests con Playwright cuando se implemente la sección 4-9 de este documento
