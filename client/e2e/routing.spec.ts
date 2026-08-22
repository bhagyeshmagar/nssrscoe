import { test, expect } from '@playwright/test';

test.describe('Routing and Navigation', () => {
  test('redirects unauthenticated users from protected admin route to login', async ({ page }) => {
    // Navigate to a protected admin route
    await page.goto('/admin');
    
    // Wait for the redirect to happen (should go to /login)
    await page.waitForURL('**/login');
    
    // Ensure the login heading is visible
    const heading = page.getByRole('heading', { name: /NSS Login/i });
    await expect(heading).toBeVisible();
  });

  test('redirects unauthenticated users from protected volunteer route to login', async ({ page }) => {
    // Navigate to a protected volunteer route
    await page.goto('/volunteer');
    
    // Wait for the redirect to happen (should go to /login)
    await page.waitForURL('**/login');
    
    // Ensure the login heading is visible
    const heading = page.getByRole('heading', { name: /NSS Login/i });
    await expect(heading).toBeVisible();
  });

  test('can navigate to public pages via the navbar', async ({ page }) => {
    await page.goto('/');

    // Check if Navbar renders the NSS logo text (assuming it has it)
    await expect(page.getByAltText(/NSS Logo/i).first()).toBeVisible();

    // Click the "Events" or "Gallery" link. Let's try Gallery.
    // If the navbar uses a hamburger menu on mobile, Playwright runs desktop by default
    const galleryLink = page.getByRole('link', { name: /Gallery/i }).first();
    
    if (await galleryLink.isVisible()) {
        await galleryLink.click();
        await page.waitForURL('**/gallery');
        await expect(page).toHaveURL(/.*gallery/);
    }
  });
});
