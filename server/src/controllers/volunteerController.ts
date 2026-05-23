import { Request, Response } from 'express';
import { db } from '../db';
import { volunteers, volunteerProfiles } from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

// Admin: Create new volunteer
export const createVolunteer = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const adminId = (req as AuthRequest).user?.id;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        // Check if email already exists
        const existing = await db.select().from(volunteers)
            .where(eq(volunteers.email, email))
            .limit(1);

        if (existing.length > 0) {
            return res.status(400).json({ message: 'A volunteer with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [newVolunteer] = await db.insert(volunteers).values({
            name,
            email,
            passwordHash,
            createdById: adminId,
        }).returning();

        // Create empty profile for the volunteer
        await db.insert(volunteerProfiles).values({
            volunteerId: newVolunteer.id,
        });

        res.status(201).json({
            id: newVolunteer.id,
            name: newVolunteer.name,
            email: newVolunteer.email,
            isActive: newVolunteer.isActive,
            createdAt: newVolunteer.createdAt,
        });
    } catch (error) {
        console.error('Create volunteer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin: Get all volunteers
export const getAllVolunteers = async (req: Request, res: Response) => {
    try {
        const allVolunteers = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            email: volunteers.email,
            isActive: volunteers.isActive,
            createdAt: volunteers.createdAt,
        }).from(volunteers);

        // Fetch profiles for all volunteers
        const allProfiles = await db.select().from(volunteerProfiles);

        console.log('DEBUG: All profiles from DB:', JSON.stringify(allProfiles, null, 2));

        // Map profiles to volunteers
        const volunteersWithProfiles = allVolunteers.map(volunteer => {
            const profile = allProfiles.find(p => p.volunteerId === volunteer.id);
            console.log(`DEBUG: Volunteer ${volunteer.id} (${volunteer.name}) - Profile found:`, !!profile);
            if (profile) {
                console.log(`  - fullName: ${profile.fullName}, prnNo: ${profile.prnNo}, department: ${profile.department}`);
            }
            return {
                ...volunteer,
                profile: profile || null,
                profileData: profile || null,
            };
        });

        console.log('DEBUG: Final response:', JSON.stringify(volunteersWithProfiles[0], null, 2));

        res.json(volunteersWithProfiles);
    } catch (error) {
        console.error('Get volunteers error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Volunteer: Get public data of all active volunteers
export const getAllPublicVolunteers = async (req: Request, res: Response) => {
    try {
        const activeVolunteers = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            email: volunteers.email,
        }).from(volunteers)
        .where(eq(volunteers.isActive, true));
        
        const activeProfiles = await db.select({
            volunteerId: volunteerProfiles.volunteerId,
            department: volunteerProfiles.department,
            academicYear: volunteerProfiles.academicYear,
            profilePhotoUrl: volunteerProfiles.profilePhotoUrl,
        }).from(volunteerProfiles);

        const result = activeVolunteers.map(volunteer => {
            const profile = activeProfiles.find(p => p.volunteerId === volunteer.id);
            return {
                id: volunteer.id,
                name: volunteer.name,
                email: volunteer.email,
                profile: profile || null,
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Get public volunteers error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Admin: Get single volunteer with profile
export const getVolunteerById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const volunteer = await db.select().from(volunteers)
            .where(eq(volunteers.id, parseInt(id)))
            .limit(1);

        if (volunteer.length === 0) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        const profile = await db.select().from(volunteerProfiles)
            .where(eq(volunteerProfiles.volunteerId, parseInt(id)))
            .limit(1);

        res.json({
            ...volunteer[0],
            profile: profile[0] || null,
        });
    } catch (error) {
        console.error('Get volunteer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin: Update volunteer basic info
export const updateVolunteer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email } = req.body;

    try {
        const [updated] = await db.update(volunteers)
            .set({ name, email, updatedAt: new Date() })
            .where(eq(volunteers.id, parseInt(id)))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update volunteer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin: Delete volunteer
export const deleteVolunteer = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const deleted = await db.delete(volunteers)
            .where(eq(volunteers.id, parseInt(id)))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        res.json({ message: 'Volunteer deleted successfully' });
    } catch (error) {
        console.error('Delete volunteer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin: Toggle volunteer active status
export const toggleVolunteerStatus = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const volunteer = await db.select().from(volunteers)
            .where(eq(volunteers.id, parseInt(id)))
            .limit(1);

        if (volunteer.length === 0) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        const [updated] = await db.update(volunteers)
            .set({ isActive: !volunteer[0].isActive, updatedAt: new Date() })
            .where(eq(volunteers.id, parseInt(id)))
            .returning();

        res.json({
            id: updated.id,
            isActive: updated.isActive,
            message: updated.isActive ? 'Volunteer activated' : 'Volunteer deactivated'
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Volunteer: Get own profile
export const getMyProfile = async (req: Request, res: Response) => {
    const volunteerId = (req as AuthRequest).user?.id;

    try {
        const profile = await db.select().from(volunteerProfiles)
            .where(eq(volunteerProfiles.volunteerId, volunteerId!))
            .limit(1);

        const volunteer = await db.select({
            id: volunteers.id,
            name: volunteers.name,
            email: volunteers.email,
        }).from(volunteers)
            .where(eq(volunteers.id, volunteerId!))
            .limit(1);

        res.json({
            ...volunteer[0],
            profile: profile[0] || null,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Volunteer: Update own profile
export const updateMyProfile = async (req: Request, res: Response) => {
    const volunteerId = (req as AuthRequest).user?.id;
    console.log('DEBUG updateMyProfile req.body:', req.body);
    const {
        fullName,
        prnNo,
        department,
        academicYear,
        nssYear,
        marksheetUrl,
        cgpa,
        eligibilityNo,
        religion,
        caste,
        casteCategory,
        phoneNo,
        emailId,
        profilePhotoUrl,
        experienceText,
    } = req.body;

    try {
        const [updated] = await db.update(volunteerProfiles)
            .set({
                fullName,
                prnNo,
                department,
                academicYear,
                nssYear,
                marksheetUrl,
                cgpa,
                eligibilityNo,
                religion,
                caste,
                casteCategory,
                phoneNo,
                emailId,
                profilePhotoUrl,
                experienceText,
                updatedAt: new Date(),
            })
            .where(eq(volunteerProfiles.volunteerId, volunteerId!))
            .returning();

        if (!updated) {
            // Create profile if it doesn't exist
            const [newProfile] = await db.insert(volunteerProfiles).values({
                volunteerId: volunteerId!,
                fullName,
                prnNo,
                department,
                academicYear,
                nssYear,
                marksheetUrl,
                cgpa,
                eligibilityNo,
                religion,
                caste,
                casteCategory,
                phoneNo,
                emailId,
                profilePhotoUrl,
                experienceText,
            }).returning();
            return res.json(newProfile);
        }

        res.json(updated);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Volunteer: Update password
export const updatePassword = async (req: Request, res: Response) => {
    const volunteerId = (req as AuthRequest).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    try {
        const volunteer = await db.select().from(volunteers)
            .where(eq(volunteers.id, volunteerId!))
            .limit(1);

        if (volunteer.length === 0) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, volunteer[0].passwordHash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await db.update(volunteers)
            .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
            .where(eq(volunteers.id, volunteerId!));

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Public: Get all volunteer experiences
export const getExperiences = async (req: Request, res: Response) => {
    try {
        const allProfiles = await db.select().from(volunteerProfiles);
        
        // Filter profiles that have some experience text
        const experiences = allProfiles
            .filter(profile => profile.experienceText && profile.experienceText.trim() !== '')
            .map(profile => ({
                id: profile.id,
                name: profile.fullName || 'Anonymous',
                role: `Volunteer, ${profile.academicYear} ${profile.department}`,
                text: profile.experienceText,
                image: profile.profilePhotoUrl || 'https://i.pravatar.cc/150?img=1', // Fallback image if needed
            }));

        res.json(experiences);
    } catch (error) {
        console.error('Get experiences error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
