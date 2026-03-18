# 🐳 Docker Quick Start

Ejecuta StudyApp completo con Docker en 3 pasos.

---

## 🚀 Inicio Rápido

```bash
# 1. Verificar que Docker esté corriendo
docker info

# 2. Iniciar servicios (primera vez)
./docker-start.sh
# O con make:
make docker-build

# 3. Abrir aplicación
open http://localhost:3000
```

---

## 📦 Lo que incluye

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Next.js App** | 3000 | Aplicación principal |
| **PostgreSQL** | 54322 | Base de datos local (opcional) |
| **Adminer** | 8080 | UI para administrar PostgreSQL |

**Nota**: Por defecto usa Supabase Cloud (producción). PostgreSQL local es opcional para testing.

---

## ⚡ Comandos Rápidos

```bash
# Con script interactivo
./docker-start.sh

# Con Makefile
make help              # Ver todos los comandos
make docker-up         # Iniciar servicios
make docker-logs       # Ver logs
make docker-down       # Detener servicios
make docker-shell      # Acceder a shell
make db-shell          # Conectarse a PostgreSQL

# Con docker-compose directamente
docker-compose up -d   # Iniciar
docker-compose logs -f # Ver logs
docker-compose down    # Detener
```

---

## 📚 Documentación Completa

Ver [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md) para:
- Troubleshooting detallado
- Workflows avanzados
- Gestión de migrations
- Testing en Docker
- Configuración de producción

---

## ✅ Verificación

Después de `./docker-start.sh` o `make docker-up`:

```bash
# Ver estado
docker-compose ps

# Deberías ver:
# ✅ studyapp-web      (UP)
# ✅ studyapp-postgres (UP)
# ✅ studyapp-adminer  (UP)

# Verificar app
curl http://localhost:3000

# Ver logs
docker-compose logs -f app
```

---

## 🐛 Problemas Comunes

### Puerto ocupado

```bash
# Ver qué usa el puerto 3000
lsof -i :3000

# Detener servicios
docker-compose down
```

### Docker no responde

```bash
# Reiniciar Docker Desktop desde la aplicación
# Luego:
docker-compose up -d
```

### Reset completo

```bash
./docker-start.sh
# Opción 4: Reset completo

# O con make:
make docker-clean
```

---

## 🎯 Próximos Pasos

1. **Desarrollo Local**: `pnpm dev` (sin Docker, usa Supabase Cloud)
2. **Testing con DB Local**: Cambiar `.env.local` para apuntar a `localhost:54321`
3. **Producción**: `pnpm build && vercel deploy`

---

**¿Más info?** → [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
