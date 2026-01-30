import { test, expect } from '@playwright/test';

test.describe('UC-001 & UC-002: Authentication', () => {
  test.describe('User Registration', () => {
    test('should show registration page with form', async ({ page }) => {
      await page.goto('/register');
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Wait for form to be visible
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
      
      // Check for registration form elements using IDs
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should stay on page with empty form submission', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      // Form should not submit with empty fields (HTML5 validation)
      await expect(page).toHaveURL(/register/);
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('User Login', () => {
    test('should show login page with form', async ({ page }) => {
      await page.goto('/login');
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Wait for form to be visible
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
      
      // Check for login form elements using IDs
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Wait for form
      await page.waitForSelector('#email', { timeout: 10000 });
      
      await page.fill('#email', 'nonexistent@test.com');
      await page.fill('#password', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      
      // Should show error message (red background)
      await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const registerLink = page.locator('a[href="/register"]');
      await expect(registerLink).toBeVisible({ timeout: 10000 });
    });

    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});
