import { test, expect } from '@playwright/test';

test.describe('Google Drive Links', () => {
    test('Public event card displays Google Drive link if available', async ({ page }) => {
        // Intercept the /api/events request to return mock events with a driveLink
        await page.route('**/api/events', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        {
                            id: 1,
                            title: 'Tree Plantation Drive',
                            description: 'A mock event with a drive link.',
                            date: new Date(Date.now() + 86400000).toISOString(),
                            location: 'College Campus',
                            type: 'upcoming',
                            reportUrl: '',
                            driveLink: 'https://drive.google.com/drive/folders/mockfolder123',
                            academicYearId: 1,
                            createdAt: new Date().toISOString(),
                            masterImage: ''
                        }
                    ]
                })
            });
        });

        // Navigate to the activities page (upcoming events)
        await page.goto('/events/upcoming');

        // Check if the event card is rendered
        const eventTitle = page.getByRole('heading', { name: 'Tree Plantation Drive' });
        await expect(eventTitle).toBeVisible();

        // The drive link button should be visible
        const driveLinkElement = page.getByRole('button', { name: /Open Google Drive Link/i });
        await expect(driveLinkElement).toBeVisible();
        
        // Also verify the drive link appears in the detail view
        await page.getByRole('link', { name: /Tree Plantation Drive/i }).click();
    });
});
