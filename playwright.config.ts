import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Cargar .env.local para que globalSetup tenga acceso a SUPABASE_SERVICE_ROLE_KEY
dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  // Crea/verifica el usuario de test antes de cualquier test
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    // Siempre reutiliza el servidor existente (evita el conflicto de lock de Next.js)
    reuseExistingServer: true,
    timeout: 120000,
  },
});
