# Desplegar StudyApp en Vercel

Guía paso a paso para subir la app a Vercel y dejarla funcionando en producción con Supabase Cloud.

---

## Proyecto Supabase Cloud ya configurado

Este repo está preparado para usar el proyecto de Supabase Cloud:

- **Project URL:** `https://uoqgyvscgxrlwdhmpogv.supabase.co`
- **Project ref:** `uoqgyvscgxrlwdhmpogv` (para `supabase link` y callbacks de Google)

Las credenciales están en `.env.local`. Para producción solo tenés que:

1. Aplicar migraciones en ese proyecto (sección 1.3).
2. Cargar en Vercel las mismas variables que en `.env.local` (ajustando `NEXT_PUBLIC_APP_URL` y `GOOGLE_REDIRECT_URI` a la URL de Vercel).

---

## Requisitos previos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com) (producción)
- Repositorio en GitHub/GitLab/Bitbucket (recomendado para deploy automático)
- Node.js 20+ y pnpm (para compilar en local y verificar antes de subir)

---

## 1. Preparar Supabase en producción

### 1.1 Crear proyecto en Supabase Cloud

1. Entrá a [Supabase Dashboard](https://supabase.com/dashboard) → **New Project**.
2. Elegí organización, nombre del proyecto (ej. `studyapp-prod`), contraseña de DB y región.
3. Esperá a que termine de crear el proyecto.

### 1.2 Obtener credenciales

En el proyecto: **Project Settings** (ícono engranaje) → **API**:

- **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** (key) → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Anotalas; las vas a usar en Vercel.

### 1.3 Aplicar migraciones

Las migraciones están en `supabase/migrations/`. Hay que aplicarlas en el proyecto de Supabase Cloud.

**Opción A – Supabase CLI (recomendado)**

Primero iniciá sesión en la CLI (abre el navegador para autorizar):

```bash
pnpm supabase login
```

Luego vinculá el proyecto y aplicá migraciones:

```bash
# En la raíz del repo (project ref de este proyecto: uoqgyvscgxrlwdhmpogv)
pnpm supabase link --project-ref uoqgyvscgxrlwdhmpogv

pnpm supabase db push
```

Si no podés usar el flujo interactivo (ej. en CI), podés usar un access token: en [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) generá un token y ejecutá `SUPABASE_ACCESS_TOKEN=tu-token pnpm supabase link --project-ref uoqgyvscgxrlwdhmpogv`.

**Opción B – Manual**

Abrí **SQL Editor** en Supabase Dashboard y ejecutá en orden el contenido de cada archivo en `supabase/migrations/` (por nombre/fecha).

### 1.4 Configurar Auth (opcional: Google)

Si usás login con Google:

1. **Authentication** → **Providers** → **Google** → Enable.
2. Pegá **Client ID** y **Client Secret** de Google Cloud (mismo cliente OAuth que para Calendar si es el mismo).
3. En Google Cloud Console agregá como URI de redirección:  
   `https://TU-PROJECT-REF.supabase.co/auth/v1/callback`

Ver `docs/GOOGLE_OAUTH_SETUP.md` para más detalle.

---

## 2. Crear proyecto en Vercel

### 2.1 Importar el repositorio

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión.
2. **Add New** → **Project**.
3. Importá el repo de StudyApp (GitHub/GitLab/Bitbucket).
4. Vercel detecta Next.js automáticamente.

### 2.2 Configuración del proyecto

| Campo | Valor |
|-------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (dejar por defecto) |
| **Build Command** | `pnpm build` (o dejar el que propone Vercel) |
| **Output Directory** | (vacío; Next.js usa `.next`) |
| **Install Command** | `pnpm install` |
| **Node.js Version** | 20.x (en Settings → General después del primer deploy si hace falta) |

No hace falta configurar **Development Command** para producción.

---

## 3. Variables de entorno en Vercel

En el proyecto de Vercel: **Settings** → **Environment Variables**. Agregá estas variables para **Production** (y, si querés, para Preview):

### Obligatorias (app + auth)

| Variable | Descripción | Valor para este proyecto |
|---------|-------------|---------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://uoqgyvscgxrlwdhmpogv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | (está en tu `.env.local`; copiá el mismo valor a Vercel) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app en Vercel | `https://tu-proyecto.vercel.app` (reemplazá por la URL que te asigne Vercel) |

Para **NEXT_PUBLIC_APP_URL** usá la URL que te asigne Vercel después del primer deploy. Si usás dominio propio, poné esa URL.

### Google Calendar (si usás integración)

| Variable | Descripción | Ejemplo |
|---------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth (Calendar) | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | `GOCSPX-xxxxx` |
| `GOOGLE_REDIRECT_URI` | Callback de tu app para Google Calendar | `https://tu-dominio.vercel.app/api/auth/callback/google` |

En **Google Cloud Console** (credenciales OAuth del mismo cliente):

- **Orígenes autorizados:** `https://tu-dominio.vercel.app`
- **URI de redirección:** `https://tu-dominio.vercel.app/api/auth/callback/google`

### Email (Resend, opcional)

| Variable | Descripción |
|---------|-------------|
| `RESEND_API_KEY` | API Key de [Resend](https://resend.com) para notificaciones por email |

Si no la configurás, las notificaciones por email no se envían (el resto de la app funciona).

### Opcionales

| Variable | Descripción |
|---------|-------------|
| `SUPABASE_INTERNAL_URL` | Solo si en algún momento usás conexión interna a Supabase; en Vercel normalmente no hace falta. |

---

## 4. Primer deploy

1. Guardá las variables de entorno en Vercel.
2. Hacé **Deploy** (o push a la rama conectada si ya tenés deploy automático).
3. Esperá a que termine el build. El comando que se ejecuta es `pnpm build` (Next.js).
4. Si algo falla, revisá los logs en Vercel; suele ser por variables de entorno faltantes o por tipos/errores de TypeScript.

---

## 5. Configurar sitio y redirecciones

### 5.1 URL del sitio

Después del primer deploy, la app queda en:

- `https://nombre-proyecto.vercel.app`

Podés cambiar el nombre en **Settings** → **General** → **Project Name**.

### 5.2 Dominio propio (opcional)

1. **Settings** → **Domains** → agregá tu dominio.
2. Seguí las instrucciones de Vercel (DNS o CNAME).
3. Actualizá `NEXT_PUBLIC_APP_URL` con la nueva URL (ej. `https://studyapp.tudominio.com`).
4. Actualizá en Google Cloud (orígenes y URI de redirección) y en Supabase (Site URL / Redirect URLs si las usás) la nueva URL.

---

## 6. Supabase: URLs de la app

Para que el flujo de auth (login, registro, callback) funcione bien:

1. Supabase Dashboard → **Authentication** → **URL Configuration**.
2. **Site URL:** la URL pública de la app (ej. `https://studyapp.vercel.app`).
3. **Redirect URLs:** agregá las que uses, por ejemplo:
   - `https://studyapp.vercel.app/**`
   - `https://studyapp.vercel.app/auth/callback`
   - Si usás dominio propio, las mismas con ese dominio.

---

## 7. Checklist rápido

Antes de dar por cerrado el deploy:

- [ ] Proyecto Supabase creado y migraciones aplicadas.
- [ ] Variables en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
- [ ] Si usás Google Calendar: `GOOGLE_*` en Vercel y URI/orígenes en Google Cloud.
- [ ] Si usás login con Google: provider Google configurado en Supabase y callback de Supabase en Google Cloud.
- [ ] En Supabase, Site URL y Redirect URLs con la URL final de la app.
- [ ] Build en Vercel en verde y la app carga en la URL asignada.
- [ ] Probar registro, login (email y Google si aplica) y una ruta protegida (ej. dashboard).

---

## 8. Comandos útiles

```bash
# Build local (verificar antes de push)
pnpm build

# Lint
pnpm lint

# Generar tipos de Supabase desde el proyecto vinculado
pnpm supabase link --project-ref TU-PROJECT-REF
pnpm db:types
```

---

## 9. Referencias

- [Vercel – Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Supabase – Production](https://supabase.com/docs/guides/getting-started/local-development#connecting-to-a-remote-supabase-project)
- [StudyApp – Google OAuth](./GOOGLE_OAUTH_SETUP.md)
- [StudyApp – Google Calendar](./GOOGLE_CALENDAR_INTEGRATION.md)
- [StudyApp – Notificaciones](./NOTIFICATIONS_GUIDE.md)
