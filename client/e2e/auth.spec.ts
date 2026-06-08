import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
  // Navigate to the login URL
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/NSS/);

  // Expect the page to have a login heading
  const heading = page.getByRole('heading', { name: /NSS Login/i });
  await expect(heading).toBeVisible();

  // Expect email and password inputs to exist
  await expect(page.getByLabel(/Email \/ Username/i)).toBeVisible();
  await expect(page.getByLabel(/Password/i)).toBeVisible();

  // Expect a login button
  await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
});
