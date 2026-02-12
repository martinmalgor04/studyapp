# Guía de Testing Manual - StudyApp

Esta guía detalla cómo probar manualmente cada caso de uso implementado, junto con recomendaciones para tests automatizados.

---

## Índice de Casos de Uso

| UC | Caso de Uso | Estado | Página |
|----|-------------|--------|--------|
| UC-001 | User Registration | Completado | [Ver](#uc-001-user-registration) |
| UC-002 | User Login | Completado | [Ver](#uc-002-user-login) |
| UC-003 | Create Subject | Completado | [Ver](#uc-003-create-subject) |
| UC-004 | Create Exam | Completado | [Ver](#uc-004-create-exam) |
| UC-005 | Create Topic | Completado | [Ver](#uc-005-create-topic) |
| UC-006 | Generate Sessions | Completado | [Ver](#uc-006-generate-sessions) |
| UC-007 | View Dashboard | Completado | [Ver](#uc-007-view-dashboard) |
| UC-008 | Track Session Completion | Completado | [Ver](#uc-008-track-session-completion) |
| UC-009 | Reschedule Session | Completado | [Ver](#uc-009-reschedule-session) |
| UC-010 | Free Study Mode | Completado | [Ver](#uc-010-free-study-mode) |
| UC-011 | Sync Google Calendar | Completado | [Ver](#uc-011-sync-google-calendar) |
| UC-012 | Send Notifications | Completado | [Ver](#uc-012-send-notifications) |
| UC-021 | Manage Availability | Completado | [Ver](#uc-021-manage-availability) |
| UC-022 | Onboarding | Completado | [Ver](#uc-022-onboarding) |

---

## UC-001: User Registration

### Precondiciones
- Servidor corriendo en `http://localhost:3000`
- Base de datos limpia o sin el email que vas a usar

### Pasos Manuales

1. Andá a `http://localhost:3000/register`
2. Completá el formulario:
   - Nombre: "Test User"
   - Email: "test@example.com"
   - Contraseña: "Test123!"
3. Click en "Crear Cuenta"
4. Verificá que te redirige a `/login`
5. Ingresá con las mismas credenciales
6. Verificá que entrás al dashboard

### Resultado Esperado
- Usuario creado en `auth.users`
- Usuario creado en `users` (public schema)
- Login exitoso después del registro
- Redirección a onboarding (si es primera vez)

### Tests Automatizados

**E2E con Playwright:**
```typescript
test('registro y login exitoso', async ({ page }) => {
  await page.goto('/register');
  await page.fill('#name', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/login');
  
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
});
```

---

## UC-002: User Login

### Precondiciones
- Usuario ya registrado

### Pasos Manuales

1. Andá a `http://localhost:3000/login`
2. Ingresá email y contraseña
3. Click en "Iniciar Sesión"
4. Verificá redirección a `/dashboard` o `/onboarding`

### Resultado Esperado
- Sesión activa en Supabase
- Cookies de autenticación creadas
- Redirección correcta

### Tests Automatizados

**E2E:**
```typescript
test('login con credenciales válidas', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('login con credenciales inválidas', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'wrong@example.com');
  await page.fill('#password', 'WrongPass');
  await page.click('button[type="submit"]');
  await expect(page.locator('.text-red-800')).toBeVisible();
});
```

---

## UC-003: Create Subject

### Precondiciones
- Usuario logueado
- En la página `/dashboard/subjects`

### Pasos Manuales

1. Click en "+ Nueva Materia"
2. Completá:
   - Nombre: "Análisis Matemático I"
   - Descripción: "Límites, derivadas, integrales"
3. Click en "Crear Materia"
4. Verificá que aparece en la lista con:
   - Nombre
   - Descripción
   - Fecha de creación
   - Barra de progreso en 0%

### Resultado Esperado
- Materia guardada en `subjects`
- Card visible en la grilla
- Progreso calculado automáticamente

### Tests Automatizados

**E2E:**
```typescript
test('crear materia exitosamente', async ({ page }) => {
  await page.goto('/dashboard/subjects');
  await page.click('text=Nueva Materia');
  await page.fill('#name', 'Análisis I');
  await page.fill('#description', 'Test description');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Análisis I')).toBeVisible();
});
```

**Unit Test:**
```typescript
describe('createSubject', () => {
  it('should create subject with valid data', async () => {
    const result = await createSubject({
      name: 'Test Subject',
      description: 'Test desc'
    });
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });
});
```

---

## UC-004: Create Exam

### Precondiciones
- Tener al menos una materia creada
- Estar en el detalle de la materia (`/dashboard/subjects/[id]`)

### Pasos Manuales

1. Click en "+ Nuevo Examen"
2. Completá:
   - Tipo: "Parcial Teórico"
   - Número: 1
   - Fecha: Elegir fecha futura
3. Click en "Crear Examen"
4. Verificá que aparece en la lista con:
   - Badge de tipo
   - Fecha
   - Contador de días restantes

### Resultado Esperado
- Examen guardado en `exams`
- Si es FINAL: estado de materia cambia a REGULAR
- Visible en la lista de exámenes

### Tests Automatizados

**E2E:**
```typescript
test('crear examen parcial', async ({ page }) => {
  // Navegar a materia
  await page.goto('/dashboard/subjects');
  await page.click('.subject-card').first();
  
  // Crear examen
  await page.click('text=Nuevo Examen');
  await page.selectOption('#type', 'PARCIAL_THEORY');
  await page.fill('#number', '1');
  await page.fill('#date', '2026-03-15');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Parcial')).toBeVisible();
});
```

---

## UC-005: Create Topic

### Precondiciones
- Tener materia y examen creados
- Estar en el detalle de la materia

### Pasos Manuales

1. Click en "+ Nuevo Tema"
2. Completá:
   - Nombre: "Límites"
   - Dificultad: "Medio"
   - Duración: 60 minutos
   - Fuente: "Clase"
   - Fecha de clase: Elegir fecha pasada
   - Examen asociado: Seleccionar
3. Click en "Crear Tema"
4. Verificá que:
   - Tema aparece en la lista
   - Se genera notificación "Nuevas sesiones generadas"
   - Campana muestra badge con notificación

### Resultado Esperado
- Tema guardado en `topics`
- 4 sesiones generadas automáticamente (R1, R2, R3, R4)
- Notificación in-app creada
- Si tienes email activado: email recibido
- Si tienes Google Calendar conectado: eventos creados

### Tests Automatizados

**E2E:**
```typescript
test('crear tema y generar sesiones', async ({ page }) => {
  await page.goto('/dashboard/subjects/[id]');
  await page.click('text=Nuevo Tema');
  
  await page.fill('#name', 'Límites');
  await page.selectOption('#difficulty', 'MEDIUM');
  await page.fill('#hours', '60');
  await page.selectOption('#source', 'CLASS');
  await page.fill('#source_date', '2026-02-01');
  await page.click('button[type="submit"]');
  
  // Verificar notificación
  await expect(page.locator('.notification-bell .badge')).toHaveText('1');
});
```

**Unit Test:**
```typescript
describe('generateSessionsForTopic', () => {
  it('should generate 4 sessions with correct intervals', async () => {
    const sessions = await generateSessionsForTopic(mockTopic, mockExam, userId);
    expect(sessions).toHaveLength(4);
    expect(sessions[0].number).toBe(1);
    expect(sessions[3].number).toBe(4);
  });
});
```

---

## UC-006: Generate Sessions

### Precondiciones
- Tema creado con `source_date`

### Pasos Manuales

1. Creá un tema (ver UC-005)
2. Andá a `/dashboard/sessions`
3. Verificá que hay 4 sesiones:
   - R1: source_date + 1 día
   - R2: source_date + 3 días
   - R3: source_date + 7 días
   - R4: source_date + 14 días
4. Verificá prioridades (color de badges)
5. Verificá duraciones (decrecientes según factor)

### Resultado Esperado
- Intervalos: [1, 3, 7, 14] días
- Duraciones: calculadas según dificultad y factor de reducción
- Prioridades: asignadas según algoritmo

### Tests Automatizados

**Unit Tests (Ya existen 56 tests):**
```typescript
// src/__tests__/unit/services/session-generator.test.ts
describe('SessionGenerator', () => {
  it('debe generar sesiones con intervalos correctos');
  it('debe calcular duraciones con factor de reducción');
  it('debe asignar prioridades correctamente');
  it('debe validar intervalo mínimo de 1 día');
});
```

---

## UC-007: View Dashboard

### Precondiciones
- Usuario logueado
- Datos creados (materias, temas, sesiones)

### Pasos Manuales

1. Andá a `/dashboard`
2. Verificá Stats Cards:
   - Materias (número correcto, clickeable)
   - Temas (número correcto)
   - Sesiones Hoy (número correcto)
   - Exámenes (número correcto)
   - Próximos Exámenes (número correcto)
3. Verificá "Agregar Tema Rápido" funciona
4. Verificá calendario semanal con sesiones
5. Verificá "Próximas Sesiones" muestra datos

### Resultado Esperado
- Dashboard carga en <3 segundos
- Stats actualizadas
- Componentes interactivos funcionan

### Tests Automatizados

**E2E:**
```typescript
test('dashboard muestra stats correctas', async ({ page }) => {
  await page.goto('/dashboard');
  
  const subjects = await page.locator('[data-testid="stat-card"]').first();
  await expect(subjects).toContainText('Materias');
  
  await expect(page.locator('.quick-add-topic')).toBeVisible();
  await expect(page.locator('.unified-calendar')).toBeVisible();
});
```

---

## UC-008: Track Session Completion

### Precondiciones
- Tener sesiones pendientes

### Pasos Manuales - Opción 1: Completar Rápido

1. Andá a `/dashboard/sessions` o `/dashboard`
2. Localizá una sesión PENDING
3. Click en "✓ Completar"
4. Se abre modal con 3 opciones
5. Click en "Fácil", "Normal" o "Difícil"
6. Verificá que:
   - Modal se cierra
   - Sesión cambia a estado COMPLETED (verde)
   - Badge de estado actualizado

### Pasos Manuales - Opción 2: Usar Timer Pomodoro

1. Localizá sesión PENDING
2. Click en "Estudiar"
3. Se abre pantalla completa con timer
4. Click en "Iniciar" (timer empieza countdown de 25 min)
5. Esperá o click en "Terminé antes"
6. Click en "Completar Sesión"
7. Elegí rating (Fácil/Normal/Difícil)
8. Verificá que vuelve al dashboard con sesión completada

### Pasos Manuales - Opción 3: Marcar Incompleta

1. Abrir "Estudiar" en una sesión
2. Click en "No pude terminar"
3. Verificá que aparece confirm con opción de reagendar tiempo restante
4. Aceptar o cancelar
5. Verificá estado INCOMPLETE

### Resultado Esperado
- `status = COMPLETED`
- `completed_at` seteado
- `completion_rating` guardado
- `actual_duration` calculado (si usaste timer)
- Evento emitido al SessionEventRegistry (logs en consola)

### Tests Automatizados

**E2E:**
```typescript
test('completar sesión con rating', async ({ page }) => {
  await page.goto('/dashboard/sessions');
  await page.click('.session-card button:has-text("Completar")').first();
  
  // Modal debe estar visible
  await expect(page.locator('text=¿Cómo te fue')).toBeVisible();
  
  await page.click('button:has-text("Normal")');
  
  // Verificar que cambió a completada
  await expect(page.locator('.session-card .text-green-800')).toBeVisible();
});

test('timer pomodoro cuenta correctamente', async ({ page, clock }) => {
  // Mock del tiempo para no esperar 25 minutos reales
  await clock.install({ time: new Date() });
  
  await page.goto('/dashboard/sessions');
  await page.click('button:has-text("Estudiar")').first();
  
  await page.click('button:has-text("Iniciar")');
  await clock.runFor(60000); // Avanzar 1 minuto
  
  await expect(page.locator('text=24:00')).toBeVisible();
});
```

**Unit Test:**
```typescript
describe('completeSessionWithRating', () => {
  it('should update status and rating', async () => {
    const result = await completeSessionWithRating(sessionId, 'EASY');
    expect(result.success).toBe(true);
    
    const session = await getSession(sessionId);
    expect(session.status).toBe('COMPLETED');
    expect(session.completion_rating).toBe('EASY');
    expect(session.completed_at).toBeDefined();
  });
});
```

---

## UC-009: Reschedule Session

### Precondiciones
- Tener sesión PENDING

### Pasos Manuales - Opción Rápida

1. Andá a `/dashboard/sessions`
2. Click en "🔄 Reagendar" en una sesión
3. Modal se abre con toggle "Opciones rápidas" / "Fecha personalizada"
4. En "Opciones rápidas", click en "Mañana"
5. Verificá que:
   - Modal se cierra
   - Sesión cambia a RESCHEDULED (naranja)
   - Nueva fecha visible
   - Notificación "Sesión reagendada" en campana

### Pasos Manuales - Opción Personalizada

1. Abrir diálogo de reagendado
2. Click en "Fecha personalizada"
3. Elegir fecha y hora específica
4. Click en "Confirmar fecha"
5. Verificar cambios

### Pasos Manuales - Auto-Abandono

1. Reagendar 3 veces la misma sesión
2. En el 4to intento, verificar que se abandona automáticamente
3. Verificar warning en modal "Ya fue reagendada 3 veces"

### Resultado Esperado
- `status = RESCHEDULED`
- `scheduled_at` actualizado
- `attempts` incrementado
- Notificación enviada
- Si `attempts > 3`: auto-abandono

### Tests Automatizados

**E2E:**
```typescript
test('reagendar sesión con opción rápida', async ({ page }) => {
  await page.goto('/dashboard/sessions');
  await page.click('button:has-text("Reagendar")').first();
  
  await page.click('button:has-text("Mañana")');
  
  await expect(page.locator('.session-card')).toContainText('Reagendada');
});

test('auto-abandonar después de 3 reagendados', async ({ page }) => {
  // Reagendar 3 veces
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("Reagendar")');
    await page.click('button:has-text("Mañana")');
  }
  
  // 4to intento debería abandonar
  await page.click('button:has-text("Reagendar")');
  await page.click('button:has-text("Mañana")');
  
  await expect(page.locator('text=Abandonada')).toBeVisible();
});
```

---

## UC-010: Free Study Mode

### Precondiciones
- Tener un examen FINAL creado

### Pasos Manuales

1. Andá a la materia con examen final
2. Click en "+ Nuevo Tema"
3. Verificá que el formulario detecta el modo auto:
   - Source pre-seleccionado: "Estudio Libre"
   - Examen pre-seleccionado: el FINAL
4. Completá nombre y dificultad
5. Crear tema
6. Verificá que las sesiones se generan:
   - Desde hoy hacia adelante (no desde clase)
   - Intervalos: [1, 3, 7, 14] días desde hoy

### Resultado Esperado
- Sesiones generadas con source = FREE_STUDY
- Fechas relativas a HOY, no a una clase
- Modo countdown si el final está cerca

### Tests Automatizados

**Unit Test:**
```typescript
describe('Free Study Mode', () => {
  it('should generate sessions from today', () => {
    const topic = { source: 'FREE_STUDY', source_date: new Date().toISOString() };
    const sessions = generateSessionsForTopic(topic, finalExam, userId);
    
    const firstSessionDate = new Date(sessions[0].scheduled_at);
    const today = new Date();
    
    expect(firstSessionDate.getDate()).toBe(today.getDate() + 1);
  });
});
```

---

## UC-011: Sync Google Calendar

### Precondiciones
- Tener credenciales de Google configuradas en `.env.local`
- Usuario logueado

### Pasos Manuales - Conectar

1. Andá a `/dashboard/settings`
2. Scroll hasta "Google Calendar"
3. Click en "Conectar Google Calendar"
4. Serás redirigido a Google
5. Autorizá el acceso (elegí tu cuenta)
6. Vuelve a Settings automáticamente
7. Verificá badge "Conectado" en verde

### Pasos Manuales - Sincronizar

1. Una vez conectado, click en "Sincronizar ahora"
2. Esperá (puede tardar unos segundos)
3. Abrí tu Google Calendar en otra pestaña
4. Verificá que aparecen eventos con formato:
   - Título: "Límites - R1"
   - Descripción: Materia, duración
   - Fecha/hora: según las sesiones

### Pasos Manuales - Desconectar

1. Click en "Desconectar"
2. Confirmar en el alert
3. Verificá que el badge desaparece

### Resultado Esperado
- Tokens guardados en `user_settings`
- Eventos creados en Google Calendar
- Auto-sync al crear temas nuevos

### Tests Automatizados

**Integration Test:**
```typescript
describe('Google Calendar Sync', () => {
  it('should create event in Google Calendar', async () => {
    const mockTokens = { access_token: 'fake_token' };
    const mockSession = { /* ... */ };
    
    const service = new GoogleCalendarService();
    const eventId = await service.createEventForSession(mockTokens, mockSession);
    
    expect(eventId).toBeDefined();
  });
});
```

**E2E (con mocks):**
```typescript
test('conectar Google Calendar', async ({ page, context }) => {
  // Mock de OAuth redirect
  await context.route('**//accounts.google.com/**', route => {
    route.fulfill({ status: 302, headers: { location: '/api/auth/callback/google?code=fake_code' } });
  });
  
  await page.goto('/dashboard/settings');
  await page.click('text=Conectar Google Calendar');
  
  await expect(page.locator('text=Conectado')).toBeVisible();
});
```

---

## UC-012: Send Notifications

### Precondiciones
- Usuario con email configurado
- Notificaciones in-app y/o email activadas en `/dashboard/settings`

### Pasos Manuales - In-App

1. Creá un tema nuevo (dispara notificación)
2. Verificá la campana en el navbar
3. Debería mostrar badge con "1"
4. Click en la campana
5. Dropdown se abre con la notificación
6. Click en la notificación
7. Se marca como leída (badge desaparece)

### Pasos Manuales - Email (Resend)

1. Asegurate de tener `email_notifications = true` en Settings
2. Creá un tema nuevo
3. Revisá tu bandeja de entrada (puede tardar 1-2 minutos)
4. Verificá que recibiste email con:
   - Asunto: "Nuevas sesiones generadas"
   - Template HTML con diseño de StudyApp
   - Link a dashboard

### Pasos Manuales - Preferencias

1. Andá a `/dashboard/settings`
2. Des-tildá "Notificaciones por Email"
3. Guardá cambios
4. Creá otro tema
5. Verificá que NO recibís email (solo in-app)

### Resultado Esperado
- In-App: siempre funciona (si está activado)
- Email: se envía si `email_notifications = true`
- Telegram: stub (solo logs)

### Tests Automatizados

**Unit Test:**
```typescript
describe('NotificationService', () => {
  it('should send to active channels only', async () => {
    const service = new NotificationService();
    const result = await service.send({
      userId: 'test',
      type: 'SESSION_REMINDER',
      title: 'Test',
      message: 'Test'
    });
    
    expect(result).toBeDefined();
  });
});
```

**Integration Test (con Resend mock):**
```typescript
test('EmailChannel envía email correctamente', async () => {
  const channel = new EmailChannel();
  await expect(channel.send({
    userId: 'user-with-email',
    type: 'SESSION_REMINDER',
    title: 'Test',
    message: 'Test message'
  })).resolves.not.toThrow();
});
```

---

## UC-021: Manage Availability

### Precondiciones
- Usuario logueado

### Pasos Manuales - Vista Calendario

1. Andá a `/dashboard/settings/availability`
2. Verificá que está en modo "Calendario" (toggle arriba a la derecha)
3. Click en "+ Agregar" en la columna "Lunes"
4. Modal se abre
5. Completá:
   - Día: Lunes (pre-seleccionado)
   - Hora inicio: 18:00
   - Hora fin: 22:00
6. Click en "Agregar"
7. Verificá bloque verde aparece en la columna
8. Click en "Guardar Disponibilidad"
9. Recargá la página → bloques persisten

### Pasos Manuales - Vista Lista

1. Toggle a "Lista"
2. Verificá que muestra el mismo horario pero en formato lista
3. Podés agregar más horarios con "+ Agregar Horario"
4. Botón "Copiar a todos" duplica el horario a todos los días

### Pasos Manuales - Editar/Eliminar

1. Click en un bloque verde
2. Modal se abre con datos pre-cargados
3. Modificá horarios
4. Click en "Actualizar"
5. O click en la X del bloque para eliminar

### Resultado Esperado
- Slots guardados en `availability_slots`
- Persistencia entre sesiones
- Vista calendario y lista sincronizadas

### Tests Automatizados

**E2E:**
```typescript
test('agregar disponibilidad horaria', async ({ page }) => {
  await page.goto('/dashboard/settings/availability');
  
  // Modo calendario
  await page.click('text=+ Agregar').first();
  await page.selectOption('#day', '1'); // Lunes
  await page.fill('#start', '18:00');
  await page.fill('#end', '22:00');
  await page.click('button:has-text("Agregar")');
  
  // Verificar bloque visible
  await expect(page.locator('.bg-green-100')).toContainText('18:00');
  
  await page.click('button:has-text("Guardar Disponibilidad")');
  await page.reload();
  
  // Debe persistir
  await expect(page.locator('.bg-green-100')).toBeVisible();
});
```

---

## UC-022: Onboarding

### Precondiciones
- Usuario recién registrado
- No tiene `onboarding_completed = true`

### Pasos Manuales

1. Registrate con un usuario nuevo
2. Después del callback, serás redirigido a `/onboarding`
3. Verificá pantalla con gradiente y 3 cards:
   - Mañana (08-12) - icono sol
   - Tarde (13-17) - icono nube
   - Noche (18-22) - icono luna
4. Click en "Tarde" y "Noche" (multi-selección)
5. Activá checkbox "Incluir fines de semana"
6. Click en "Finalizar y empezar"
7. Verificá redirección a `/dashboard`
8. Andá a `/settings/availability`
9. Verificá que hay 14 slots creados:
   - 7 días × 2 turnos (Tarde y Noche)

### Resultado Esperado
- Slots generados automáticamente
- `onboarding_completed = true` en `user_settings`
- No vuelve a aparecer el onboarding

### Tests Automatizados

**E2E:**
```typescript
test('onboarding flujo completo', async ({ page }) => {
  // Registrar usuario
  await page.goto('/register');
  // ... registro ...
  
  // Debe redirigir a onboarding
  await expect(page).toHaveURL('/onboarding');
  
  // Seleccionar turnos
  await page.click('button:has-text("Mañana")');
  await page.click('button:has-text("Noche")');
  await page.check('input[type="checkbox"]');
  
  await page.click('button:has-text("Finalizar")');
  
  // Debe ir a dashboard
  await expect(page).toHaveURL('/dashboard');
  
  // No debe volver a onboarding
  await page.goto('/dashboard');
  await expect(page).not.toHaveURL('/onboarding');
});
```

---

## Flujo de Testing Completo (Smoke Test)

### Flujo "Happy Path" - 10 minutos

1. **Registro**: Crear usuario nuevo
2. **Onboarding**: Seleccionar Mañana + Tarde, con fines de semana
3. **Materia**: Crear "Análisis I"
4. **Examen**: Crear "Parcial 1" con fecha en 2 semanas
5. **Tema**: Crear "Límites" con fecha de clase ayer
6. **Verificar Sesiones**: Ver 4 sesiones en `/dashboard/sessions`
7. **Estudiar**: Abrir timer Pomodoro en R1
8. **Completar**: Marcar como "Normal"
9. **Google Calendar**: Conectar cuenta y sincronizar
10. **Verificar Calendar**: Abrir Google Calendar y ver eventos
11. **Notificaciones**: Verificar campana tiene notificaciones
12. **Email**: Verificar inbox tiene emails de Resend

### Resultado Esperado
- Todo funciona sin errores
- Datos persisten entre recargas
- Integraciones externas funcionan

---

## Tests Automatizados - Resumen

### Tests Existentes

```bash
pnpm test
```

**Unit Tests (56):**
- `src/__tests__/unit/services/session-generator.test.ts`
- `src/__tests__/unit/services/priority-calculator.test.ts`

**E2E Tests (20):**
- `e2e/auth.spec.ts`
- `e2e/study-flow.spec.ts`

### Tests Recomendados para Agregar

1. **Session Completion**: E2E para flujo completo con rating
2. **Reschedule**: E2E para opciones rápidas y auto-abandono
3. **Onboarding**: E2E para flujo de nuevo usuario
4. **Availability**: E2E para CRUD de slots
5. **Google Calendar**: Integration tests con mocks
6. **Notifications**: Unit tests para cada canal

---

## Comandos Útiles

```bash
# Correr todos los tests
pnpm test

# E2E con UI
pnpm test:e2e

# Linter
pnpm lint

# Resetear DB (útil entre tests)
pnpm supabase db reset

# Ver logs de Supabase
pnpm supabase logs
```

---

## Troubleshooting

### "No tengo notificaciones"
- Verificá que creaste un tema con sesiones
- Verificá que `in_app_notifications = true` en Settings
- Recargá la página

### "No recibo emails"
- Verificá `RESEND_API_KEY` en `.env.local`
- Verificá `email_notifications = true` en Settings
- Revisá la consola del servidor (logs de Resend)
- Revisá carpeta de spam

### "Google Calendar no conecta"
- Verificá credenciales en `.env.local`
- Verificá que agregaste `localhost:3000` a los orígenes autorizados en Google Cloud Console
- Revisá logs del servidor para errores de OAuth

---

_Última actualización: Febrero 2026_
