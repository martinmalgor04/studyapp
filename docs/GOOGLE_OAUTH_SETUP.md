# Login y Registro con Google (OAuth)

La app tiene preparado el flujo de **Iniciar sesión / Registrarse con Google**. En local el OAuth con Google no suele funcionar; está pensado para **producción** (Supabase Cloud + dominio público).

---

## ¿Un solo cliente o dos (Login vs Calendar)?

En StudyApp hay **dos usos** de Google OAuth:

| Uso | Dónde se configura | Redirect / Callback |
|-----|--------------------|---------------------|
| **Login/Registro** ("Continuar con Google") | **Supabase Dashboard** → Authentication → Providers → Google | `https://[project].supabase.co/auth/v1/callback` |
| **Google Calendar** (conectar calendario, import/export) | **.env / Vercel** → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | `https://tu-dominio/api/auth/callback/google` |

**Podés usar el mismo Client ID y Secret para ambos** (recomendado):

- En **Google Cloud** creás **un** cliente OAuth (Web application).
- En ese cliente agregás **las dos** URIs de redirección: la de Supabase (arriba) y la de tu app (`https://tu-dominio.vercel.app/api/auth/callback/google`).
- En la pantalla de consentimiento, los scopes pueden incluir tanto los que pide Supabase (email, profile, openid) como los de Calendar (`calendar.events`, `calendar.readonly`) si vas a usar Calendar.
- Ese mismo **Client ID** y **Client Secret** los ponés:
  1. En **Supabase** (Authentication → Google) para login.
  2. En **.env / Vercel** como `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` para Calendar.

**O podés usar dos clientes distintos** (uno solo para login, otro solo para Calendar). En ese caso: un Client ID/Secret solo en Supabase, y otro Client ID/Secret en las variables `GOOGLE_*` de la app.

---

## 1. Configuración en Google Cloud Console

Usá el proyecto donde tenés el cliente OAuth (el mismo que para Calendar si usás uno solo).

### Orígenes de JavaScript autorizados

- `http://localhost:3000` (opcional, para pruebas si Google lo permite)
- **Producción:** `https://tu-dominio.vercel.app` (o tu dominio real)

### URIs de redirección autorizados

- **Supabase local (opcional):**  
  `http://localhost:54321/auth/v1/callback`
- **Supabase producción (obligatorio):**  
  `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`

Reemplazá `[TU-PROJECT-REF]` por el **Reference ID** de tu proyecto en Supabase (Dashboard → Project Settings → General).

### Credenciales

- **Client ID** y **Client Secret** del cliente OAuth (puede ser el mismo que usás para Calendar en `GOOGLE_*`).
- Para **login**, estos solo se configuran en **Supabase Dashboard** (Authentication → Google). **No van en .env del frontend.**

---

## 2. Configuración en Supabase (producción)

1. Entrá a [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto.
2. **Authentication** → **Providers** → **Google**.
3. Activá **Enable Sign in with Google**.
4. Pegá:
   - **Client ID** (de Google Cloud).
   - **Client Secret** (de Google Cloud).
5. Guardá.

Supabase usa su propia URL de callback; no hace falta configurarla a mano si usás el provider Google de Supabase.

---

## 3. Qué hace la app (ya implementado)

- **Login:** botón "Continuar con Google" en `/login`.
- **Registro:** botón "Registrarse con Google" en `/register`.
- **Callback:** `/auth/callback` intercambia el código por sesión y redirige a `/dashboard` o `/onboarding` si no completó onboarding.

El flujo es:

1. Usuario hace clic en "Continuar con Google" o "Registrarse con Google".
2. Supabase redirige a Google.
3. Usuario autoriza.
4. Google redirige a `https://[project].supabase.co/auth/v1/callback`.
5. Supabase crea/actualiza la sesión y redirige a tu app en `redirectTo` (origen de tu app + `/auth/callback`).
6. Tu ruta `/auth/callback` recibe al usuario ya autenticado y lo manda a dashboard u onboarding.

---

## 4. Local vs producción

| Entorno   | Comportamiento |
|----------|-----------------|
| **Local** | OAuth con Google no suele funcionar (redirect URIs y orígenes son de producción). Los botones están; al usarlos en local puede fallar o quedar en blanco. |
| **Producción** | Configurando en Google Cloud (orígenes + redirect URI de Supabase) y en Supabase (Google provider con Client ID y Secret), el login/registro con Google funciona. |

---

## 5. Usuarios que entran solo con Google

- No tienen contraseña en Supabase (solo provider `google`).
- El nombre puede tomarse de `user.user_metadata.full_name` o `user_metadata.name` después del login.
- Si querés guardar nombre en `public.users`, podés hacerlo en el callback o con un trigger en la DB al crear el usuario.

---

## 6. Resumen de pasos para producción

1. **Google Cloud:** en el cliente OAuth, agregar origen (tu URL de producción) y URI de redirección `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`.
2. **Supabase:** Authentication → Providers → Google → Enable, Client ID y Client Secret.
3. Desplegar la app en un dominio HTTPS (ej. Vercel).
4. Probar "Continuar con Google" y "Registrarse con Google" en producción.

No hace falta poner el Client Secret en el código ni en `.env` del frontend; solo en Supabase Dashboard.
