# Plan de Nuevos Sprints — StudyApp v2.0

> Documento de planificación para los sprints 5-10, priorizando usabilidad e inteligencia antes de gamificación.
> Generado: 2026-03-30

---

## Estructura de Sprints (Reordenada)

| Sprint | Nombre | Estimación | Prioridad |
|--------|--------|-----------|-----------|
| **5** | **Rediseño Visual — Estética Claude** | ~40h | Alta — base visual para todo lo demás |
| **6** | **Onboarding Inteligente** | ~55h | Alta — game changer de usabilidad |
| **7** | **Procesamiento IA de PDFs** | ~45h | Alta — inteligencia de la app |
| **8** | **Dark Mode** | ~8h | Media — post-rediseño |
| **9** | **Gamificación** (ex Sprint 5) | ~26h | Media |
| **10** | **Analytics + Tasks** (ex Sprint 6) | ~40h | Media |

**Justificación del orden:**
- El rediseño va PRIMERO para que el onboarding nazca con la estética correcta.
- El onboarding inteligente es el feature más impactante para UX.
- El procesamiento IA complementa el onboarding (sin IA, el onboarding funciona con ingreso manual).
- Dark mode requiere que el design system ya exista.
- Gamificación y analytics son features de fidelización que se benefician de la base visual y funcional.

---

## Sprint 5 — Rediseño Visual "Estética Claude"

### Objetivo
> Transformar toda la app a una estética clean, moderna, tipo Claude: colores pasteles, tipografía serif limpia, mucho espacio en blanco, animaciones sutiles.

### Decisiones de diseño (definidas en Stitch — ver `docs/design/DESIGN_SYSTEM.md`)
- **Identidad:** "The Curator" — Academic Session (tono editorial, académico)
- **Layout:** Sidebar only — SIN top header/navbar. Contenido usa ancho completo.
- **Paleta:** Material Design 3 adaptada — cream `#fbf9f6`, sage green `#546357`, muted indigo `#4e5d91`, warm gray `#5f5e5e`
- **Tipografía:** Newsreader (serif) para headings/quotes + Inter (sans-serif) para body/labels
- **Iconos:** Google Material Symbols Outlined (weight 300, thin editorial look)
- **Bordes:** Muy sutiles (`ring-1 ring-outline-variant/10`), border-radius variados
- **Animaciones:** `translate-x-1` en hover nav, `transition-all duration-300`, `active:scale-95` en botones
- **Sombras:** Mínimas, difusas (`shadow-sm`, `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`)
- **Quotes motivacionales:** En footer de cada página (Newsreader italic)
- **"Sugerencia del Curador":** Cards con tips personalizados

---

### [5a] Design System & Tokens de Diseño
**Estimación:** 5h
**Dependencias:** Ninguna — entrada del sprint
**Archivos principales:** `tailwind.config.ts`, `src/app/globals.css`, nuevo `src/styles/tokens.css`

