import { test, expect } from '@playwright/test';

test.describe('Image Cropper Flow', () => {
    test('Admin can open the cropper modal and see freeform tools', async ({ page }) => {
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

        // Mock settings data
        await page.route('**/api/settings', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        homeSliderImages: '[]',
                        aboutTeamPhoto: ''
                    }
                })
            });
        });
        
        await page.route('**/api/events', route => {
             route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify({ data: [] })
             });
        });

        await page.route('**/api/gallery', route => {
             route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify({ data: [] })
             });
        });

        await page.route('**/api/members', route => {
             route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify({ data: [] })
             });
        });

        await page.route('**/api/academic-years*', route => {
             route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify({ data: [] })
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

        // Click on the Settings tab
        const settingsTab = page.locator('button:has-text("Settings")');
        await settingsTab.click();

        // Click on the upload button in Settings Tab (Home Slider)
        // Playwright can't easily trigger the OS file picker, so we set the file on the input directly
        const fileChooserPromise = page.waitForEvent('filechooser');
        
        // Find the "Add Slider Image" button (which wraps the file input)
        const addImageBtn = page.getByText('+ Add Slider Image');
        await addImageBtn.click();
        
        const fileChooser = await fileChooserPromise;
        // Create a dummy image buffer to upload
        const dummyImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
        );
        
        await fileChooser.setFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: dummyImageBuffer
        });

        // The cropper modal should appear
        const modalHeading = page.getByRole('heading', { name: 'Crop Image' });
        await expect(modalHeading).toBeVisible();

        // The rotate button should be visible (as added in the new react-cropper implementation)
        const rotateButton = page.getByRole('button', { name: /Rotate 90°/i });
        await expect(rotateButton).toBeVisible();
        
        // The instructions for freeform crop should be visible
        await expect(page.getByText(/Drag borders and corners to freely adjust crop area/i)).toBeVisible();
        
        // Cancel the crop
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(modalHeading).not.toBeVisible();
    });
});
