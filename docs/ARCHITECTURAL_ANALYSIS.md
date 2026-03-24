# Análisis Arquitectónico: StudyApp (Layered & Modular)

> **Estado: ✅ IMPLEMENTADO** — Refactoring completado en commits `7f4091e` (Fases 0-1) y `af03797` (Fases 2-5).  
> Ver plan de ejecución completo en [`docs/REFACTORING_PLAN.md`](REFACTORING_PLAN.md).  
> Ver arquitectura actualizada en [`docs/spec-kit/03-architecture.md`](spec-kit/03-architecture.md).

---

## 1. Situación Anterior y Puntos Críticos (Pre-Refactoring)

### 1.1. Deuda Técnica y Acoplamiento (Coupling)
- **Server Actions como Controladores Obesos**: Las acciones en `src/lib/actions` manejan demasiadas responsabilidades simultáneamente: autenticación, validación de esquemas (Zod), lógica de negocio compleja y consultas directas a Supabase (SQL/PostgreSQL).
- **Servicios Dependientes de Infraestructura**: Los servicios de lógica de negocio (como `session-generator.ts` o `priority-calculator.ts`) importan `createClient` de Supabase directamente. Esto impide testear la lógica de algoritmos (como la repetición espaciada) sin una base de datos real o mocks complejos, y acopla el negocio al proveedor de datos.
- **Inconsistencia en la Organización de Módulos**: Mientras que la UI (`src/components/features`) está bien organizada por módulos de negocio (subjects, sessions, topics), la lógica de backend en `src/lib/actions` y `src/lib/services` es una lista plana de archivos difícil de navegar a medida que el proyecto crece.

### 1.2. Client vs Server Components
Se ha detectado que páginas principales del dashboard (como `src/app/(dashboard)/dashboard/subjects/page.tsx`) están marcadas con `'use client'` y utilizan `useEffect` para el fetch inicial de datos. 
- **Problema**: Esto genera "flickeo" de UI al cargar (loading states manuales), aumenta el bundle size que se envía al navegador y desaprovecha la potente caché de Next.js y los beneficios de los React Server Components (RSC) para el SEO y rendimiento.
- **Mejora Propuesta**: Migrar las rutas principales a RSC para el fetch de datos del lado del servidor y pasar los resultados a componentes hijos "puros" o interactivos solo cuando sea estrictamente necesario (filtros complejos, modales, formularios).

---

## 2. Propuesta: Arquitectura de 4 Capas Modular

Se propone reorganizar la lógica bajo un esquema de **4 capas**, agrupadas físicamente por **módulos de negocio**.

### 2.1. Definición de las Capas
1.  **Capa de Presentación (Presentation)**:
    - `src/app/**`: Páginas (RSCs) que actúan como orquestadores de alto nivel para el fetch de datos y el layout.
    - `src/components/features/[module]`: Componentes de UI que reciben datos y manejan la interacción del usuario.
2.  **Capa de Aplicación (Application)**:
    - `src/lib/actions/[module]`: Server Actions delgados. Su única responsabilidad es: validar el input con Zod, verificar la sesión del usuario y llamar a los servicios o repositorios correspondientes.
3.  **Capa de Dominio (Domain)**:
    - `src/lib/services/[module]`: Lógica de negocio pura. Algoritmos de repetición espaciada, cálculos de prioridad, transformaciones de dominio. Estos archivos NO deben importar el cliente de Supabase; operan sobre objetos de datos planos.
4.  **Capa de Infraestructura/Persistencia (Infrastructure)**:
    - `src/lib/repositories/[module]`: Único lugar donde se permite el uso directo de `supabase.from('...')`. Abstraen las tablas y consultas de la base de datos, retornando tipos de dominio limpios.

### 2.2. Nueva Estructura de Carpetas Sugerida

```text
src/
├── app/ (Páginas RSC)
├── components/features/ (Organizado por módulo)
│   ├── subjects/
│   ├── sessions/
│   └── ...
├── lib/
│   ├── actions/ (Capa de Aplicación - Agrupada por Módulo)
│   │   ├── subjects/
│   │   │   ├── actions.ts (Server Actions del módulo)
│   │   │   └── index.ts
│   │   └── ...
│   ├── services/ (Capa de Dominio - Lógica Pura)
│   │   ├── sessions/
│   │   │   ├── session-generator.service.ts
│   │   │   └── priority.service.ts
│   │   └── ...
│   ├── repositories/ (Capa de Infraestructura - DB)
│   │   ├── subjects/
│   │   │   └── subjects.repository.ts
│   │   └── ...
│   └── supabase/ (Shared Client)
```

---

## 3. Guía de Implementación y Reglas

### Regla de Oro: Flujo de Dependencias Unidireccional
`Presentación -> Aplicación -> Dominio -> Infraestructura`

- **¿Dónde va el código de Supabase?** EXCLUSIVAMENTE en `repositories/`.
- **¿Dónde va el algoritmo de repetición espaciada?** En `services/`.
- **¿Dónde va `revalidatePath`?** En `actions/`.
- **¿Cómo cargar datos de forma eficiente?** 
  1. La página (RSC en `src/app/`) llama a una función del Repositorio o Acción (Application) para obtener datos.
  2. Pasa esos datos pre-procesados al Componente de UI en `src/components/features/`.

---

## 4. Ejemplo de Refactorización: Módulo de Subjects

### Situación Actual (Action Obesa):
```typescript
// src/lib/actions/subjects.ts
export async function getSubjects() {
  const supabase = await createClient(); // Acoplamiento a Infra
  const { data } = await supabase.from('subjects').select('*'); // Consulta directa
  // Lógica de cálculo de progreso mezclada aquí mismo...
  return data;
}
```

### Situación Propuesta (Modular y en Capas):
1. **Repository**: `src/lib/repositories/subjects/subjects.repository.ts` (Solo SELECT/INSERT/UPDATE de la tabla subjects).
2. **Service**: `src/lib/services/subjects/progress.service.ts` (Función pura que recibe sesiones y calcula el % de progreso).
3. **Action**: `src/lib/actions/subjects/actions.ts` (Valida auth y coordina el repo + service).
4. **Page**: `src/app/dashboard/subjects/page.tsx` (RSC que obtiene la data y la inyecta en el cliente).

---

## 5. Veredicto Final

> ✅ **Implementado.** La arquitectura de 4 capas está en producción.

La arquitectura anterior era funcional pero frágil ante el crecimiento. La implementación de este esquema de capas modular (completada en Sprint 4) permitirá desarrollar los próximos Sprints (Gamificación, Analytics) con total confianza, manteniendo el código testeable, desacoplado y fácil de entender.

**Resultado medible post-refactoring:**
- 0 llamadas a `supabase.from()` fuera de `src/lib/repositories/`
- Services 100% puros y testeables sin mock de DB
- RSC para todas las páginas de datos (sin `useEffect` de carga inicial)
- Helper `getAuthenticatedUser()` elimina boilerplate repetido en 11+ actions
