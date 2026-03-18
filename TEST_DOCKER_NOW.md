# 🚀 Probá Docker AHORA

## Paso a Paso para Testing Inmediato

### 1️⃣ Verificar Pre-requisitos (30 segundos)

```bash
# ¿Docker está corriendo?
docker info
# Si da error, abrir Docker Desktop

# ¿Tenés .env.local?
cat .env.local | grep SUPABASE_URL
```

✅ Si ambos funcionan, continuá.

---

### 2️⃣ Iniciar Servicios (2-3 minutos primera vez)

**Opción A: Script Interactivo (Recomendado)**
```bash
./docker-start.sh
# Elegir opción 1: "Iniciar servicios (primera vez)"
```

**Opción B: Makefile**
```bash
make docker-build
```

**Opción C: Docker Compose Directo**
```bash
docker-compose up -d --build
```

🔄 Mientras espera la construcción, podés ver los logs:
```bash
docker-compose logs -f app
```

---

### 3️⃣ Verificar que Todo Esté UP (30 segundos)

```bash
# Ver estado
docker-compose ps

# Deberías ver algo como:
# NAME                  STATUS
# studyapp-web          Up 2 minutes
# studyapp-postgres     Up 2 minutes (healthy)
# studyapp-adminer      Up 2 minutes
```

✅ Todos deben decir "Up"

---

### 4️⃣ Acceder a los Servicios

| URL | Servicio | ¿Qué podés hacer? |
|-----|----------|-------------------|
| http://localhost:3000 | **StudyApp** | Usar la app completa |
| http://localhost:8080 | **Adminer** | Ver tablas de PostgreSQL |
| localhost:54322 | **PostgreSQL** | Conectarte con cliente DB |

#### En el navegador:

1. **Abrir App**: http://localhost:3000
   - Deberías ver el login/register
   - Probá registrarte con un email de prueba
   - Si funciona, ¡estás usando Docker! 🎉

2. **Ver DB** (opcional): http://localhost:8080
   - Sistema: PostgreSQL
   - Servidor: db
   - Usuario: postgres
   - Contraseña: postgres
   - Base de datos: postgres

---

### 5️⃣ Ver Logs en Tiempo Real

```bash
# Logs de la app Next.js
docker-compose logs -f app

# Logs de PostgreSQL
docker-compose logs -f db

# Logs de todos
docker-compose logs -f
```

Deberías ver:
```
studyapp-web  | ▲ Next.js 14.1.0
studyapp-web  | - Local:        http://localhost:3000
studyapp-web  | ✓ Ready in 2.3s
```

---

### 6️⃣ Testing Rápido

#### Test 1: Hot Reload (5 segundos)

```bash
# Editar cualquier archivo .tsx
echo "// Test de hot reload" >> src/app/page.tsx

# Refrescar http://localhost:3000
# Debería actualizar automáticamente
```

#### Test 2: DB Local (opcional)

```bash
# Conectarse a PostgreSQL
docker-compose exec db psql -U postgres

# Dentro de psql:
\dt                 -- Ver tablas
SELECT * FROM users LIMIT 5;
\q                  -- Salir
```

#### Test 3: Instalar Paquete

```bash
# Agregar paquete (ejemplo)
docker-compose exec app pnpm add lodash

# Verificar que se instaló
docker-compose exec app pnpm list lodash
```

---

### 7️⃣ Comandos Útiles Durante Testing

```bash
# Ver uso de recursos
docker stats studyapp-web

# Reiniciar app (si algo se rompe)
docker-compose restart app

# Acceder a shell del contenedor
docker-compose exec app sh

# Ver variables de entorno
docker-compose exec app env | grep SUPABASE
```

---

### 8️⃣ Detener Todo Cuando Termines

```bash
# Detener (conserva datos)
docker-compose stop

# Detener y eliminar contenedores (conserva DB)
docker-compose down

# Reset COMPLETO (elimina TODO)
docker-compose down -v
```

---

## 🎯 Checklist de Éxito

Marcá lo que funciona:

- [ ] `docker-compose ps` muestra servicios UP
- [ ] http://localhost:3000 carga el login
- [ ] Podés registrarte/loguearte
- [ ] http://localhost:8080 muestra Adminer
- [ ] `docker-compose logs -f app` muestra "Ready"
- [ ] Hot reload funciona (editar archivo → ver cambios)
- [ ] No hay errores en `docker-compose logs app`

---

## 🐛 Si Algo No Funciona

### Puerto 3000 ocupado
```bash
lsof -i :3000
kill -9 <PID>
docker-compose restart app
```

### No compila / errores raros
```bash
# Limpiar cache
docker-compose exec app rm -rf .next node_modules
docker-compose restart app
docker-compose exec app pnpm install
```

### DB no responde
```bash
docker-compose logs db
docker-compose restart db
```

### Reset nuclear (último recurso)
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 📊 Métricas de Performance

Con Docker, deberías ver:

| Métrica | Esperado |
|---------|----------|
| Tiempo de build (primera vez) | 2-5 min |
| Tiempo de start (después) | 10-30 seg |
| Hot reload | < 2 seg |
| Memoria usada (app) | ~300-500 MB |
| Memoria usada (db) | ~100-200 MB |

Ver uso real:
```bash
docker stats --no-stream
```

---

## ✅ Próximos Pasos

Si todo funciona:

1. **Desarrollar normalmente**: Los cambios se reflejan automáticamente
2. **Commitear**: Los archivos Docker ya están en el repo
3. **Compartir**: Otros devs pueden usar `./docker-start.sh`

Si preferís desarrollo sin Docker:
```bash
docker-compose down
pnpm dev
# Usa Supabase Cloud directamente
```

---

**🎉 ¡Listo para testear!** Ejecutá `./docker-start.sh` y seguí los pasos.

**📚 Más info**: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
