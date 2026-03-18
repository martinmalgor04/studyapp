# Error Handling & Loading States Specification

**Prioridad:** Alta (Technical Debt)  
**Estado:** Pendiente  
**Estimación:** 4-6 horas

---

## 1. Objetivo

Implementar error boundaries y loading states a nivel de rutas en Next.js 14 App Router para:
- Capturar errores de forma elegante
- Mejorar perceived performance con skeletons
- Proporcionar feedback claro al usuario
- Evitar pantallas blancas o crashes visibles

---

## 2. Next.js 14 App Router Conventions

### 2.1 Error Boundaries (`error.tsx`)

Next.js genera automáticamente error boundaries de React para cada `error.tsx`:

- Captura errores en **componentes hijos** (server + client)
- **No** captura errores en `layout.tsx` del mismo nivel
- Para errores en layout, usar `global-error.tsx` en root

### 2.2 Loading UI (`loading.tsx`)

- Se muestra mientras el contenido suspendido se carga
- Envuelve automáticamente `page.tsx` en `<Suspense>`
- Útil para streaming SSR y data fetching

---

## 3. Estrategia de Implementación

### 3.1 Niveles de Error Handling

```
src/app/
├── global-error.tsx          # Errores críticos (layout root)
├── error.tsx                 # Errores generales de app
├── (auth)/
│   ├── error.tsx            # Errores de autenticación
│   └── loading.tsx          # Loading auth pages
└── (dashboard)/
    ├── error.tsx            # Errores en dashboard
    ├── loading.tsx          # Loading dashboard
    └── dashboard/
        ├── subjects/
        │   ├── error.tsx    # Errores específicos de subjects
        │   └── loading.tsx  # Loading lista de subjects
        ├── sessions/
        │   ├── error.tsx    # Errores específicos de sessions
        │   └── loading.tsx  # Loading lista de sessions
        └── settings/
            └── loading.tsx  # Loading settings
```

---

## 4. Implementación User-Friendly

### 4.1 Global Error (`global-error.tsx`)

Captura errores en root layout (muy raros):

```typescript
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado. Por favor, intentá nuevamente.
            </p>

            <button
              onClick={reset}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="mt-3 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### 4.2 App Error (`src/app/error.tsx`)

Error general de aplicación:

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error (futuro: enviar a Sentry si se activa)
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Ups, algo falló
        </h2>

        <p className="text-gray-600 mb-8">
          No pudimos cargar esta página correctamente. Intentá recargar o volver al inicio.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reintentar
          </button>

          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="w-full rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Dashboard Error (`src/app/(dashboard)/error.tsx`)

Error específico del dashboard (más contexto):

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
          <svg
            className="h-8 w-8 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Error al cargar el dashboard
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Hubo un problema al cargar tus datos. Verificá tu conexión e intentá nuevamente.
        </p>

        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>

          <Link
            href="/dashboard"
            className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Detalles técnicos (dev only)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
```

### 4.4 Feature-Specific Errors

**Ejemplo:** `src/app/(dashboard)/dashboard/subjects/error.tsx`

```typescript
'use client';

export default function SubjectsError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Error al cargar materias
      </h3>
      <p className="text-sm text-red-700 mb-4">
        No pudimos obtener la lista de materias. Verificá tu conexión.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}
```

---

## 5. Loading States

### 5.1 Dashboard Loading (`src/app/(dashboard)/loading.tsx`)

```typescript
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.2 Subjects List Loading (`src/app/(dashboard)/dashboard/subjects/loading.tsx`)

```typescript
export default function SubjectsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 Sessions Loading (`src/app/(dashboard)/dashboard/sessions/loading.tsx`)

```typescript
export default function SessionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Progress card skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="flex items-center gap-6">
          <div className="h-32 w-32 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded"></div>
            <div className="h-4 w-full bg-gray-100 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}
```

---

## 6. Componente Reutilizable: LoadingSpinner

```typescript
// src/components/ui/loading-spinner.tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}
      ></div>
    </div>
  );
}
```

---

## 7. Best Practices

### 7.1 Error Messages

✅ **Hacer:**
- Mensajes claros y user-friendly
- Ofrecer acciones concretas (reintentar, volver)
- Mostrar detalles técnicos solo en dev

❌ **Evitar:**
- Mostrar stack traces en producción
- Mensajes técnicos confusos
- Pantallas blancas sin feedback

### 7.2 Loading States

✅ **Hacer:**
- Skeletons que coincidan con layout real
- Indicar progreso cuando sea posible
- Mantener estructura visual consistente

❌ **Evitar:**
- Spinners genéricos para todo
- Cambios bruscos de layout al cargar
- Loading states que duran menos de 200ms (flash)

### 7.3 Performance

- Usar `loading.tsx` para instant loading states
- Suspense boundaries estratégicos
- Precargar data crítica en layouts

---

## 8. Testing

### 8.1 Test Manual de Errors

```typescript
// Forzar error para testing
// En cualquier page.tsx:
export default function TestPage() {
  throw new Error('Test error boundary');
  return <div>Never renders</div>;
}
```

### 8.2 Test de Loading States

```typescript
// En page.tsx, agregar delay artificial
export default async function Page() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return <div>Content</div>;
}
```

---

## 9. Checklist de Implementación

- [ ] Crear `global-error.tsx` en root
- [ ] Crear `error.tsx` en root
- [ ] Crear `error.tsx` en `(dashboard)/`
- [ ] Crear `loading.tsx` en `(dashboard)/`
- [ ] Crear `loading.tsx` en `dashboard/subjects/`
- [ ] Crear `loading.tsx` en `dashboard/sessions/`
- [ ] Crear `loading.tsx` en `dashboard/settings/`
- [ ] Crear componente `LoadingSpinner` reutilizable
- [ ] Test manual: forzar errores y verificar UI
- [ ] Test manual: verificar loading states con network throttling
- [ ] Documentar en README el manejo de errores

---

**Tiempo estimado:** 4-6 horas  
**Bloqueadores:** Ninguno  
**Prioridad:** Alta (mejora UX significativa)
