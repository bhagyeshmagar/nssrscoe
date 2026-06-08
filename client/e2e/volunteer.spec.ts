import { test, expect } from '@playwright/test';

test.describe('Volunteer Dashboard Flow', () => {
    test('Volunteer can login and view their dashboard', async ({ page }) => {
        // Intercept socket.io to avoid console errors
        await page.route('**/socket.io/?EIO=4&transport=polling**', route => {
            route.fulfill({ status: 200, body: 'ok' });
        });

        // Intercept ALL API requests to prevent unmocked endpoints from returning 401 and crashing the dashboard
        await page.route('**/api/**', route => {
            const url = route.request().url();
            
            if (url.includes('/auth/login')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6IlZvbHVudGVlciBUZXN0IiwiZW1haWwiOiJ2b2x1bnRlZXJAZW1haWwuY29tIiwicm9sZSI6InZvbHVudGVlciIsImV4cCI6MjY3ODQwMDAwMH0.fake_signature',
                        role: 'volunteer',
                        user: { id: 2, name: 'Volunteer Test', email: 'volunteer@email.com' }
                    })
                });
            } else if (url.includes('/auth/verify')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        valid: true,
                        role: 'volunteer',
                        user: { id: 2, name: 'Volunteer Test', email: 'volunteer@email.com', role: 'volunteer' }
                    })
                });
            } else if (url.includes('/volunteer-profiles/me')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: {
                            profile: { fullName: 'Volunteer Test', prnNo: '12345' },
                            department: 'Computer'
                        }
                    })
                });
            } else {
                // Fallback for notifications, attendance, volunteers list, etc.
                route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
            }
        });

        // Navigate to the login page
        await page.goto('/login');

        // Fill in the login form
        const emailInput = page.getByLabel(/Email/i);
        const passwordInput = page.getByLabel(/Password/i);
        const loginButton = page.getByRole('button', { name: /Sign In/i });

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();

        await emailInput.fill('volunteer@email.com');
        await passwordInput.fill('volunteer123');
        await loginButton.click();

        // Should redirect to /volunteer
        await expect(page).toHaveURL(/\/volunteer/);

        // Check if the Volunteer Dashboard header is present
        const mainHeader = page.getByText('Volunteer Dashboard', { exact: true });
        await expect(mainHeader.first()).toBeVisible({ timeout: 10000 });

        // Verify that the user's name is displayed
        const welcomeText = page.getByText(/Welcome.*volunteer@email\.com/i);
        await expect(welcomeText).toBeVisible();

        // Check if essential tabs are present
        const profileTab = page.getByRole('tab', { name: /Profile/i });
        const volunteersTab = page.getByRole('tab', { name: /Fellow Volunteers/i });
        const notificationsTab = page.getByRole('tab', { name: /Notifications/i });

        await expect(profileTab).toBeVisible();
        await expect(volunteersTab).toBeVisible();
        await expect(notificationsTab).toBeVisible();

        // Click a tab to ensure it becomes active
        await volunteersTab.click();
        
        // Check if the volunteers tab is active
        await expect(volunteersTab).toHaveAttribute('data-state', 'active');
    });
});
