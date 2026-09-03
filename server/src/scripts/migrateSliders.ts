import { db } from '../db/index';
import { siteSettings, homeSliderImages } from '../db/schema';
import { eq } from 'drizzle-orm';

async function migrate() {
    console.log('Migrating slider images...');
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'homeSliderImages'));
    if (settings && settings.value) {
        try {
            const parsed = JSON.parse(settings.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
                for (const img of parsed) {
                    await db.insert(homeSliderImages).values({
                        url: img.url,
                        description: img.description || '',
                        eventId: img.eventId || null,
                        approvalStatus: 'approved',
                    });
                }
                console.log(`Migrated ${parsed.length} images.`);
                
                // Delete the old key so we don't use it anymore
                await db.delete(siteSettings).where(eq(siteSettings.key, 'homeSliderImages'));
                console.log('Deleted old homeSliderImages key from site_settings.');
            } else {
                console.log('No images found to migrate.');
            }
        } catch(e) {
            console.error('Error parsing JSON:', e);
        }
    } else {
        console.log('No slider settings found.');
    }
    process.exit(0);
}

migrate();
