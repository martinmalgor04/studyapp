# 🔧 Setup Híbrido - Next.js + PostgreSQL Docker

Configuración para desarrollo con:
- **Next.js**: Corriendo con `pnpm dev` (hot reload nativo)
- **PostgreSQL**: En Docker (aislado, limpio, fácil de resetear)

---

## 🚀 Inicio Rápido

```bash
# 1. Iniciar PostgreSQL en Docker
./start-db.sh

# 2. En otra terminal, iniciar Next.js
pnpm dev

# 3. Abrir app
open http://localhost:3000
```

¡Listo! 🎉

---

## 📋 Configuración Completa

### 1️⃣ Detener Supabase Local (si está corriendo)

```bash
# Detener Supabase CLI
supabase stop

# Verificar que se detuvo
docker ps
# No deberías ver contenedores supabase_*
```

### 2️⃣ Iniciar PostgreSQL en Docker

```bash
# Con el script automático
./start-db.sh

# O manualmente con docker-compose
docker-compose -f docker-compose.db.yml up -d

# Ver logs
docker-compose -f docker-compose.db.yml logs -f db
```

### 3️⃣ Configurar Variables de Entorno (Opcional)

Si querés conectarte a PostgreSQL local en vez de Supabase Cloud:

```bash
# Opción A: Agregar a .env.local
echo "" >> .env.local
echo "# PostgreSQL Docker" >> .env.local
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/studyapp" >> .env.local

# Opción B: Copiar el template
cp .env.local.docker .env.local
# Luego editar según necesites
```

**Nota**: Por defecto, la app usa Supabase Cloud para Auth. Si querés usar PostgreSQL local para TODO, necesitarás configurar auth manualmente.

### 4️⃣ Aplicar Migrations

Las migrations se aplican automáticamente al iniciar PostgreSQL, pero si agregás nuevas:

```bash
# Ver qué migrations hay
ls supabase/migrations/

# Aplicar manualmente una migration
docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp -f /docker-entrypoint-initdb.d/20240126000001_initial_schema.sql

# O resetear DB completa
docker-compose -f docker-compose.db.yml down -v
docker-compose -f docker-compose.db.yml up -d
```

### 5️⃣ Iniciar Next.js

```bash
# Desarrollo normal
pnpm dev

# Build de producción (testing)
pnpm build
pnpm start
```

---

## 🌐 URLs y Puertos

| Servicio | URL/Puerto | Usuario | Password |
|----------|------------|---------|----------|
| **Next.js** | http://localhost:3000 | - | - |
| **PostgreSQL** | localhost:5433 | postgres | postgres |
| **Adminer (UI)** | http://localhost:8080 | postgres | postgres |

**Connection String**:
```
postgresql://postgres:postgres@localhost:5433/studyapp
```

---

## 🛠️ Comandos Útiles

### Gestión de PostgreSQL

```bash
# Iniciar
./start-db.sh
# O:
docker-compose -f docker-compose.db.yml up -d

# Detener
docker-compose -f docker-compose.db.yml stop

# Detener y eliminar (conserva datos)
docker-compose -f docker-compose.db.yml down

# Reset COMPLETO (elimina datos)
docker-compose -f docker-compose.db.yml down -v

# Ver logs
docker-compose -f docker-compose.db.yml logs -f db

# Ver estado
docker-compose -f docker-compose.db.yml ps
```

### Conectarse a PostgreSQL

```bash
# Con psql desde Docker
docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp

# Con cliente local (si tenés psql instalado)
psql -h localhost -p 5433 -U postgres -d studyapp
# Password: postgres

# Comandos útiles dentro de psql:
\dt                    # Listar tablas
\d+ users              # Ver estructura de tabla
SELECT * FROM users;   # Query
\q                     # Salir
```

### Backup y Restore

```bash
# Backup
docker-compose -f docker-compose.db.yml exec db pg_dump -U postgres studyapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose -f docker-compose.db.yml exec -T db psql -U postgres studyapp < backup.sql
```

---

## 🔄 Workflows Comunes

