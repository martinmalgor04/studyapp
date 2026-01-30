import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Fixture de autenticación para tests E2E
 * 
 * Uso:
 * test('my authenticated test', async ({ authenticatedPage }) => {
 *   // Ya está logueado con usuario de test
 *   await authenticatedPage.goto('/dashboard');
 * });
 */

export interface AuthFixtures {
  authenticatedPage: Page;
}

// Credenciales del usuario de test
// NOTA: Este usuario debe existir en la base de datos de test
export const TEST_USER = {
  email: 'test@studyapp.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Esperar por el formulario
    await page.waitForSelector('#email', { timeout: 10000 });
    
    // Llenar credenciales
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar redirect al dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    
    // Verificar que estamos logueados
    await expect(page).toHaveURL(/dashboard/);
    
    // Pasar la página autenticada al test
    await use(page);
    
    // Cleanup: logout después del test (opcional)
    // await page.goto('/logout');
  },
});

/**
 * Helper para crear un nuevo usuario via API (si es necesario)
 */
export async function createTestUser(page: Page) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  await page.waitForSelector('#name', { timeout: 10000 });
  
  await page.fill('#name', TEST_USER.name);
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  
  await page.click('button[type="submit"]');
  
  // Esperar redirect
  await page.waitForURL(/login/, { timeout: 10000 });
}

/**
 * Helper para login manual
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.waitForSelector('#email', { timeout: 10000 });
  
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

export { expect };
