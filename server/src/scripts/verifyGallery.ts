import request from 'supertest';
import app from '../index';
import { db } from '../db';
import { admins, gallery } from '../db/schema';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'nss_admin_secret_key_2024';

const createToken = (id: number, role: string) => {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });
};

async function runTests() {
    console.log('Running End-to-End API Verification for Gallery...\n');

    let superadmin: any, regularAdmin: any;
    let pendingId: number | null = null;
    let saId: number | null = null;

    try {
        // 1. Setup Test Admins
        [superadmin] = await db.insert(admins).output().values({
            username: 'test_superadmin',
            passwordHash: 'mock',
            isSuperadmin: true
        });

        [regularAdmin] = await db.insert(admins).output().values({
            username: 'test_admin',
            passwordHash: 'mock',
            isSuperadmin: false
        });

        const saToken = createToken(superadmin.id, 'superadmin');
        const adminToken = createToken(regularAdmin.id, 'admin');

        console.log('✔ Setup complete. Created test superadmin and regular admin.');

        // 2. Regular Admin Upload -> pending
        const rAdminUpload = await request(app)
            .post('/api/gallery')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Admin Upload',
                url: '/uploads/admin.jpg',
                type: 'image'
            });

        if (rAdminUpload.body.data.status !== 'pending') {
            throw new Error(`Expected admin upload to be pending, got ${rAdminUpload.body.data.status}`);
        }
        console.log('✔ Regular admin upload defaults to "pending".');
        pendingId = rAdminUpload.body.data.id;

        // 3. Pending Item Hidden from Public
        const publicGet1 = await request(app).get('/api/gallery');
        const foundPending = publicGet1.body.data.find((i: any) => i.id === pendingId);
        if (foundPending) throw new Error('Pending item leaked into public route!');
        console.log('✔ Pending item is correctly hidden from public `/api/gallery` route.');

        // 4. Superadmin Upload -> approved
        const saUpload = await request(app)
            .post('/api/gallery')
            .set('Authorization', `Bearer ${saToken}`)
            .send({
                title: 'Superadmin Upload',
                url: '/uploads/sa.jpg',
                type: 'image'
            });

        if (saUpload.body.data.status !== 'approved') {
            throw new Error(`Expected superadmin upload to be approved, got ${saUpload.body.data.status}`);
        }
        console.log('✔ Superadmin upload automatically defaults to "approved".');
        saId = saUpload.body.data.id;

        // 5. Approved Item Visible to Public
        const publicGet2 = await request(app).get('/api/gallery');
        const foundApproved = publicGet2.body.data.find((i: any) => i.id === saId);
        if (!foundApproved) throw new Error('Approved item not found in public route!');
        console.log('✔ Approved item is visible on public `/api/gallery` route.');

        // 6. Regular Admin tries to Approve (Should Fail)
        const illegalApprove = await request(app)
            .put(`/api/gallery/${pendingId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
            
        if (illegalApprove.status !== 403) {
            throw new Error(`Expected 403 Forbidden for admin approve, got ${illegalApprove.status}`);
        }
        console.log('✔ requireSuperAdmin successfully blocks regular admin from approving.');

        // 7. Superadmin Rejects Item
        const saReject = await request(app)
            .put(`/api/gallery/${pendingId}/reject`)
            .set('Authorization', `Bearer ${saToken}`)
            .send({ reason: 'Needs better crop' });
            
        if (saReject.body.data.status !== 'rejected') {
            throw new Error('Failed to reject item');
        }
        console.log('✔ Superadmin successfully rejects item.');

        // 8. Rejected item still hidden from public
        const publicGet3 = await request(app).get('/api/gallery');
        const foundRejected = publicGet3.body.data.find((i: any) => i.id === pendingId);
        if (foundRejected) throw new Error('Rejected item leaked into public route!');
        console.log('✔ Rejected item remains hidden from public `/api/gallery` route.');

        // 9. Regular Admin Updates Rejected Item -> Resets to Pending and clears reason
        const updateRejected = await request(app)
            .put(`/api/gallery/${pendingId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Fixed Admin Upload' });

        if (updateRejected.body.data.status !== 'pending' || updateRejected.body.data.rejectionReason !== null) {
            throw new Error('Item did not properly reset to pending/null reason on update');
        }
        console.log('✔ Regular admin edit successfully resets rejected item to pending and clears rejection reason.');

        console.log('\n🎉 All checks passed! The Gallery workflow is definitively hardened.');
    } catch (err) {
        console.error('\n❌ Test failed:', err);
        process.exitCode = 1;
    } finally {
        // Cleanup
        console.log('\nCleaning up test data...');
        if (pendingId) await db.delete(gallery).where(eq(gallery.id, pendingId));
        if (saId) await db.delete(gallery).where(eq(gallery.id, saId));
        if (superadmin) await db.delete(admins).where(eq(admins.id, superadmin.id));
        if (regularAdmin) await db.delete(admins).where(eq(admins.id, regularAdmin.id));
        process.exit();
    }
}

runTests();
