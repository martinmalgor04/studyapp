import { createClient } from '@supabase/supabase-js';

// La URL de Supabase que usa la app (playwright.config.ts carga .env.local via dotenv)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const isLocal =
  SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost');

// Service role key (para Admin API) — solo disponible si se configura en .env.local
// Para local dev: key pública por diseño. Para cloud: obtenerla de Supabase Dashboard.
const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SERVICE_ROLE_KEY = isLocal
  ? LOCAL_SERVICE_ROLE_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_USER = {
  email: 'test@studyapp.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

async function globalSetup() {
  console.log('\n[E2E Setup] Verificando usuario de test...');
  console.log(`[E2E Setup] Supabase: ${isLocal ? 'LOCAL' : 'CLOUD'} — ${SUPABASE_URL}`);

  // INTENTO 1: Admin API (más confiable, usa service role key)
  if (SERVICE_ROLE_KEY) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: { name: TEST_USER.name },
    });

    if (!error) {
      console.log('[E2E Setup] ✅ Usuario de test creado via Admin API');
      return;
    }

    const alreadyExists =
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('duplicate');

    if (alreadyExists) {
      console.log('[E2E Setup] ✅ Usuario de test ya existe (Admin API)');
      return;
    }

    console.warn(`[E2E Setup] ⚠ Admin API falló: ${error.message}. Intentando signup...`);
  }

  // INTENTO 2: Signup normal (funciona si email confirmations están desactivadas)
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Primero intentar login — si funciona, el usuario ya existe y está activo
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (!signInError) {
    console.log('[E2E Setup] ✅ Usuario de test existe y puede loguearse');
    return;
  }

  // Login falló → intentar registro
  const { data, error: signUpError } = await anon.auth.signUp({
    email: TEST_USER.email,
    password: TEST_USER.password,
    options: { data: { name: TEST_USER.name } },
  });

  if (signUpError) {
    // Si es "User already registered" → el user existe pero el login falló por otro motivo
    if (
      signUpError.message.toLowerCase().includes('already registered') ||
      signUpError.message.toLowerCase().includes('duplicate')
    ) {
      console.warn('[E2E Setup] ⚠ El usuario existe pero no se puede loguear automáticamente.');
    } else {
      printSetupError(signUpError.message);
      throw new Error(`[E2E Setup] No se pudo crear el usuario de test: ${signUpError.message}`);
    }
  } else if (data.user && !data.session) {
    // Signup exitoso pero requiere confirmación de email
    printSetupError(
      'El signup fue exitoso pero se requiere confirmación de email.\n' +
        '  Desactivá "Email confirmations" en Supabase Dashboard, o usá SUPABASE_SERVICE_ROLE_KEY.'
    );
    throw new Error('[E2E Setup] Se requiere confirmación de email para activar el usuario de test.');
  } else if (data.session) {
    console.log('[E2E Setup] ✅ Usuario de test creado via signup');
  }
}

function printSetupError(detail: string) {
  console.error(
    '\n[E2E Setup] ❌ No se pudo preparar el usuario de test.\n\n' +
      `  Detalle: ${detail}\n\n` +
      '  Solución: Agregá SUPABASE_SERVICE_ROLE_KEY a .env.local\n' +
      '  → Supabase Dashboard → Project Settings → API → service_role (secret key)\n'
  );
}

export default globalSetup;
