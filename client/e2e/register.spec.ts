import { test, expect } from '@playwright/test';

test.describe('Event Registration Flow', () => {
    test('User can view registration form and toggle to lookup mode', async ({ page }) => {
        // Mock the events API to return a dummy upcoming event
        await page.route('**/api/events', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        { id: 1, title: 'NSS Orientation', type: 'upcoming', date: '2027-01-01', description: 'Welcome to NSS' }
                    ]
                })
            });
        });

        // Navigate to the registration page
        await page.goto('/register');

        // Verify the Registration header is present
        const mainHeader = page.getByRole('heading', { name: 'Event Registration' });
        await expect(mainHeader).toBeVisible({ timeout: 10000 });

        // Verify the form fields are visible
        const nameInput = page.getByLabel(/Full Name/i);
        const emailInput = page.getByLabel(/^Email$/i); // Label is exact "Email"
        const phoneInput = page.getByLabel(/^Phone$/i); // Label is exact "Phone"
        
        await expect(nameInput).toBeVisible();
        await expect(emailInput).toBeVisible();
        await expect(phoneInput).toBeVisible();

        // The default view should be 'Register'
        const submitBtn = page.getByRole('button', { name: /Register & Get Pass/i });
        await expect(submitBtn).toBeVisible();

        // Click the Check Pass button to toggle modes
        const lookupToggleBtn = page.getByRole('button', { name: 'Check Pass' });
        await lookupToggleBtn.click();

        // Verify that the view changed to Lookup mode
        const lookupHeader = page.getByRole('heading', { name: 'Lookup Pass' });
        await expect(lookupHeader).toBeVisible();

        const passIdInput = page.getByPlaceholder(/e.g. NSS-1234/i);
        await expect(passIdInput).toBeVisible();

        // Verify we can toggle back to Register mode
        const registerToggleBtn = page.getByRole('button', { name: 'New Registration' });
        await registerToggleBtn.click();

        await expect(mainHeader).toBeVisible();
    });
});
