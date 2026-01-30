# 🎉 Cómo Probar StudyApp

## ✅ Estado Actual

### Servicios Corriendo

- **Next.js**: http://localhost:3000 ✅
- **Supabase API**: http://localhost:54321 ✅
- **Supabase Studio**: http://localhost:54323 ✅
- **PostgreSQL**: localhost:54322 ✅

Ver los 9 contenedores en Podman Desktop como muestra tu captura.

### Lo que está Implementado

1. **Base de Datos Completa** (13 tablas con RLS)
2. **Sistema de Autenticación** (Login/Register)
3. **Landing Page**
4. **Dashboard Protegido** (requiere login)

---

## 🧪 Pasos para Probar

### 1. Verificar Landing Page

Abrí: http://localhost:3000

Deberías ver:
- Título "StudyApp"
- Descripción del sistema
- Botones "Iniciar Sesión" y "Crear Cuenta"
- Lista de features

### 2. Crear una Cuenta

1. Click en **"Crear Cuenta"** → http://localhost:3000/register
2. Llenar el formulario:
   - Nombre: `Test User`
   - Email: `test@studyapp.com`
   - Contraseña: `test123456` (mínimo 6 caracteres)
3. Click en **"Crear Cuenta"**

**Resultado esperado:**
- Te redirige a `/dashboard`
- Ves mensaje: "Bienvenido, Test User"
- El header muestra tu email

### 3. Ver el Usuario en Supabase Studio

1. Abrí: http://localhost:54323
2. Navegá a **"Table Editor"** → **"users"**
3. Deberías ver tu usuario creado con:
   - `id` (UUID)
   - `email`: test@studyapp.com
   - `name`: Test User
   - `created_at`, `updated_at`

4. Navegá a **"Authentication"** → **"Users"**
   - Verás el usuario en la tabla de auth.users

### 4. Ver Estadísticas Creadas

En Supabase Studio:
1. **"Table Editor"** → **"user_stats"**
2. Deberías ver un registro con:
   - `user_id` (mismo que tu usuario)
   - `current_streak`: 0
   - `longest_streak`: 0
   - `total_sessions`: 0

Esto se creó automáticamente gracias al trigger `handle_new_user()`.

### 5. Cerrar Sesión y Volver a Iniciar

1. En el dashboard, anotá tu email (aparece en el header)
2. Cerrá la pestaña o navegá a http://localhost:3000
3. Click en **"Iniciar Sesión"**
4. Ingresá:
   - Email: `test@studyapp.com`
   - Contraseña: `test123456`
5. Deberías volver al dashboard

### 6. Probar Protección de Rutas

1. Cerrá sesión (cerrá todas las pestañas o borrá cookies)
2. Intentá acceder directamente a: http://localhost:3000/dashboard

**Resultado esperado:**
- Te redirige automáticamente a `/login`
- El middleware está protegiendo las rutas

---

## 🗄️ Explorar la Base de Datos

### Tablas Creadas

En Supabase Studio → Table Editor, deberías ver:

| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| `users` | Usuarios | 1 (tu usuario) |
| `user_stats` | Estadísticas | 1 (auto-creado) |
| `subjects` | Materias | 0 (vacío) |
| `exams` | Exámenes | 0 (vacío) |
| `topics` | Temas | 0 (vacío) |
| `sessions` | Sesiones | 0 (vacío) |
| `achievements` | Logros | 8 (seed data) |
| `user_achievements` | Logros desbloqueados | 0 (vacío) |
| `tasks` | Tareas | 0 (vacío) |
| `notifications` | Notificaciones | 0 (vacío) |

### Verificar Row Level Security (RLS)

1. En Studio → **"Authentication"**, notá el UUID de tu usuario
2. En **"SQL Editor"**, ejecutá:

```sql
-- Esto debería devolver solo TU registro (gracias a RLS)
SELECT * FROM user_stats;
```

3. Probá crear un registro para otro usuario (debería fallar):

```sql
-- Esto debería dar error porque no podés crear stats para otro usuario
INSERT INTO user_stats (user_id, current_streak)
VALUES ('00000000-0000-0000-0000-000000000000', 10);
```

Error esperado: `new row violates row-level security policy`

### Ver Logros Disponibles

```sql
SELECT * FROM achievements ORDER BY points;
```

Deberías ver 8 logros:
- FIRST_SESSION (10 pts)
- STREAK_7 (50 pts)
- EARLY_BIRD (75 pts)
- NIGHT_OWL (75 pts)
- PERFECT_WEEK (100 pts)
- STREAK_30 (200 pts)
- CONSISTENT (250 pts)
- MASTER_SUBJECT (300 pts)

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"

Verificá que los contenedores estén corriendo:

```bash
podman ps | grep supabase
```

Deberías ver 9 contenedores RUNNING.

Si no:

```bash
cd /Users/martinmalgor/Documents/StudyApp
DOCKER_HOST="unix:///var/folders/cj/50kbc6l97gzdtlghg_vy5h800000gn/T/podman/podman-machine-default-api.sock" \
npx supabase start
```

### "Invalid login credentials"

Verificá que estés usando el mismo email/contraseña con el que te registraste.

### Base de datos vacía

Resetear y aplicar migraciones:

```bash
cd /Users/martinmalgor/Documents/StudyApp
DOCKER_HOST="unix:///var/folders/cj/50kbc6l97gzdtlghg_vy5h800000gn/T/podman/podman-machine-default-api.sock" \
npx supabase db reset
```

Esto borra todo y vuelve a aplicar migrations + seed.

---

## 📊 Próximos Pasos de Desarrollo

Ahora que el setup está funcionando, el próximo paso según el roadmap es:

### Sprint 2: CRUD Core

Implementar las entidades principales:

1. **Subjects (Materias)**
   - Página: `/dashboard/subjects`
   - Crear, listar, editar materias

2. **Exams (Exámenes)**
   - Asociados a materias
   - Tipos: Parcial, Recuperatorio, Final

3. **Topics (Temas)**
   - Asociados a materias y exámenes
   - Con dificultad (Easy/Medium/Hard)

Ver `NEXT_STEPS.md` para detalles completos.

---

## 🎮 Comandos Útiles

```bash
# Detener todo
podman stop $(podman ps -q)

# Ver logs de un contenedor específico
podman logs -f supabase_db_studyapp

# Reiniciar Next.js
# Ctrl+C en la terminal donde corre pnpm dev, luego:
pnpm dev

# Ver estado de Supabase
DOCKER_HOST="unix:///var/folders/cj/50kbc6l97gzdtlghg_vy5h800000gn/T/podman/podman-machine-default-api.sock" \
npx supabase status
```

---

¡Listo para desarrollar! 🚀