### Desarrollo Normal

```bash
# Terminal 1: PostgreSQL
./start-db.sh

# Terminal 2: Next.js
pnpm dev

# Desarrollar normalmente...
```

### Agregar Nueva Migration

```bash
# 1. Crear migration en supabase/migrations/
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_nueva_feature.sql

# 2. Editar y agregar SQL
code supabase/migrations/...

# 3. Aplicar (opción A: restart DB)
docker-compose -f docker-compose.db.yml restart db

# 3. Aplicar (opción B: manual)
docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp -f /docker-entrypoint-initdb.d/nueva_feature.sql
```

### Reset de Base de Datos

```bash
# Eliminar TODO y empezar de cero
docker-compose -f docker-compose.db.yml down -v
./start-db.sh

# Las migrations se aplican automáticamente
```

### Cambiar entre Supabase Cloud y Local

```bash
# Usar Supabase Cloud (producción)
# En .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://uoqgyvscgxrlwdhmpogv.supabase.co
# Detener DB local si querés:
docker-compose -f docker-compose.db.yml down

# Usar PostgreSQL Local (Docker)
# En .env.local agregar:
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/studyapp
# Iniciar DB:
./start-db.sh
```

---

## 🐛 Troubleshooting

### Puerto 5433 ocupado

```bash
# Ver qué usa el puerto
lsof -i :5433

# Matar proceso
kill -9 <PID>

# O cambiar el puerto en docker-compose.db.yml
# Línea: "5433:5432" → "5434:5432"
```

### PostgreSQL no inicia

```bash
# Ver logs completos
docker-compose -f docker-compose.db.yml logs db

# Reset completo
docker-compose -f docker-compose.db.yml down -v
docker volume rm studyapp_postgres-data
./start-db.sh
```

### Migrations no se aplican

```bash
# Verificar que estén en la carpeta correcta
ls -la supabase/migrations/

# Ver si hay errores en logs
docker-compose -f docker-compose.db.yml logs db | grep ERROR

# Aplicar manualmente
docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp -f /docker-entrypoint-initdb.d/<migration>.sql
```

### No se puede conectar desde Next.js

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose -f docker-compose.db.yml ps

# Verificar conexión
docker-compose -f docker-compose.db.yml exec db psql -U postgres -d studyapp -c "SELECT version();"

# Verificar .env.local tiene el connection string correcto
cat .env.local | grep DATABASE_URL
```

---

## ⚖️ Comparación: Supabase Local vs PostgreSQL Docker

| Feature | Supabase Local | PostgreSQL Docker |
|---------|----------------|-------------------|
| Auth | ✅ Incluido | ❌ Manual |
| Storage | ✅ Incluido | ❌ Manual |
| Realtime | ✅ Incluido | ❌ Manual |
| Simpleza | 🟡 Más servicios | ✅ Solo DB |
| Velocidad | 🟡 Más pesado | ✅ Más rápido |
| Recursos | 🟡 ~1GB RAM | ✅ ~200MB RAM |
| Uso | Testing completo | Dev rápido |

**Recomendación**: 
- **Desarrollo rápido**: PostgreSQL Docker (este setup)
- **Testing de auth/storage**: Supabase local (`supabase start`)
- **Producción**: Supabase Cloud

---

## ✅ Checklist

Después de setup:

- [ ] `./start-db.sh` ejecutado sin errores
- [ ] `docker-compose -f docker-compose.db.yml ps` muestra db UP
- [ ] http://localhost:8080 muestra Adminer
- [ ] `pnpm dev` inicia sin errores
- [ ] http://localhost:3000 carga la app
- [ ] Podés registrarte/loguearte

---

## 📚 Próximos Pasos

1. **Desarrollar**: Todo funciona con hot reload nativo
2. **Migrations**: Agregar en `supabase/migrations/`
3. **Testing**: Reset DB cuando necesites con `down -v`
4. **Producción**: Usar Supabase Cloud (ya configurado)

---

**¿Dudas?** Ver logs con `docker-compose -f docker-compose.db.yml logs -f`
