import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel(/Email \/ Username/i);
    const passwordInput = page.getByLabel(/Password/i);
    const loginButton = page.getByRole('button', { name: /Sign In/i });

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword123');
    await loginButton.click();

    // Since we don't have this user in the DB, the server should return 401
    // The UI should display an error message
    // We look for a toast or error div containing "Invalid" or "failed" or similar
    // The actual error text is 'Invalid email or password' or from the API
    const errorMessage = page.getByText(/Invalid|fail/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});
