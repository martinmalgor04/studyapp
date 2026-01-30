# 🎯 Próximos Pasos

La migración a Next.js + Supabase está completa. Acá están los siguientes pasos para continuar con el desarrollo.

## ✅ Completado

- ✅ Estructura del proyecto reestructurada
- ✅ Supabase configurado con schema completo
- ✅ Sistema de autenticación implementado
- ✅ Row Level Security configurado
- ✅ Middleware de protección de rutas
- ✅ Páginas de login y register
- ✅ Dashboard base

## 🚀 Siguiente: Setup y Prueba

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Iniciar Supabase Local

**Opción A: Con Supabase CLI (Recomendado)**

```bash
# Instalar CLI si no lo tienes
brew install supabase/tap/supabase

# Iniciar servicios
supabase start
```

Copiar las keys que aparecen a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key-de-la-consola>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Opción B: Usar Supabase Cloud**

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a Settings → API
3. Copiar URL y anon key a `.env.local`
4. Aplicar migraciones:

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

### 3. Iniciar Next.js

```bash
pnpm dev
```

Abre http://localhost:3000

### 4. Probar Autenticación

1. Ir a http://localhost:3000/register
2. Crear una cuenta (ejemplo: `test@test.com` / `password123`)
3. Deberías ser redirigido a `/dashboard`
4. Ver en Supabase Studio (http://localhost:54323) que se creó el usuario

## 📋 Roadmap de Desarrollo

### Sprint 1 (Actual): Setup + Auth ✅

- ✅ Configuración de Supabase
- ✅ Schema de base de datos
- ✅ Autenticación básica
- ✅ Dashboard vacío

### Sprint 2: CRUD Core (Semana 1-2)

Implementar las entidades principales:

#### 1. Subjects (Materias)

**Archivos a crear:**

```
src/
├── app/(dashboard)/
│   └── subjects/
│       ├── page.tsx                    # Lista de materias
│       ├── [id]/page.tsx               # Detalle de materia
│       └── new/page.tsx                # Crear materia
├── components/features/subjects/
│   ├── subject-list.tsx
│   ├── subject-form.tsx
│   └── subject-card.tsx
├── lib/services/
│   └── subjects.service.ts             # Lógica de negocio
└── app/api/subjects/
    ├── route.ts                        # GET, POST
    └── [id]/route.ts                   # GET, PUT, DELETE
```

**Schema ya creado en:**
- `supabase/migrations/20240126000001_initial_schema.sql` (tabla `subjects`)

**Acciones:**
- Crear Subject (nombre, descripción)
- Listar Subjects del usuario
- Editar Subject
- Archivar Subject (soft delete con `is_active`)

#### 2. Exams (Exámenes)

**Archivos a crear:**

```
src/
├── app/(dashboard)/subjects/[id]/
│   └── exams/
│       ├── page.tsx                    # Lista de exámenes
│       └── new/page.tsx                # Crear examen
├── components/features/exams/
│   ├── exam-list.tsx
│   ├── exam-form.tsx
│   └── exam-card.tsx
└── lib/services/
    └── exams.service.ts
```

**Campos:**
- Tipo (Parcial Theory/Practice, Recuperatorio, Final)
- Número de parcial
- Fecha del examen
- Descripción

#### 3. Topics (Temas)

**Archivos a crear:**

```
src/
├── app/(dashboard)/subjects/[id]/
│   └── topics/
│       ├── page.tsx                    # Lista de temas
│       └── new/page.tsx                # Crear tema
├── components/features/topics/
│   ├── topic-list.tsx
│   ├── topic-form.tsx
│   └── topic-card.tsx
└── lib/services/
    └── topics.service.ts
```

**Campos:**
- Nombre del tema
- Dificultad (Easy, Medium, Hard)
- Horas de estudio
- Source (Class, Free Study, Program)
- Fecha de la clase (opcional)
- Vínculo con examen

**🎯 Objetivo Sprint 2:** Usuario puede crear materias, exámenes y temas.

### Sprint 3: Session Generator (Semana 3)

Implementar el algoritmo de generación de sesiones basado en Spaced Repetition.

**Archivos a crear:**

```
src/lib/services/
├── session-generator.service.ts        # Algoritmo principal
├── priority-calculator.service.ts      # Cálculo de prioridad
├── slot-finder.service.ts              # Búsqueda de huecos libres
└── spaced-repetition.service.ts        # Lógica de intervalos
```

**Lógica:**

1. Cuando se crea un Topic, automáticamente generar sesiones:
   - Según dificultad (fácil: 4 repasos, medio: 5, difícil: 6)
   - Con intervalos definidos (ver [`docs/spec-kit/`](docs/spec-kit/08-design-patterns.md))
   - Calculando prioridad según fecha del examen

2. Buscar huecos libres en el calendario:
   - Evitar superposiciones
   - Considerar energía circadiana (mejor 15-18h)
   - Respetar horarios configurados por usuario

**🎯 Objetivo Sprint 3:** Crear un tema genera automáticamente sesiones de repaso optimizadas.

### Sprint 4: Dashboard & Polish (Semana 4)

Mejorar el dashboard con visualización de sesiones.

**Features:**

- Vista del día: sesiones de hoy
- Vista semanal: calendario con sesiones
- Filtros por materia, prioridad
- Marcar sesiones como completadas
- Estadísticas básicas (completitud, rachas)

**Componentes:**

```
src/components/features/dashboard/
├── today-sessions.tsx
├── week-calendar.tsx
├── session-card.tsx
├── stats-overview.tsx
└── quick-actions.tsx
```

**🎯 Objetivo Sprint 4:** Dashboard funcional donde el usuario ve y gestiona sus sesiones.

---

## 📚 Recursos Útiles

### Documentación del Proyecto

- [`docs/spec-kit/00-index.md`](docs/spec-kit/00-index.md) - Índice de documentación
- [`docs/spec-kit/05-use-cases.md`](docs/spec-kit/05-use-cases.md) - Casos de uso detallados
- [`docs/spec-kit/08-design-patterns.md`](docs/spec-kit/08-design-patterns.md) - Patrones de diseño aplicados
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) - Guía detallada de Supabase

### Stack

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase + Next.js Tutorial](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)

### Algoritmos Clave

Ver la documentación original de N8N en [`docs/`](docs/) para entender:
- Intervalos de repetición espaciada
- Cálculo de prioridad
- Búsqueda de huecos libres
- Energía circadiana

---

## 🐛 Si algo falla

### Error: "Supabase URL not defined"

Verificar que `.env.local` existe y tiene las variables correctas.

### Error al crear usuario

1. Verificar que Supabase está corriendo: `supabase status`
2. Verificar que la migración se aplicó: abrir Studio → ver tabla `users`
3. Ver logs en la consola de Next.js

### Error de tipos TypeScript

Regenerar tipos:

```bash
pnpm db:types
```

### Base de datos vacía

Resetear y aplicar migraciones:

```bash
supabase db reset
```

---

## 💡 Tips

1. **Usar Supabase Studio**: Es tu mejor amigo para explorar datos y políticas RLS
2. **Server Actions**: Para mutaciones simples, usar Server Actions en vez de API Routes
3. **RLS**: Ya está configurado, cada usuario solo ve sus datos
4. **Tipos**: Regenerar tipos (`pnpm db:types`) cada vez que cambies el schema
5. **Git**: Hacer commits pequeños y frecuentes

---

¿Listo para empezar? 🚀

```bash
pnpm install
supabase start  # o configurar cloud
pnpm dev
```
