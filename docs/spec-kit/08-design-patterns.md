# 8. Design Patterns

> **Version**: 2.0.0 (Actualizada con implementación real)
> **Fecha**: 28 Enero 2026
> **Stack**: NestJS (conceptos) + Next.js (implementación)

Este documento detalla los patrones de diseño **realmente implementados** en el código base, reemplazando ejemplos teóricos con referencias concretas al proyecto.

---

## 8.1 SOLID Principles

### Single Responsibility Principle (SRP)

✅ **Estado**: Bien implementado

Cada módulo y función tiene una única razón para cambiar.

**Ejemplo Real: Authentication**
El archivo `auth.ts` solo maneja lógica de autenticación, delegando a Supabase.

```typescript
// src/lib/actions/auth.ts
export async function logoutUser() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  redirect('/login');
}
```

**Ejemplo Real: Services**
Separación clara entre cálculo y generación:
- `priority-calculator.ts`: SOLO calcula scores (función pura)
- `session-generator.ts`: SOLO genera objetos de sesión

### Open/Closed Principle (OCP)

🟡 **Estado**: Parcialmente implementado

El sistema es extensible en puntos clave sin modificar código existente.

**Ejemplo Real: Session Modes**
La función `determineMode` permite agregar nuevos modos de estudio (ej: `RECOVERY_MODE`) sin romper los existentes.

```typescript
// src/lib/services/session-generator.ts
function determineMode(exam: Exam | null, source: string): 'PARCIAL' | 'FREE_STUDY' {
  if (source === 'FREE_STUDY' || (exam && exam.type.startsWith('FINAL_'))) {
    return 'FREE_STUDY';
  }
  return 'PARCIAL';
}
```

### Liskov Substitution Principle (LSP)

⚪ **Estado**: No aplica (Programación Funcional)
El proyecto usa un enfoque funcional con composición en lugar de herencia de clases, por lo que LSP no es relevante en su forma tradicional.

### Interface Segregation Principle (ISP)

✅ **Estado**: Bien implementado

Las interfaces de TypeScript son pequeñas y específicas.

**Ejemplo Real: Types**
```typescript
// src/lib/validations/topics.ts
export interface Topic {
  id: string;
  name: string;
  // ... campos específicos de topic
}

// src/lib/services/session-generator.ts
export interface SessionToCreate {
  // Solo los campos necesarios para crear una sesión
  scheduled_at: string;
  duration: number;
  // ...
}
```

### Dependency Inversion Principle (DIP)

✅ **Estado**: Bien implementado

Las "Server Actions" (alto nivel) dependen de "Services" (abstracciones), no de detalles de implementación.

**Ejemplo Real: Actions → Services**
```typescript
// src/lib/actions/sessions.ts (Action)
import { generateSessionsForTopic } from '@/lib/services/session-generator'; // (Service)

export async function generateSessions(topicId: string) {
  // ... obtiene datos ...
  const sessions = await generateSessionsForTopic(topic, exam, user.id);
  // ... persiste datos ...
}
```

---

## 8.2 GRASP Patterns

### Information Expert

✅ **Estado**: Bien implementado

La lógica está donde están los datos necesarios.

**Ejemplo Real: Exams Action**
La función `convertTopicsToFinal` está en `exams.ts` porque es quien conoce cuándo se crea un final y tiene acceso a los topics relacionados.

```typescript
// src/lib/actions/exams.ts
async function convertTopicsToFinal(finalExamId: string, subjectId: string) {
  // Tiene la info necesaria para coordinar el cambio
  const { data: topics } = await supabase...
  // ... actualiza topics ...
}
```

### Controller

✅ **Estado**: Implementado en Server Actions

Las Server Actions actúan como controladores que orquestan:
1. Validación (Zod)
2. Autenticación (Supabase Auth)
3. Autorización (Ownership check)
4. Lógica de negocio (Services)
5. Persistencia (DB)
6. Respuesta (UI update)

**Ejemplo Real: Topic Creation**
```typescript
// src/lib/actions/topics.ts
export async function createTopic(input: CreateTopicInput) {
  // 1. Valida input
  const result = createTopicSchema.safeParse(input);
  
  // 2. Verifica usuario
  const { data: { user } } = await supabase.auth.getUser();
  
  // 3. Verifica permisos
  const { data: subject } = await supabase...
  
  // 4. Persiste
  const { data: topic } = await supabase.from('topics').insert(...)
  
  // 5. Trigger lógica de negocio
  if (topic.source_date) {
    await generateSessions(topic.id);
  }
}
```

### Low Coupling

✅ **Estado**: Bien logrado

Las capas están desacopladas:
- `Services` no saben de `Supabase` ni `Next.js`
- `Components` no saben de `Services` (solo llaman Actions)
- `Actions` son el único punto de acoplamiento (necesario)

### High Cohesion

✅ **Estado**: Excelente

Archivos organizados por dominio funcional:
- `actions/subjects.ts`: Todo lo relacionado a materias
- `actions/exams.ts`: Todo lo relacionado a exámenes
- `actions/sessions.ts`: Todo lo relacionado a sesiones

---

## 8.3 GOF Patterns (Gang of Four)

### Strategy Pattern

