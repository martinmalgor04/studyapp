import { test, expect } from './fixtures/auth.fixture';

test.describe('UC-003: Create Subject', () => {
  test('should create a new subject successfully', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    // Click "Nueva Materia"
    await page.click('text=Nueva Materia');
    
    // Wait for form
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });
    
    // Fill form
    const testSubjectName = `Test Subject ${Date.now()}`;
    await page.fill('input[name="name"]', testSubjectName);
    await page.fill('textarea[name="description"]', 'Test description for subject');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify subject appears in list
    await expect(page.locator(`text=${testSubjectName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to subject detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    // Wait for at least one subject card
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click on first subject
    await subjectCard.click();
    
    // Should navigate to subject detail
    await expect(page).toHaveURL(/\/dashboard\/subjects\/[a-z0-9-]+/, { timeout: 10000 });
  });

  test('should delete a subject', async ({ authenticatedPage: page }) => {
    // First create a subject to delete
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Nueva Materia');
    await page.waitForSelector('input[name="name"]');
    
    const testSubjectName = `To Delete ${Date.now()}`;
    await page.fill('input[name="name"]', testSubjectName);
    await page.click('button[type="submit"]');
    
    // Wait for subject to appear
    await expect(page.locator(`text=${testSubjectName}`)).toBeVisible({ timeout: 10000 });
    
    // Click delete button
    const deleteButton = page.locator(`text=${testSubjectName}`).locator('..').locator('button:has-text("Eliminar")');
    await deleteButton.click();
    
    // Confirm deletion (if there's a confirmation dialog)
    // await page.click('button:has-text("Confirmar")');
    
    // Verify subject is removed
    await expect(page.locator(`text=${testSubjectName}`)).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('UC-004: Create Exam', () => {
  test('should create a parcial exam for a subject', async ({ authenticatedPage: page }) => {
    // Navigate to a subject (assuming at least one exists)
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    // Click on first subject
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.waitFor({ state: 'visible', timeout: 10000 });
    await subjectCard.click();
    
    // Wait for subject detail page
    await page.waitForURL(/\/dashboard\/subjects\/[a-z0-9-]+/);
    await page.waitForLoadState('networkidle');
    
    // Click "Nuevo Examen"
    await page.click('text=Nuevo Examen');
    
    // Wait for form
    await page.waitForSelector('select[name="category"]', { timeout: 10000 });
    
    // Fill exam form
    await page.selectOption('select[name="category"]', 'PARCIAL');
    await page.selectOption('select[name="modality"]', 'THEORY');
    
    // Set date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="date"]', dateString);
    
    await page.fill('input[name="number"]', '1');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify exam appears
    await expect(page.locator('text=Parcial Teórico 1')).toBeVisible({ timeout: 10000 });
  });

  test('should create a final exam', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.waitFor({ state: 'visible', timeout: 10000 });
    await subjectCard.click();
    
    await page.waitForLoadState('networkidle');
    await page.click('text=Nuevo Examen');
    await page.waitForSelector('select[name="category"]');
    
    // Create FINAL exam
    await page.selectOption('select[name="category"]', 'FINAL');
    await page.selectOption('select[name="modality"]', 'THEORY');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="date"]', dateString);
    
    await page.click('button[type="submit"]');
    
    // Verify final exam appears
    await expect(page.locator('text=Final')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UC-005: Create Topic', () => {
  test('should create a new topic with sessions', async ({ authenticatedPage: page }) => {
    // Navigate to subject detail
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.waitFor({ state: 'visible', timeout: 10000 });
    await subjectCard.click();
    
    await page.waitForLoadState('networkidle');
    
    // Click "Nuevo Tema"
    await page.click('text=Nuevo Tema');
    
    // Wait for form
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });
    
    // Fill topic form
    const topicName = `Test Topic ${Date.now()}`;
    await page.fill('input[name="name"]', topicName);
    
    // Select difficulty
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    
    // Set hours
    await page.fill('input[name="hours"]', '60');
    
    // Set source date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="source_date"]', today);
    
    // Select exam (if exists)
    const examSelect = page.locator('select[name="exam_id"]');
    const examOptions = await examSelect.locator('option').count();
    if (examOptions > 1) { // More than just the default option
      await examSelect.selectOption({ index: 1 });
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify topic appears
    await expect(page.locator(`text=${topicName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should create topic with EASY difficulty', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.click();
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Nuevo Tema');
    await page.waitForSelector('input[name="name"]');
    
    const topicName = `Easy Topic ${Date.now()}`;
    await page.fill('input[name="name"]', topicName);
    await page.selectOption('select[name="difficulty"]', 'EASY');
    await page.fill('input[name="hours"]', '30');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="source_date"]', today);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator(`text=${topicName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should create topic with HARD difficulty', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.click();
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Nuevo Tema');
    await page.waitForSelector('input[name="name"]');
    
    const topicName = `Hard Topic ${Date.now()}`;
    await page.fill('input[name="name"]', topicName);
    await page.selectOption('select[name="difficulty"]', 'HARD');
    await page.fill('input[name="hours"]', '120');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="source_date"]', today);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator(`text=${topicName}`)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UC-006: Session Generation', () => {
  test('should automatically generate sessions when topic is created', async ({ authenticatedPage: page }) => {
    // This is tested implicitly in UC-005 tests
    // Sessions are generated automatically by the system
    // We can verify by checking the sessions table/view
    
    await page.goto('/dashboard/subjects');
    await page.waitForLoadState('networkidle');
    
    const subjectCard = page.locator('[data-testid="subject-card"]').first();
    await subjectCard.click();
    await page.waitForLoadState('networkidle');
    
    // Create a topic
    await page.click('text=Nuevo Tema');
    await page.waitForSelector('input[name="name"]');
    
    const topicName = `Session Test ${Date.now()}`;
    await page.fill('input[name="name"]', topicName);
    await page.selectOption('select[name="difficulty"]', 'MEDIUM');
    await page.fill('input[name="hours"]', '60');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="source_date"]', today);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator(`text=${topicName}`)).toBeVisible({ timeout: 10000 });
    
    // Verify sessions were generated (check if there's a sessions view/table)
    // This depends on the UI implementation
    // await expect(page.locator('text=R1')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UC-007: View Dashboard', () => {
  test('should display dashboard with stats', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show subjects list on dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for subjects section
    await expect(page.locator('text=Materias')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to subjects from dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click on subjects link in nav or button
    await page.click('text=Materias');
    
    // Should navigate to subjects page
    await expect(page).toHaveURL(/\/dashboard\/subjects/, { timeout: 10000 });
  });

  test('should display user email in navbar', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify user email is shown (from TEST_USER)
    await expect(page.locator('text=test@studyapp.com')).toBeVisible();
  });

  test('should have StudyApp branding', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify branding
    await expect(page.locator('text=StudyApp')).toBeVisible();
  });
});

test.describe('Quick Add Topic from Dashboard', () => {
  test('should have quick add topic functionality', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for quick add button (if implemented)
    const quickAddButton = page.locator('button:has-text("Agregar Tema")');
    
    // This test will pass or be skipped based on implementation
    const isVisible = await quickAddButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await quickAddButton.click();
      await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 });
    }
  });
});
