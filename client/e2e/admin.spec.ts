import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
    test('Admin can login and view the dashboard tabs', async ({ page }) => {
        // Intercept the login API request to return a successful admin login
        await page.route('**/api/auth/login', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbkBlbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpc1N1cGVyYWRtaW4iOnRydWUsImV4cCI6MjY3ODQwMDAwMH0.fake_signature',
                    role: 'admin',
                    isSuperadmin: true,
                    user: { id: 1, username: 'admin@email.com', isSuperadmin: true }
                })
            });
        });

        // Intercept the /api/auth/me request which validates the session
        await page.route('**/api/auth/me', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    valid: true,
                    role: 'admin',
                    isSuperadmin: true,
                    user: { id: 1, username: 'admin@email.com', isSuperadmin: true }
                })
            });
        });

        await page.goto('/login');

        const emailInput = page.getByLabel(/Email \/ Username/i);
        const passwordInput = page.getByLabel(/Password/i);
        const loginButton = page.getByRole('button', { name: /Sign In/i });

        await emailInput.fill('admin@email.com');
        await passwordInput.fill('admin123');
        await loginButton.click();

        // Should redirect to /admin
        await expect(page).toHaveURL(/\/admin/);

        // Check if the Admin Dashboard header is present
        const mainHeader = page.getByRole('heading', { name: 'NSS Admin' });
        await expect(mainHeader).toBeVisible({ timeout: 10000 });
    });
});