✅ **Estado**: Implementación Funcional

Se utiliza para seleccionar el algoritmo de generación de sesiones.

**Implementación**: `src/lib/services/session-generator.ts`

```typescript
// Selector de estrategia
const mode = determineMode(exam, topic.source);

// Ejecución de estrategia
if (mode === 'FREE_STUDY') {
  return generateFreeStudySessions(topic, exam, userId);
} else {
  return generateParcialSessions(topic, exam, userId);
}
```

### Template Method

✅ **Estado**: Implementación Funcional

Todas las Server Actions siguen una estructura (plantilla) común:

1. `createClient()`
2. `getUser()`
3. `validation`
4. `db operation`
5. `revalidatePath()`
6. `return { success/error }`

### Facade Pattern

✅ **Estado**: Implementado

`getDashboardData()` actúa como una fachada que simplifica múltiples llamadas complejas a la base de datos en una sola interfaz simple para el cliente.

```typescript
// src/lib/actions/dashboard.ts
export async function getDashboardData() {
  // Oculta la complejidad de:
  // - 4 queries paralelos
  // - Cálculo de estadísticas
  // - Formateo de fechas
  // - Filtrado en memoria
  return { stats, subjects, topics, sessions };
}
```

### Command Pattern

✅ **Estado**: Implícito

Cada Server Action es, efectivamente, un comando encapsulado que puede ser ejecutado desde la UI (client) pero corre en el servidor.

---

## 8.6 React Patterns

### Component Composition

✅ **Estado**: Patrón Principal de UI

Construcción de UIs complejas a partir de componentes simples.

**Ejemplo Real:**
```typescript
// Page (Container)
// └── SessionList (Listado)
//      └── SessionCard (Item individual)
//           ├── Badge (Prioridad)
//           └── Actions (Botones)
```

Código:
```typescript
// src/components/features/sessions/session-list.tsx
export function SessionList({ sessions, ...props }) {
  return (
    <div className="grid gap-4">
      {sessions.map(session => (
        <SessionCard key={session.id} session={session} {...props} />
      ))}
    </div>
  )
}
```

### Container / Presentational

✅ **Estado**: Bien Separado

**Containers (Smart):**
- Pages (`src/app/**/page.tsx`)
- Clients (`dashboard-client.tsx`, `sessions-client.tsx`)
- Manejan: Estado, Efectos, Fetching, Filtrado

**Presentational (Dumb):**
- Components (`src/components/features/**`)
- Manejan: Renderizado, Props, Callbacks
- No tienen dependencias externas (salvo UI libs)

**Ejemplo Real:**
`SessionsClient` (Smart) maneja el estado de los filtros y pasa los datos filtrados a `SessionList` (Dumb).

### Props Drilling

🟡 **Estado**: Controlado (Max 3 niveles)

Actualmente pasamos callbacks a través de 2-3 niveles:
`Page` → `List` → `Card` → `Button`

**Evaluación**: Aceptable para la complejidad actual. No justifica Context API todavía.

---

## 8.7 Architecture Patterns

### Layered Architecture

✅ **Estado**: Implementación Estricta

El proyecto sigue una arquitectura de 4 capas:

1. **Presentation Layer**: `src/components/`
   - UI pura, React components
   
2. **Application Layer**: `src/app/`
   - Routing, Pages, Client Wrappers, State Management
   
3. **Data Access Layer**: `src/lib/actions/`
   - Server Actions, Supabase calls, Validations
   
4. **Domain/Service Layer**: `src/lib/services/`
   - Business Logic pura (algoritmos), sin dependencias de framework

### Service Layer Pattern

✅ **Estado**: Core del Sistema

La lógica compleja (generación de sesiones, cálculo de prioridades) está aislada en servicios puros.

**Ventajas logradas:**
- 100% Testeabilidad (56 unit tests en esta capa)
- Portabilidad (se puede mover a otro framework)
- Claridad (se lee como especificación)

---

## 8.8 Gaps & Recommendations

### Gaps Identificados

| Patrón | Estado | Recomendación |
|--------|--------|---------------|
| **Custom Hooks** | ❌ Faltante | Extraer lógica de `SessionsClient` a `useSessions` |
| **Error Boundary** | ❌ Faltante | Implementar boundaries globales y por widget |
| **Repository** | ❌ Faltante | Queries de Supabase están hardcodeados en Actions |
| **Optimistic UI** | 🟡 Parcial | Usado en algunos botones, pero podría extenderse |

### Recomendaciones a Futuro

1. **Implementar Repository Pattern**:
   Para desacoplar las Actions de Supabase directamente.
   ```typescript
   // src/lib/repositories/sessions.repo.ts
   export class SessionsRepo {
     async findUpcoming(userId: string) { ... }
   }
   ```

2. **Crear Custom Hooks**:
   Para limpiar los Client Components grandes.
   ```typescript
   // src/hooks/useSessions.ts
   export function useSessions() {
     const [data, setData] = useState(...);
     // ... lógica de filtrado ...
     return { data, filters, setFilters };
   }
   ```

3. **Mejorar Optimistic Updates**:
   Usar `useOptimistic` de React 18 para feedback instantáneo en completar sesiones.

---

_Última actualización: 28 Enero 2026_
