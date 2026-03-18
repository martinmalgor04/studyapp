# 🐳 Docker Setup - StudyApp

Guía completa para ejecutar StudyApp con Docker Compose.

---

## 📋 Pre-requisitos

- **Docker Desktop** instalado y corriendo
  - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (incluido en Docker Desktop)
- Al menos **2GB de RAM** disponible para Docker
- Puertos **3000, 54322, 8080** libres

---

## 🚀 Quick Start

### 1. Verificar configuración

```bash
# Asegurarte que .env.local existe y tiene las keys de Supabase
cat .env.local
```

### 2. Iniciar todos los servicios

```bash
# Construir e iniciar el stack
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f app
```

### 3. Verificar que todo esté corriendo

```bash
# Ver estado de contenedores
docker-compose ps

# Deberías ver:
# ✅ studyapp-web      (app Next.js en :3000)
# ✅ studyapp-postgres (PostgreSQL en :54322)
# ✅ studyapp-adminer  (DB UI en :8080)
```

### 4. Acceder a los servicios

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|------------|
| **Next.js App** | http://localhost:3000 | - | - |
| **PostgreSQL** | localhost:54322 | postgres | postgres |
| **Adminer (DB UI)** | http://localhost:8080 | postgres | postgres |

---

## 🔧 Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar TODO (incluyendo DB)
docker-compose down -v

# Reconstruir imagen después de cambios
docker-compose build app

# Reiniciar un servicio
docker-compose restart app
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs de la app
docker-compose logs -f app

# Ver logs de PostgreSQL
docker-compose logs -f db

# Ver últimas 50 líneas
docker-compose logs --tail=50 app
```

### Ejecución de Comandos

```bash
# Ejecutar comando en el contenedor
docker-compose exec app pnpm lint

# Acceder a shell del contenedor
docker-compose exec app sh

# Instalar nuevas dependencias
docker-compose exec app pnpm install

# Ejecutar tests
docker-compose exec app pnpm test
```

### Base de Datos

```bash
# Conectarse a PostgreSQL
docker-compose exec db psql -U postgres

# Ver tablas
docker-compose exec db psql -U postgres -c "\dt"

# Ejecutar migration manualmente
docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/20240126000001_initial_schema.sql

# Backup de la base de datos
docker-compose exec db pg_dump -U postgres postgres > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U postgres postgres < backup.sql
```

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────┐
│  Browser (localhost:3000)        │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│  Next.js App Container             │
│  - React Components                │
│  - Server Actions                  │
│  - API Routes                      │
└─────┬──────────────────────────────┘
      │
      ├─► Supabase Cloud (producción)
      │   https://uoqgyvscgxrlwdhmpogv.supabase.co
      │
      └─► PostgreSQL Container (local)
          - Para testing local opcional
          - localhost:54322
```

**Importante**: Por defecto, la app usa Supabase Cloud (según `.env.local`). El PostgreSQL local es opcional para testing.

---

## 🔄 Workflows Comunes

### Desarrollo con Hot Reload

```bash
# Iniciar en modo desarrollo
docker-compose up

# Los cambios en archivos se reflejan automáticamente
# gracias al volume mapping
```

### Aplicar Nuevas Migrations

```bash
# 1. Crear migration en supabase/migrations/
# 2. Reiniciar DB para aplicarla automáticamente
docker-compose restart db

# O aplicarla manualmente
docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/<migration>.sql
```

### Agregar Dependencias

```bash
# 1. Agregar a package.json localmente
pnpm add <paquete>

# 2. Instalar en el contenedor
docker-compose exec app pnpm install

# O reconstruir
docker-compose build app
```

### Testing Local de Migrations

Si querés probar migrations en PostgreSQL local:

```bash
# 1. Cambiar .env.local temporalmente
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# 2. Reiniciar app
docker-compose restart app

# 3. Aplicar migrations
docker-compose restart db
```

---

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

### Cambios no se reflejan

```bash
# Limpiar cache de Next.js
docker-compose exec app rm -rf .next

# Reiniciar
docker-compose restart app
```

### Error de conexión a DB

```bash
# Verificar que DB esté healthy
docker-compose ps db

# Ver logs
docker-compose logs db

# Verificar conectividad
docker-compose exec app ping db
```

### "Cannot connect to Docker daemon"

```bash
# Verificar que Docker Desktop esté corriendo
docker info

# Iniciar Docker Desktop desde la aplicación
```

### Reset Completo

```bash
# Detener y eliminar TODO
docker-compose down -v

# Limpiar imágenes
docker image prune -a

# Volver a construir
docker-compose build

# Iniciar
docker-compose up -d
```

---

## 📊 Monitoreo

```bash
# Ver uso de recursos (CPU, RAM, Network)
docker stats

# Ver solo la app
docker stats studyapp-web

# Inspeccionar contenedor
docker inspect studyapp-web
```

---

## ✅ Checklist de Verificación

Después de iniciar Docker:

- [ ] `docker-compose ps` muestra todos los servicios UP
- [ ] http://localhost:3000 carga la aplicación
- [ ] http://localhost:8080 muestra Adminer
- [ ] Puedes loguearte en la app (con Supabase Cloud)
- [ ] Los logs no muestran errores críticos

---

## 🚀 Pasar a Producción

Para deployar en producción (sin Docker):

```bash
# Build local
pnpm build

# Deploy a Vercel
vercel deploy --prod
```

El Dockerfile incluye un stage `runner` para producción si querés usar Docker en producción:

```bash
docker build --target runner -t studyapp:prod .
docker run -p 3000:3000 studyapp:prod
```

---

## 📚 Recursos

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)

---

**¿Problemas?** Revisa los logs con `docker-compose logs -f app`
