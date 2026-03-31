# Design System — "The Curator"

> Referencia visual extraída de los mockups de Google Stitch (2026-03-31).
> Usar como fuente de verdad para Sprint 5 (Rediseño Visual).

---

## Brand

- **Nombre:** The Curator
- **Subtítulo:** Academic Session
- **Logo font:** Newsreader italic

---

## Layout

**Sidebar only (sin top header/navbar)**
- Sidebar fija izquierda: `w-64`, `bg-[#f5f3f0]`
- Contenido principal: `ml-64`, padding `p-8 lg:p-12/p-16`
- Max width contenido: `max-w-7xl mx-auto`
- Mobile: bottom nav bar con glass effect

**Sidebar estructura:**
1. Brand (The Curator + Academic Session)
2. Nav items (Dashboard, Subjects, Sessions, Settings)
3. Separador + Archive, Help
4. Botón "New Study Session" (primary, bottom)

**Nav item activo:** `bg-white rounded-lg shadow-sm font-semibold text-stone-900`
**Nav item inactivo:** `text-stone-500 hover:translate-x-1 transition-transform`

---

## Colores (Tailwind Config)

```javascript
colors: {
  // Surfaces
  "background": "#fbf9f6",          // Cream cálido
  "surface": "#fbf9f6",
  "surface-container-lowest": "#ffffff",
  "surface-container-low": "#f5f3f0",   // Sidebar bg
  "surface-container": "#eeeeea",
  "surface-container-high": "#e8e8e3",
  "surface-container-highest": "#e2e3dd",
  "surface-variant": "#e2e3dd",
  "surface-dim": "#d9dbd4",

  // Primary (warm gray)
  "primary": "#5f5e5e",
  "primary-dim": "#535252",
  "primary-container": "#e4e2e1",
  "on-primary": "#faf7f6",
  "on-primary-container": "#525151",

  // Secondary (sage green)
  "secondary": "#546357",
  "secondary-dim": "#48574c",
  "secondary-container": "#d7e7d8",
  "on-secondary": "#edfdee",
  "on-secondary-container": "#47554a",

  // Tertiary (muted indigo)
  "tertiary": "#4e5d91",
  "tertiary-dim": "#425184",
  "tertiary-container": "#b2c1fd",
  "on-tertiary": "#faf8ff",
  "on-tertiary-container": "#2c3c6e",

  // Error (warm red)
  "error": "#9e422c",
  "error-dim": "#5c1202",
  "error-container": "#fe8b70",
  "on-error": "#fff7f6",
  "on-error-container": "#742410",

  // Text
  "on-surface": "#30332f",
  "on-surface-variant": "#5d605b",
  "on-background": "#30332f",

  // Borders
  "outline": "#797b77",
  "outline-variant": "#b1b3ad",

  // Inverse
  "inverse-surface": "#0e0e0d",
  "inverse-primary": "#ffffff",
  "inverse-on-surface": "#9e9d9a",
}
```

---

## Tipografía

```javascript
fontFamily: {
  "headline": ["Newsreader", "serif"],   // Headings, brand, quotes
  "body": ["Inter", "sans-serif"],       // Body text, labels, nav
  "label": ["Inter", "sans-serif"],      // Small labels, badges
}
```

### Escala

| Uso | Font | Tamaño | Weight | Extra |
|-----|------|--------|--------|-------|
| Page title | Newsreader | text-5xl / text-6xl | font-light / font-medium | tracking-tight |
| Section heading | Newsreader | text-2xl / text-3xl | normal | — |
| Card title | Newsreader | text-xl / text-2xl | font-bold | — |
| Body | Inter | text-sm / text-base | normal | — |
| Small label | Inter | text-xs / text-[10px] | font-bold | uppercase tracking-widest |
| Badge | Inter | text-[10px] / text-[9px] | font-bold | uppercase tracking-wider |
| Stat number | Newsreader | text-3xl / text-4xl | font-bold / font-semibold | — |
| Quote | Newsreader | text-lg / text-xl | italic | — |
| Nav item | Inter | text-sm | normal / font-semibold (active) | antialiased |

