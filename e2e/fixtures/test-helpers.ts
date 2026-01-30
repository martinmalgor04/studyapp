import { Page } from '@playwright/test';

/**
 * Test helpers and fixtures for E2E tests
 */

// Test user credentials (should exist in test database)
export const TEST_USER = {
  email: 'test@studyapp.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Login as the test user
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Create a subject via UI
 */
export async function createSubject(page: Page, name: string, description = ''): Promise<void> {
  await page.goto('/dashboard/subjects');
  await page.click('text=Nueva Materia');
  await page.fill('input[name="name"]', name);
  if (description) {
    await page.fill('textarea[name="description"]', description);
  }
  await page.click('button[type="submit"]');
  await page.waitForSelector(`text=${name}`);
}

/**
 * Create an exam via UI
 */
export async function createExam(
  page: Page,
  type: string,
  date: string,
  number?: number
): Promise<void> {
  await page.click('text=Nuevo Examen');
  await page.selectOption('select[name="type"]', type);
  await page.fill('input[name="date"]', date);
  if (number !== undefined) {
    await page.fill('input[name="number"]', String(number));
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000); // Wait for form to close
}

/**
 * Create a topic via UI
 */
export async function createTopic(
  page: Page,
  name: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
  hours = 60
): Promise<void> {
  await page.click('text=Nuevo Tema');
  await page.fill('input[name="name"]', name);
  await page.selectOption('select[name="difficulty"]', difficulty);
  await page.fill('input[name="hours"]', String(hours));
  await page.fill('input[name="source_date"]', new Date().toISOString().split('T')[0]);
  await page.click('button[type="submit"]');
  await page.waitForSelector(`text=${name}`);
}

/**
 * Generate a future date string
 */
export function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}