**Qué hacer:**
1. Definir paleta de colores completa (light mode):
   - `background`: blanco roto / cream (#FAFAF8 o similar)
   - `surface`: blanco puro (#FFFFFF)
   - `text-primary`: gris oscuro (#1A1A1A)
   - `text-secondary`: gris medio (#6B6B6B)
   - `accent`: violeta pastel (#8B5CF6 o similar al actual)
   - `success`, `warning`, `error`, `info` en tonos pastel
   - `border`: gris muy sutil (#E8E8E5)
2. Definir escala tipográfica:
   - Font families: serif para headings, sans-serif para body
   - Escala: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
   - Line heights generosos (1.6+ para body)
   - Letter spacing ajustado
3. Definir escala de espaciado extendida en Tailwind
4. Definir border-radius tokens (sm: 8px, md: 12px, lg: 16px, xl: 24px)
5. Definir sombras sutiles (shadow-sm, shadow-md)
6. Crear CSS custom properties para temas (preparando dark mode)
7. Actualizar `tailwind.config.ts` con todos los tokens

**Criterio de aceptación:**
- Tokens definidos y configurados en Tailwind
- CSS custom properties creadas para futuro dark mode
- Documentación inline de la paleta

---

### [5b] Tipografía & Componentes Base UI
**Estimación:** 8h
**Dependencias:** 5a
**Archivos principales:** `src/components/ui/*`, `src/app/globals.css`, `src/app/layout.tsx`

**Qué hacer:**
1. Instalar y configurar fuentes:
   - Evaluar: `Inter` (body) + `Lora` o `Playfair Display` (headings) — o la combinación que mejor represente el estilo
   - Configurar en `next/font` para optimización
2. Actualizar `globals.css` con nuevos estilos base (reset, typography)
3. Rediseñar componentes `src/components/ui/`:
   - **Button:** Variantes (primary, secondary, ghost, destructive) con nuevos colores y border-radius
   - **Input / Textarea:** Bordes suaves, focus ring en accent, padding generoso
   - **Select:** Consistente con inputs
   - **Badge:** Colores pastel, pill shape
   - **Card:** Borde sutil o sin borde + sombra difusa, padding generoso
   - **Dialog/Modal:** Overlay suave, animación de entrada
   - **Tabs:** Estilo underline limpio
   - **Toast:** Estilo minimal con iconos sutiles
4. Crear componente `Skeleton` para loading states si no existe
5. Asegurar que todos los componentes usan los tokens de 5a

**Criterio de aceptación:**
- Todos los componentes ui/ actualizados con nueva estética
- Tipografía aplicada globalmente
- `pnpm build` pasa sin errores

---

### [5c] Layout & Navegación
**Estimación:** 6h
**Dependencias:** 5a + 5b
**Archivos principales:** `src/components/layout/*`, `src/app/(dashboard)/layout.tsx`

**Qué hacer:**
1. Rediseñar Sidebar:
   - Fondo suave (surface color), sin bordes duros
   - Iconos más delgados (Lucide outline)
   - Hover states suaves
   - Active state con accent sutil
   - Más espacio entre items
2. Rediseñar Header/Navbar:
   - Simplificar, más aire
   - User menu con nueva estética
   - Notification bell con nueva estética
3. Animaciones de navegación:
   - Transición suave al cambiar de página
   - Sidebar collapse/expand animation
4. Mejorar responsive:
   - Mobile: bottom nav o hamburger mejorado
   - Tablet: sidebar colapsada por defecto

**Criterio de aceptación:**
- Layout completo rediseñado
- Animaciones sutiles funcionando
- Responsive correcto en mobile/tablet/desktop

---

### [5d] Rediseño de Componentes de Features
**Estimación:** 10h
**Dependencias:** 5b
**Archivos principales:** `src/components/features/**/*`

**Qué hacer:**
1. **Session Cards** (`sessions/session-card.tsx`):
   - Diseño limpio con prioridad sutil (color lateral o badge pastel)
   - Status como pill badge
   - Hover con elevación sutil
   - Preparar slot visual para `PRE_CLASS` type (Sprint 6)
2. **Subject Cards** (`subjects/subject-card.tsx`):
   - Card con borde suave, info clara
   - Progress indicator por materia si aplica
3. **Topic Cards/List** (`topics/`):
   - Lista limpia con separadores sutiles
   - Difficulty como dots (●●○) o color suave
4. **Dashboard Components** (`dashboard/`):
   - Stats cards con iconos sutiles y números grandes
   - Quick-add widget con nueva estética
   - Today's sessions section
5. **Calendar** (`shared/calendar/unified-calendar.tsx`):
   - Estilo más limpio
   - Colores pastel para eventos
   - Tooltips mejorados
6. **Notification Components** (`notifications/`):
   - Items de lista limpios
   - Bell icon con counter sutil
7. **Exam Components** (`exams/`):
   - Cards/lista consistentes con el resto

**Criterio de aceptación:**
- Todos los componentes de features actualizados
- Consistencia visual en toda la app
- Sin regresiones funcionales

---

### [5e] Forms & Dialogs
**Estimación:** 5h
**Dependencias:** 5b
**Archivos principales:** `src/components/features/*/\*-form.tsx`, `src/components/features/*/\*-dialog.tsx`

**Qué hacer:**
1. Rediseñar todos los formularios:
   - Subject form, Topic form, Exam form
   - Labels con tipografía serif
   - Inputs con nuevo estilo
   - Validación visual mejorada (errores en rojo pastel, no agresivo)
2. Rediseñar dialogs/modals:
   - Overlay semi-transparente sutil
   - Card con bordes suaves
   - Animación de entrada (scale + fade)
3. Loading states:
   - Skeleton screens donde aplique
   - Button loading states (spinner + disabled)
4. Empty states:
   - Ilustraciones o iconos sutiles
   - Texto amigable
   - CTA claro

**Criterio de aceptación:**
- Formularios y dialogs consistentes
- Loading y empty states para todas las páginas

---

### [5f] Pages — Polish Final
**Estimación:** 6h
**Dependencias:** 5c + 5d + 5e
**Archivos principales:** `src/app/(dashboard)/**/*`

**Qué hacer:**
1. **Dashboard** (`/dashboard`):
   - Layout con más aire, grid mejorado
   - Saludo personalizado sutil
   - Secciones bien definidas (Today, Stats, Recent)
2. **Subjects** (`/dashboard/subjects`, `/dashboard/subjects/[id]`):
   - Lista/grid con nueva estética
   - Detalle con tabs limpios
3. **Sessions** (`/dashboard/sessions`):
   - Filtros con nueva estética
   - Lista de sesiones rediseñada
4. **Settings** (`/dashboard/settings`):
   - Secciones con cards
   - Toggles y selects consistentes
5. **Notifications** (`/dashboard/notifications`):
   - Lista limpia con filtros
6. Verificar TODAS las páginas visualmente
7. `pnpm build` final sin errores

**Criterio de aceptación:**
- Todas las páginas con nueva estética aplicada
- Build exitoso
- Sin regresiones funcionales
- App se siente "premium" y limpia

---

## Sprint 6 — Onboarding Inteligente

### Objetivo
> Mejorar el onboarding existente agregando creación obligatoria de materia con dos caminos (cursada / estudio libre), generación de pre-clases, y un flujo reutilizable para crear materias desde el dashboard.

### Decisiones técnicas
- El wizard es multi-paso con estado local (no server-side)
- El paso de disponibilidad (actual) NO se toca, solo se mejora visualmente (ya cubierto en Sprint 5)
- El flujo de creación de materia (pasos 2+) se extrae como componente reutilizable
- Nueva columna `session_type` en tabla `sessions` (enum: `REVIEW`, `PRE_CLASS`)
- El componente de ingreso de temas es compartido entre onboarding y dashboard
- La grilla de horario de cursada reutiliza patrones del WeeklyScheduler existente

---

### [6a] Wizard Framework & Gestión de Pasos
**Estimación:** 4h
**Dependencias:** Sprint 5 completo
**Archivos principales:** `src/components/shared/wizard/`, `src/app/(auth)/onboarding/onboarding-client.tsx`

**Qué hacer:**
1. Crear componente `Wizard` reutilizable:
   - Props: `steps: WizardStep[]`, `onComplete`, `initialStep`
   - Step progress indicator (dots o barra de progreso)
   - Navegación back/next con animación
   - Estado persistido en `useState` (no localStorage por ahora)
   - Validación por paso antes de avanzar
2. Crear tipo `WizardStep`:
   ```typescript
   interface WizardStep {
     id: string
     title: string
     description?: string
     component: React.ComponentType<StepProps>
     validate?: () => boolean | Promise<boolean>
     optional?: boolean
   }
   ```
3. Integrar en `onboarding-client.tsx`:
   - Paso 1: Disponibilidad (componente actual, sin tocar lógica)
   - Paso 2+: Nuevos pasos de materia (6b en adelante)
4. El mismo Wizard se usa como page dedicada para crear materias desde dashboard

**Criterio de aceptación:**
- Wizard reutilizable con navegación, progress y validación
- Onboarding actual funciona igual pero con el nuevo wrapper
- Componente exportable para dashboard

---

### [6b] Paso 2 — Crear Materia (Campos)
**Estimación:** 4h
**Dependencias:** 6a
**Archivos principales:** `src/components/shared/subject-wizard/create-subject-step.tsx`

**Qué hacer:**
1. Formulario de creación de materia dentro del wizard:
   - `name` (required)
   - `year` (number, puede pre-llenarse desde PDF en Sprint 7)
   - `semester` (1er/2do cuatrimestre o anual)
   - `status` (cursando/regular/libre)
   - `professors` (texto libre, opcional)
   - `description` (textarea, opcional)
2. Selector de camino: "Estoy cursando esta materia" vs "Estudio libre / Final"
   - UI clara: dos cards grandes con icono y descripción
   - "Cursando" → flujo cursada (6c, 6d, 6f)
   - "Estudio libre" → flujo libre (6d, 6e)
3. Guardar materia en DB al avanzar (o al final del wizard)
4. Estos campos pueden pre-llenarse con datos del PDF (Sprint 7)

**Criterio de aceptación:**
- Subject se crea correctamente en DB
- Path selector funciona y dirige al flujo correcto
- Validación Zod del formulario

---

### [6c] Componente — Horario de Cursada
**Estimación:** 5h
**Dependencias:** 6b
**Archivos principales:** `src/components/shared/subject-wizard/class-schedule-step.tsx`

**Qué hacer:**
1. Componente de grilla semanal visual para ingresar horario de clases:
   - Lunes a Sábado como columnas
   - Click en un día para agregar un bloque de clase
   - Cada bloque: hora inicio, hora fin
   - Poder agregar múltiples bloques por día
   - Visual: similar al WeeklyScheduler de disponibilidad pero para clases
2. Ejemplo de uso: "Bases de Datos: Lunes 18:00-22:00 y Jueves 18:00-22:00"
3. Guardar como campo `schedule` del subject (ya existe el campo como JSON)
4. Este horario se usa para:
   - Calcular cuándo son las clases (para pre-clases)
   - Distribuir topics cuando no hay cronograma (programa sin fechas)
5. Si el PDF tiene cronograma (Sprint 7), este componente se pre-llena

**Criterio de aceptación:**
- Grilla visual funcional para ingresar horario
- Datos guardados como schedule del subject
- Validación: al menos 1 día de clase requerido para cursada

---

### [6d] Componente — Panel de Ingreso Manual de Temas
**Estimación:** 6h
**Dependencias:** 6b
**Archivos principales:** `src/components/shared/subject-wizard/topic-entry-panel.tsx`

**Qué hacer:**
1. Panel de ingreso de temas con UX tipo "todo list":
   - Input de texto + Enter para agregar a la lista
   - La lista crece debajo del input
   - Cada item muestra: nombre del tema, botón X para eliminar
   - Click en el nombre para editarlo inline
   - Drag handle opcional para reordenar (nice-to-have)
2. Campos editables por tema (expansibles al hacer click):
   - `name` (editable inline, required)
   - `difficulty` (selector: EASY / MEDIUM / HARD, default MEDIUM)
   - `hours` (estimación en minutos, default basado en dificultad)
3. Este componente recibe opcionalmente una lista pre-llenada (desde IA en Sprint 7)
4. Exporta la lista de topics como array para que el wizard la procese
5. **Compartido** entre:
   - Onboarding (cursada y estudio libre)
   - Dashboard (crear materia nueva)
   - Sprint 7 (resultado de extracción IA)

**Criterio de aceptación:**
- Agregar, editar, eliminar topics funciona fluidamente
- Lista exportable como array de TopicInput
- Componente reutilizable y desacoplado
- UX smooth sin page reloads

---

### [6e] Flujo Estudio Libre — Onboarding
**Estimación:** 4h
**Dependencias:** 6b + 6d
**Archivos principales:** `src/components/shared/subject-wizard/free-study-flow.tsx`

**Qué hacer:**
1. Paso en el wizard para estudio libre:
   - Date picker para fecha del examen final (required)
   - Botón "Subir programa/planificación (PDF)" → placeholder para Sprint 7, deshabilitado con tooltip "Próximamente"
   - Panel de ingreso manual de temas (6d)
2. Al confirmar:
   - Crear exam de tipo FINAL con la fecha seleccionada
   - Crear topics desde la lista del panel
   - Llamar `generateSessions` para cada topic (lógica FREE_STUDY existente)
3. Mostrar resumen: "Se generaron X sesiones de repaso para Y temas"

**Criterio de aceptación:**
- Flujo completo de estudio libre funciona end-to-end
- Sesiones se generan correctamente con la lógica existente
- Placeholder para PDF upload listo para Sprint 7

---

### [6f] Flujo Cursada — Setup de Parciales
**Estimación:** 6h
**Dependencias:** 6c + 6d
**Archivos principales:** `src/components/shared/subject-wizard/cursada-parciales-step.tsx`

**Qué hacer:**
1. Componente para crear instancias de parciales:
   - Botón "Agregar Parcial"
   - Cada parcial: nombre (auto: "Parcial 1", "Parcial 2"...), fecha (date picker), categoría (PARCIAL por default), modalidad (THEORY/PRACTICE/THEORY_PRACTICE)
   - Poder agregar recuperatorios vinculados
2. Asignación de temas a parciales:
   - Mostrar lista de topics creados en paso anterior
   - Cada topic se puede asignar a un parcial (dropdown o drag-and-drop)
   - Un topic puede pertenecer a un solo parcial
   - Validación: todos los topics deben estar asignados
3. Al confirmar:
   - Crear exams en DB con los parciales
   - Vincular cada topic a su exam_id
   - Los topics sin asignar quedan sin exam_id (warning)

**Criterio de aceptación:**
- Crear parciales con fechas funciona
- Asignación de topics a parciales funciona
- Datos persistidos correctamente en DB (exams + topics.exam_id)

---

### [6g] Migración DB + Pre-clase Session Generation
**Estimación:** 8h
**Dependencias:** 6f
**Archivos principales:** `supabase/migrations/`, `src/lib/services/session-generator.ts`, `src/lib/services/pre-class-generator.ts`

**Qué hacer:**
1. **Migración SQL:**
   - Crear enum `session_type` con valores `REVIEW`, `PRE_CLASS`
   - Agregar columna `session_type` a tabla `sessions` (default `REVIEW`)
   - Actualizar sesiones existentes a `REVIEW`
2. **Actualizar tipos TypeScript:**
   - `pnpm db:types` para regenerar
   - Actualizar `SessionToCreate` con campo `session_type`
3. **Pre-clase Generator Service** (`src/lib/services/pre-class-generator.ts`):
   - Input: lista de topics con fechas de clase, availability slots, study hours
   - Para cada clase con tema nuevo:
     - Calcular fecha de pre-clase: 1 día antes de la clase
     - Si no hay disponibilidad 1 día antes: buscar slot >= 1 hora antes de la clase
     - Usar `resolveSessionTime` existente para encontrar slot
     - Excluir fechas de parciales y recuperatorios
   - Duración: `min(60, duracion_clase * 0.3)` minutos (max 60 min, proporcional a la clase)
   - Prioridad: IMPORTANT (no critical pero necesaria)
   - `session_type: 'PRE_CLASS'`
4. **Integrar con session-generator.ts:**
   - Después de generar R1-R4 (REVIEW), generar pre-clases
   - Solo para modo CURSADA (no estudio libre)
5. **Actualizar `generateSessions` action:**
   - Pasar datos de schedule para pre-clases
   - Persistir pre-clases junto con reviews

**Criterio de aceptación:**
- Migración aplicada sin errores
- Pre-clases se generan correctamente para cada clase nueva
- Se respeta disponibilidad del usuario
- No se generan pre-clases para parciales/recuperatorios
- `pnpm build` y `pnpm typecheck` pasan

---

### [6h] Distribución Inteligente de Topics (Programa sin fechas)
**Estimación:** 6h
**Dependencias:** 6c + 6f + 6g
**Archivos principales:** `src/lib/services/topic-distributor.ts`

**Qué hacer:**
1. **Servicio TopicDistributor** (`src/lib/services/topic-distributor.ts`):
   - Input: topics con horas estimadas, días de clase (schedule), fechas de parciales con topics asignados
   - Algoritmo:
     a. Agrupar topics por parcial
     b. Para cada parcial, contar clases disponibles desde inicio de cuatrimestre (o hoy) hasta 1 semana antes del parcial
     c. Distribuir topics proporcionalmente según horas estimadas:
        - Topic de 9hs en materia con clases de 4hs → necesita ~2-3 clases
        - Topic de 2hs → 1 clase (puede compartir)
     d. Generar cronograma tentativo: fecha de clase + topic(s) asignado(s)
   - Output: `TentativeSchedule[]` con `{ date, topicIds, isNew: boolean }`
2. **Integrar en flujo de cursada sin fechas:**
   - Después de asignar topics a parciales y tener schedule
   - Generar distribución tentativa
   - Mostrar al usuario para confirmación (lista de clases con temas)
   - Desde la distribución: generar pre-clases + R1-R4
3. **UI de confirmación:**
   - Timeline visual: lista de clases con fecha y tema(s)
   - Editable: el usuario puede mover topics entre clases
   - Botón confirmar → genera sesiones

**Criterio de aceptación:**
- Distribución proporcional funciona correctamente
- El usuario puede revisar y ajustar antes de confirmar
- Sesiones (pre-clase + R1-R4) se generan desde la distribución

---

### [6i] Página de Creación de Materia (Dashboard)
**Estimación:** 4h
**Dependencias:** 6a-6h
**Archivos principales:** `src/app/(dashboard)/dashboard/subjects/new/page.tsx`

**Qué hacer:**
1. Crear página dedicada `/dashboard/subjects/new`
2. Reutilizar el mismo wizard de onboarding (pasos 2+):
   - Crear materia → path selector → topics → parciales/examen → confirmación
3. Botón "Nueva Materia" en la lista de subjects redirige acá
4. Banner/toast al completar: "Plan de estudio listo. X sesiones programadas esta semana."
5. Redirect al detalle de la materia creada

**Criterio de aceptación:**
- Mismo flujo que onboarding pero como página standalone
- Sesiones se generan al completar
- Toast de confirmación con resumen
- Botón accesible desde dashboard y lista de subjects

---

### [6j] Session Card — Soporte Pre-clase + Tips Contextuales
**Estimación:** 3h
**Dependencias:** 6g
**Archivos principales:** `src/components/features/sessions/session-card.tsx`

**Qué hacer:**
1. Diferenciar visualmente sesiones de tipo `PRE_CLASS`:
   - Badge o etiqueta "Pre-Clase" con color diferenciado (ej: azul pastel)
   - Formato del título: "Pre-Clase: {topic} — {fecha de clase}"
   - Icono diferente (ej: book-open vs refresh-cw)
2. Tips contextuales para sesiones de `REVIEW`:
   - R1: "Enfocate en lectura activa del material"
   - R2: "Intentá hacer un resumen de los puntos clave"
   - R3: "Practicá con ejercicios y casos"
   - R4: "Intentá recordar sin mirar apuntes (evocación)"
   - Mostrar como texto sutil debajo del título
3. Actualizar filtros de sesiones para incluir tipo (PRE_CLASS / REVIEW)

**Criterio de aceptación:**
- Pre-clases visualmente distinguibles
- Tips contextuales en reviews
- Filtro por tipo de sesión funcional

---

## Sprint 7 — Procesamiento IA de PDFs

### Objetivo
> Permitir al usuario subir un PDF de planificación o programa universitario y que la IA extraiga automáticamente temas, cronograma, parciales y metadata.

### Decisiones técnicas
- Patrón Strategy para providers de IA (OpenAI, Anthropic, Google)
- Provider configurado por env vars (admin decide, no el usuario)
- PDFs almacenados en Supabase Storage
- Resultados de extracción almacenados en tabla `ai_extractions` para auditoría
- Procesamiento en tiempo real (usuario espera con indicador de progreso)
- Soporte multimodal (visión) para PDFs escaneados (imágenes)
- Fallback a ingreso manual si la extracción falla

---

### [7a] PDF Upload — Infraestructura
**Estimación:** 4h
**Dependencias:** Sprint 6 completo
**Archivos principales:** `src/components/shared/pdf-upload/`, `src/lib/actions/pdf.ts`, `supabase/migrations/`

**Qué hacer:**
1. **Supabase Storage:**
   - Crear bucket `program-pdfs` (privado, RLS por user_id)
   - Política: solo el owner puede leer/escribir sus PDFs
   - Límite de tamaño: 10MB
2. **Componente de upload:**
   - Drag & drop zone con estética Claude (borde dashed suave, icono)
   - También file picker clásico como fallback
   - Validación: solo PDF, max 10MB
   - Preview del nombre del archivo seleccionado
   - Progress bar durante upload
3. **Server action `uploadPDF`:**
   - Subir a Supabase Storage
   - Retornar URL del archivo
4. **Migración: tabla `ai_extractions`:**
   ```sql
   CREATE TABLE ai_extractions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     subject_id UUID REFERENCES subjects(id),
     file_url TEXT NOT NULL,
     file_name TEXT NOT NULL,
     document_type TEXT, -- 'PLANIFICACION' | 'PROGRAMA' | 'UNKNOWN'
     raw_response JSONB,
     processed_result JSONB,
     model_used TEXT,
     provider TEXT,
     tokens_used INTEGER,
     processing_time_ms INTEGER,
     status TEXT DEFAULT 'PENDING', -- PENDING | PROCESSING | SUCCESS | FAILED
     error_message TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
5. RLS en `ai_extractions`

**Criterio de aceptación:**
- Upload funciona a Supabase Storage
- Tabla ai_extractions creada con RLS
- Componente con buena UX (drag & drop + validación)

---

### [7b] Capa de Abstracción IA — Strategy Pattern
**Estimación:** 6h
**Dependencias:** 7a
**Archivos principales:** `src/lib/services/ai/`, `src/lib/services/ai/providers/`

**Qué hacer:**
1. **Interface base:**
   ```typescript
   interface AIProvider {
     name: string
     extractFromPDF(fileBuffer: Buffer, mimeType: string): Promise<ExtractionRawResult>
   }

   interface ExtractionRawResult {
     success: boolean
     data?: RawExtraction
     error?: string
     tokensUsed?: number
   }
   ```
2. **Tipo de resultado estructurado:**
   ```typescript
   interface RawExtraction {
     documentType: 'PLANIFICACION' | 'PROGRAMA' | 'UNKNOWN'
     subjectMetadata: {
       name?: string
       year?: number
       semester?: string
       totalHours?: number
       weeklyHours?: number
       description?: string
       professors?: string[]
       bibliography?: string[]
       evaluationCriteria?: string
     }
     units: Array<{
       number: number
       name: string
       subtopics: string[]
       hoursTheory?: number
       hoursPractice?: number
       hoursTotal?: number
     }>
     schedule?: Array<{
       date?: string // ISO date si disponible
       weekRange?: string // "09/08 – 13/08" si es por semana
       topic: string
       type: 'CLASS' | 'EXAM' | 'RECOVERY' | 'HOLIDAY'
     }>
     exams?: Array<{
       name: string
       date?: string
       unitsIncluded: number[]
       type: 'PARCIAL' | 'RECUPERATORIO' | 'FINAL'
     }>
   }
   ```
3. **Implementación OpenAI** (`src/lib/services/ai/providers/openai.ts`):
   - Usar `gpt-4o` o `gpt-4o-mini` (configurable)
   - Enviar PDF como imagen(es) (multimodal)
   - Structured output con JSON schema
4. **Implementación Anthropic** (`src/lib/services/ai/providers/anthropic.ts`):
   - Usar `claude-sonnet` (configurable)
   - PDF como imágenes base64
   - Tool use / structured output
5. **Implementación Google** (`src/lib/services/ai/providers/google.ts`):
   - Usar Gemini (configurable)
   - PDF nativo como input
6. **Factory:**
   ```typescript
   function getAIProvider(): AIProvider {
     const provider = process.env.AI_PROVIDER // 'openai' | 'anthropic' | 'google'
     const apiKey = process.env.AI_API_KEY
     const model = process.env.AI_MODEL
     // return instance
   }
   ```
7. Implementar AL MENOS 1 provider funcional para el sprint, los otros como stubs

**Criterio de aceptación:**
- Interface definida y al menos 1 provider funcional
- Factory pattern con env vars
- Error handling robusto (timeout, rate limit, invalid response)
- Resultado tipado y validado

---

### [7c] Prompt Engineering & Extracción
**Estimación:** 8h
**Dependencias:** 7b
**Archivos principales:** `src/lib/services/ai/extraction-prompt.ts`

**Qué hacer:**
1. **Prompt template principal:**
   - System prompt que explica el contexto (app de estudio universitaria)
   - Instrucciones claras de qué extraer
   - JSON schema del output esperado
   - Manejo de variantes:
     - Planificación con cronograma detallado (BD)
     - Planificación con cronograma semanal (Paradigmas)
     - Programa sin fechas (Economía)
     - PDF escaneado (imagen)
2. **Heurística de tipo de documento:**
   - Si tiene fechas específicas de clase → PLANIFICACION
   - Si tiene solo contenidos/unidades → PROGRAMA
   - Si no se puede determinar → UNKNOWN (fallback manual)
3. **Pre-procesamiento del PDF:**
   - Convertir PDF a imágenes (para multimodal)
   - Optimizar: si es text-based, enviar texto; si es escaneado, enviar imágenes
   - Limitar páginas procesadas si es muy largo (enviar resumen o solo las relevantes)
4. **Post-procesamiento del resultado:**
   - Validar JSON con Zod
   - Normalizar fechas a ISO format
   - Calcular horas si no se proporcionan (estimar desde cantidad de clases)
   - Mapear unidades a dificultad estimada (basado en horas)
5. **Testing con los 3 PDFs reales:**
   - BD (planificación con fechas)
   - Paradigmas (planificación semanal)
   - Economía (programa escaneado)

**Criterio de aceptación:**
- Extracción exitosa en al menos 2 de 3 formatos
- Resultado validado con Zod
- Horas y dificultad estimadas cuando no están explícitas
- Manejo de errores y fallback

---

### [7d] Agrupación Inteligente de Topics
**Estimación:** 5h
**Dependencias:** 7c
**Archivos principales:** `src/lib/services/ai/topic-grouper.ts`

**Qué hacer:**
1. **Servicio de agrupación** (puede usar IA o lógica local):
   - Input: lista de unidades con subtopics y horas
   - Regla: cada topic resultante debe representar 45-120 min de estudio
   - Lógica:
     - Unidad corta (≤3 hs cátedra / 1-2 clases) → 1 topic
     - Unidad media (4-8 hs cátedra / 3-4 clases) → 2-3 topics
     - Unidad larga (>8 hs cátedra / 5+ clases) → 3-4 topics
   - Agrupación por coherencia temática (subtopics relacionados juntos)
2. **Opción A — Lógica local (determinista):**
   - Dividir subtopics secuencialmente en chunks de N subtopics
   - N = total_subtopics / (total_hours / target_hours_per_topic)
   - Nombre del topic: "Unidad X — {primer_subtopic} a {ultimo_subtopic}"
3. **Opción B — IA-assisted (mejor calidad):**
   - Segundo prompt a la IA: "Agrupa estos subtopics en sesiones de estudio de 45-120 minutos"
   - La IA agrupa por coherencia conceptual, no solo secuencial
   - Más costoso pero mejor resultado
4. Implementar ambas opciones, usar IA por default con fallback a local

**Criterio de aceptación:**
- Topics agrupados dentro del rango 45-120 min
- Nombres descriptivos y coherentes
- Fallback local funciona si la IA falla

---

### [7e] UI de Revisión de Extracción
**Estimación:** 5h
**Dependencias:** 7c + 7d + 6d
**Archivos principales:** `src/components/shared/subject-wizard/extraction-review.tsx`

**Qué hacer:**
1. Después de que la IA procesa el PDF, mostrar resultados en el **Topic Entry Panel** (6d):
   - Lista pre-poblada con topics extraídos y agrupados
   - Cada topic muestra: nombre, dificultad estimada, horas estimadas
   - El usuario puede editar, eliminar, agregar más, reordenar
2. Mostrar metadata extraída:
   - Nombre de la materia, año, cuatrimestre, horas totales
   - El usuario puede corregir antes de confirmar
3. Si se extrajo cronograma (planificación):
   - Mostrar timeline de clases detectadas
   - Pre-llenar el componente de horario de cursada (6c)
4. Si se extrajeron parciales:
   - Pre-llenar el componente de parciales (6f) con fechas y asignación de topics
5. Warning si la extracción es parcial o baja confianza:
   - "Algunos datos no pudieron extraerse. Revisá y completá lo que falta."
6. Botón fallback: "La extracción no es correcta → Ingresá los temas manualmente"

**Criterio de aceptación:**
- Resultado de IA se presenta de forma editable
- Pre-llenado de todos los componentes del wizard
- Fallback claro a ingreso manual
- UX fluida sin fricción

---

### [7f] Server Action — Procesar PDF
**Estimación:** 5h
**Dependencias:** 7a + 7b + 7c + 7d
**Archivos principales:** `src/lib/actions/ai-extraction.ts`

**Qué hacer:**
1. **Action `processPDF(fileUrl: string, subjectId?: string)`:**
   - Descargar PDF de Supabase Storage
   - Crear registro en `ai_extractions` con status `PROCESSING`
   - Llamar a `getAIProvider().extractFromPDF()`
   - Ejecutar agrupación inteligente de topics
   - Actualizar registro con resultado, tokens, tiempo
   - Si falla: status `FAILED`, guardar error_message
   - Retornar resultado procesado al cliente
2. **Manejo de tiempo real:**
   - El action se ejecuta y el frontend muestra loading con mensaje:
     "Procesando tu programa... Esto puede tardar unos segundos"
   - Indicador de progreso (indeterminado o con pasos)
3. **Error handling:**
   - Timeout de 60 segundos
   - Si la IA no responde: error amigable + fallback manual
   - Si el PDF no es legible: "No pudimos leer el PDF. ¿Es un documento escaneado?"

**Criterio de aceptación:**
- PDF se procesa end-to-end
- Resultado almacenado en ai_extractions
- Errores manejados con UX amigable
- Feedback en tiempo real al usuario

---

### [7g] Integración — Onboarding + IA
**Estimación:** 6h
**Dependencias:** 7e + 7f + Sprint 6
**Archivos principales:** `src/components/shared/subject-wizard/*`

**Qué hacer:**
1. Agregar botón "Subir programa/planificación (PDF)" en los flujos de:
   - Cursada (antes del ingreso manual de temas)
   - Estudio libre (antes del ingreso manual de temas)
2. Flujo integrado:
   a. Usuario sube PDF → processPDF() → loading...
   b. Resultado exitoso → populate wizard components:
      - Topics en Topic Entry Panel (6d)
      - Schedule en grilla de horario (6c) si hay cronograma
      - Parciales en Parciales Step (6f) si hay info de exámenes
      - Metadata en campos de materia (6b)
   c. Resultado fallido → warning + "Crear manualmente"
   d. Usuario revisa y edita todo → confirma → genera sesiones
3. El botón de subir PDF convive con el ingreso manual:
   - Si no sube PDF → sigue el flujo manual normal (Sprint 6)
   - Si sube PDF → reemplaza/complementa el ingreso manual

**Criterio de aceptación:**
- Flujo PDF integrado en ambos caminos (cursada y libre)
- Pre-llenado funciona correctamente
- Fallback a manual transparente
- No rompe nada del Sprint 6

---

### [7h] Metadata de Materia desde IA
**Estimación:** 3h
**Dependencias:** 7c + 7g
**Archivos principales:** `supabase/migrations/`, `src/app/(dashboard)/dashboard/subjects/[id]/`

**Qué hacer:**
1. **Migración: campos de metadata en subjects:**
   - `total_hours` (numeric, nullable)
   - `weekly_hours` (numeric, nullable)
   - `bibliography` (jsonb, nullable) — array de strings
   - `evaluation_criteria` (text, nullable)
   - `ai_extraction_id` (uuid, FK a ai_extractions, nullable)
2. Auto-llenar estos campos cuando la IA los extrae
3. Mostrar en la página de detalle de la materia:
   - Sección "Información de la materia" con metadata
   - Bibliografía como lista
   - Criterios de evaluación como texto
4. Si no hay metadata (materia creada sin PDF): no mostrar sección

**Criterio de aceptación:**
- Campos agregados a subjects
- Metadata visible en detalle de materia
- Solo se muestra si hay datos

---

### [7i] Paridad PDF/IA — Wizard «Nueva materia» (dashboard)
**Estimación:** 2h
**Dependencias:** 7g (misma UX que onboarding; reutiliza `PdfUploadStep` + extracción)
**Archivos principales:** `src/app/(dashboard)/dashboard/subjects/new/new-subject-client.tsx`, `src/components/shared/pdf-upload/`, `src/lib/actions/onboarding-wizard.ts` (o acción de completado equivalente)

**Qué hacer:**
1. En el wizard de **crear materia desde el dashboard** (`/dashboard/subjects/new`), para rutas **Estudio libre** y **Cursando**, incluir el paso opcional **«Programa (PDF)»** **antes** del paso de plan manual / cursada — **mismo orden y comportamiento** que en `/onboarding`.
2. Reutilizar `PdfUploadStep` y el mismo pipeline de datos (`pdfExtraction` → metadata/topics para los pasos siguientes) que ya usa onboarding.
3. Permitir **omitir** el paso (PDF opcional) sin bloquear el flujo.
4. Verificar que `completeSubjectWizard` (o la acción usada en dashboard) recibe `pdfMetadata` / extracción igual que onboarding.

**Criterio de aceptación:**
- Usuario ve el paso PDF en «Nueva materia» cuando elige libre o cursada (paridad con onboarding).
- Subir PDF o saltar el paso funciona; datos precargan los pasos siguientes cuando aplica.
- Sin regresiones en onboarding.

> **Nota:** La integración en código puede adelantarse al resto del sprint; esta tarea formaliza paridad UX + QA.

---

## Sprint 8 — Dark Mode

### [8a] Theme System
**Estimación:** 4h
**Dependencias:** Sprint 5 (design system)

**Qué hacer:**
1. Implementar sistema de temas con CSS custom properties
2. Dark palette que complementa la light palette del Sprint 5
3. Toggle en Settings
4. Respetar preferencia del sistema (`prefers-color-scheme`)
5. Persistir preferencia en `user_settings`

### [8b] Dark Mode — Aplicar a toda la app ✅
**Estimación:** 4h
**Dependencias:** 8a

**Qué hacer:**
1. Revisar TODOS los componentes y páginas
2. Ajustar colores que no funcionen en dark
3. Imágenes/iconos que necesiten variante dark
4. Testing completo en dark mode

**Estado:** Revisión sistemática: la UI ya usaba tokens semánticos en su mayoría; se añadieron `color-scheme`, token `scrim` para overlays, `ring-offset-background` en focos, texto `on-error-container` en banners de error y ajustes puntuales (landing/auth).

---

## Sprint 9 — Gamificación (ex Sprint 5)

> Sin cambios respecto al plan original. Ver backlog en CONTEXT.MD.

| Sub-sprint | Tarea | Tiempo |
|-----------|-------|--------|
| 9a | Streaks calculator | 4h |
| 9b | Points system | 3h |
| 9c | Levels per subject | 5h |
| 9d | Achievements system | 6h |
| 9e | Gamification UI | 8h |

---

## Sprint 10 — Analytics + Tasks (ex Sprint 6)

> Sin cambios respecto al plan original. Ver backlog en CONTEXT.MD.

| Sub-sprint | Tarea | Tiempo |
|-----------|-------|--------|
| 10a | E2E tests UC-008/009 | 9h |
| 10b | Analytics calculator | 6h |
| 10c | Analytics Dashboard UI | 10h |
| 10d | Tasks CRUD (TPs) | 5h |
| 10e | Task tracking | 3h |
| 10f | Telegram Notifications | 7h |

---

## Resumen de Estimaciones

| Sprint | Horas | Semanas (~20h/sem) |
|--------|-------|-------------------|
| Sprint 5: Rediseño Visual | ~40h | 2 semanas |
| Sprint 6: Onboarding Inteligente | ~50h | 2.5 semanas |
| Sprint 7: Procesamiento IA PDFs | ~44h | ~2 semanas |
| Sprint 8: Dark Mode | ~8h | 0.5 semanas |
| Sprint 9: Gamificación | ~26h | 1.5 semanas |
| Sprint 10: Analytics + Tasks | ~40h | 2 semanas |
| **TOTAL** | **~208h** | **~10.5 semanas** |

---

## Diagrama de Dependencias

```
Sprint 5 (Rediseño)
    │
    ▼
Sprint 6 (Onboarding)  ──────────────────┐
    │                                      │
    ▼                                      ▼
Sprint 7 (IA PDFs) ◄── depende de 6d,6c,6f
    │
    ▼
Sprint 8 (Dark Mode) ◄── depende de 5a tokens
    │
    ▼
Sprint 9 (Gamificación) ◄── independiente (puede ir en paralelo con 7 o 8)
    │
    ▼
Sprint 10 (Analytics) ◄── depende de 9 parcialmente
```

---

## Cambios al Schema de DB (Acumulado)

### Sprint 6
1. Nuevo enum `session_type`: `REVIEW`, `PRE_CLASS`
2. Nueva columna `sessions.session_type` (default `REVIEW`)

### Sprint 7
1. Nueva tabla `ai_extractions`
2. Nuevas columnas en `subjects`: `total_hours`, `weekly_hours`, `bibliography`, `evaluation_criteria`, `ai_extraction_id`
3. Bucket de Storage `program-pdfs`

### Sprint 8
1. Nueva columna `user_settings.theme_preference` (default `system`)

---

## Env Vars Nuevas (Sprint 7)

```env
# AI Provider Config (admin only)
AI_PROVIDER=openai          # openai | anthropic | google
AI_API_KEY=sk-...           # API key del provider seleccionado
AI_MODEL=gpt-4o-mini        # Modelo específico
AI_MAX_TOKENS=4096          # Límite de tokens de respuesta
AI_TIMEOUT_MS=60000         # Timeout en ms
```

---

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Extracción IA inconsistente entre formatos PDF | Alta | Alto | Prompt engineering iterativo + fallback manual |
| PDFs escaneados difíciles de procesar | Media | Medio | Multimodal (visión) + warning al usuario |
| Costo de IA se dispara | Baja (dev) | Medio (prod) | Tracking en ai_extractions + límites configurables |
| Distribución de topics incorrecta | Media | Medio | UI de revisión editable + confirmación del usuario |
| Rediseño rompe funcionalidad existente | Media | Alto | Testing manual de todas las páginas + pnpm build |
| Pre-clases generan demasiadas sesiones | Baja | Medio | Solo para clases con temas nuevos + max duration |