---

## Border Radius

```javascript
borderRadius: {
  DEFAULT: "0.125rem",  // 2px
  lg: "0.25rem",        // 4px
  xl: "0.5rem",         // 8px
  full: "0.75rem",      // 12px
}
```

En la práctica los componentes usan clases directas: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`.

---

## Sombras

- Cards: `shadow-sm` o `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`
- Active nav: `shadow-sm`
- Hover cards: `hover:shadow-md`
- FAB: `shadow-2xl`
- Today calendar: `shadow-xl shadow-tertiary/5`

---

## Iconos

**Google Material Symbols Outlined**
- Weight: 300 (sidebar) / 400 (general)
- Fill: 0
- Grade: 0
- Optical size: 24

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
}
```

Iconos usados: `dashboard`, `menu_book`, `calendar_month`, `settings`, `archive`, `help_outline`, `add`, `notifications`, `account_circle`, `auto_stories`, `sticky_note_2`, `alarm`, `assignment`, `event_upcoming`, `chevron_left`, `chevron_right`, `arrow_back`, `arrow_forward`, `edit`, `delete`, `add_circle`, `search`, `database`, `category`, `timer`, `auto_awesome`, `event_note`, `schedule`, `date_range`, `mail`, `send`, `sync`, `link_off`, `event_available`, `edit_calendar`, `expand_more`

---

## Componentes Clave

### Stat Cards (Dashboard)
- Colores variados por card: `secondary-container/30`, `tertiary-container/30`, `primary-container/40`
- Height fija: `h-44`
- Icono arriba, número + label abajo
- Hover: background más intenso
- Cards vacías/inactivas: `opacity-60`

### Session Cards (Calendar)
- Día actual: `bg-white ring-2 ring-tertiary/20 shadow-xl`
- Evento: `border-l-2 border-tertiary` con background sutil
- Botón "Completar" inline
- Días pasados: `bg-surface-container-low/30` con texto `opacity-40`

### Subject Cards (Materias)
- `bg-surface-container-lowest`, `rounded-xl`
- Semester badge: `text-[10px] uppercase tracking-widest`
- Progress bar: `h-1.5 bg-secondary rounded-full`
- Hover: reveal edit/delete buttons con `opacity-0 group-hover:opacity-100`
- "Añadir nueva materia" card: `border-dashed border-outline-variant/40`

### "Sugerencia del Curador" Card
- `bg-tertiary-container/30` con imagen de fondo `opacity-20 mix-blend-overlay`
- Texto descriptivo con sugerencia personalizada

### Motivational Quote Cards
- Al fondo de páginas
- Imagen de fondo con `mix-blend-multiply opacity-20`
- O `bg-gradient-to-t from-on-surface/60 to-transparent`
- Texto en Newsreader italic
- Atribución en `text-[10px] uppercase tracking-widest`

### Notification Channel Toggles (Settings)
- Icono en círculo coloreado (12x12)
- Custom toggle switch `w-11 h-6`
- Checked: `bg-secondary`

### Exam Cards (Subject Detail)
- Badge tipo: `PARCIAL I`, `FINAL` con color diferenciado
- Fecha top-right
- Progress bar preparación
- Hover: `hover:shadow-md`

---

## Decisiones de Diseño Importantes

1. **SIN top header/navbar** — solo sidebar. El contenido usa el ancho completo.
2. **Glass effect** solo en mobile bottom nav: `backdrop-filter: blur(20px)`
3. **Quotes motivacionales** en cada página (footer de contenido)
4. **"The Curator"** como identidad — tono académico, editorial
5. **Iconos Material Symbols** con weight 300 (thin) para look editorial
6. **Transiciones:** `transition-all duration-300 ease-out` para nav, `transition-transform` para hover translate
7. **Selection highlight:** `selection:bg-tertiary-container selection:text-on-tertiary-container`

---

## Archivos de Referencia HTML (Stitch)

Los mockups HTML originales de Google Stitch están disponibles para referencia visual.
Páginas diseñadas: Dashboard, Sessions, Subject Detail, Settings, Subjects List.
