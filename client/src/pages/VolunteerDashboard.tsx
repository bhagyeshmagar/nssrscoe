import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { volunteerProfileAPI, uploadAPI, decodeToken, volunteersAPI } from '../services/api';
import type { VolunteerProfileData, VolunteerData } from '../services/api';

// JSPMS RSCOE Departments
const DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
];

const ACADEMIC_YEARS = ['FE', 'SE', 'TE', 'BE'];
const NSS_YEARS = [1, 2];
const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'NT', 'SBC', 'VJ/DT'];

type TabType = 'profile' | 'volunteers';

const VolunteerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [userName, setUserName] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);

    // Volunteers list
    const [allVolunteers, setAllVolunteers] = useState<VolunteerData[]>([]);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);

    // Password change states
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Profile form state
    const [profile, setProfile] = useState<VolunteerProfileData & { department?: string }>({
        fullName: '',
        prnNo: '',
        department: '',
        collegeYearAtEnrollment: '',
        nssYear: undefined,
        marksheetUrl: '',
        cgpa: '',
        eligibilityNo: '',
        religion: '',
        caste: '',
        casteCategory: '',
        phoneNo: '',
        emailId: '',
        profilePhotoUrl: '',
        experienceText: '',
    });

    useEffect(() => {
        fetchProfile();

        // Get user name from token
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUserName(decoded.email || decoded.username || '');
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'volunteers') {
            fetchAllVolunteers();
        }
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const response = await volunteerProfileAPI.getMyProfile();
            // Since the backend uses ok(res, data) wrapper, response.data has { success: true, data: { ... } }
            // So we need to extract .data from response.data!
            const data = (response.data as any).data || response.data;
            if (data.profile) {
                setHasProfile(true);
                setProfile({
                    fullName: data.profile.fullName || '',
                    prnNo: data.profile.prnNo || '',
                    department: data.department || '', // From VolunteerData
                    collegeYearAtEnrollment: data.profile.collegeYearAtEnrollment || '',
                    nssYear: data.profile.nssYear || undefined,
                    marksheetUrl: data.profile.marksheetUrl || '',
                    cgpa: data.profile.cgpa || '',
                    eligibilityNo: data.profile.eligibilityNo || '',
                    religion: data.profile.religion || '',
                    caste: data.profile.caste || '',
                    casteCategory: data.profile.casteCategory || '',
                    phoneNo: data.profile.phoneNo || '',
                    emailId: data.profile.emailId || data.email || '',
                    profilePhotoUrl: data.profile.profilePhotoUrl || '',
                    experienceText: data.profile.experienceText || '',
                });
            } else {
                setHasProfile(false);
                setIsEditing(true); // No profile, start in edit mode
                setProfile(prev => ({ 
                    ...prev, 
                    emailId: data.email || '',
                    department: data.department || '',
                    fullName: data.name || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllVolunteers = async () => {
        setLoadingVolunteers(true);
        try {
            const response = await volunteersAPI.getAllPublic();
            const volunteersArr = (response.data as any)?.data ?? response.data;
            setAllVolunteers(Array.isArray(volunteersArr) ? volunteersArr : []);
        } catch (error) {
            console.error('Error fetching volunteers:', error);
        } finally {
            setLoadingVolunteers(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await volunteerProfileAPI.updateProfile(profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setHasProfile(true);
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Invalid file type. Please upload PDF, DOCX, or image files.' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
            return;
        }

        setUploadingFile(true);
        try {
            const response = await uploadAPI.uploadFile(file);
            setProfile(prev => ({ ...prev, marksheetUrl: response.url }));
            setMessage({ type: 'success', text: 'Marksheet uploaded successfully!' });
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload file' });
        } finally {
            setUploadingFile(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Invalid file type. Please upload an image file (JPEG, PNG, JPG).' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File too large. Maximum size is 2MB.' });
            return;
        }

        setUploadingFile(true);
        try {
            const response = await uploadAPI.uploadFile(file);
            setProfile(prev => ({ ...prev, profilePhotoUrl: response.url }));
            setMessage({ type: 'success', text: 'Profile photo uploaded successfully!' });
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload photo' });
        } finally {
            setUploadingFile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        try {
            await volunteerProfileAPI.updatePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password change error:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    // Profile View Card (Read-only)
    const renderProfileViewCard = () => (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>
                <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-nss-blue text-white rounded-lg hover:bg-blue-900 transition"
                >
                    ✏️ Edit Profile
                </button>
            </div>

            {profile.profilePhotoUrl && (
                <div className="mb-6 flex justify-center">
                    <img src={uploadAPI.getFullUrl(profile.profilePhotoUrl)} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInfoField("Full Name", profile.fullName || '-')}
                {renderInfoField("PRN No", profile.prnNo || '-')}
                {renderInfoField('Department', profile.department || '-')}
                {renderInfoField('Academic Year', profile.collegeYearAtEnrollment || '-')}
                {renderInfoField('NSS Year', profile.nssYear ? `Year ${profile.nssYear}` : '')}
                {renderInfoField("CGPA", profile.cgpa || '-')}
                {renderInfoField("Eligibility No", profile.eligibilityNo || '-')}
                {renderInfoField("Religion", profile.religion || '-')}
                {renderInfoField("Caste", profile.caste || '-')}
                {renderInfoField("Caste Category", profile.casteCategory || '-')}
                {renderInfoField("Phone Number", profile.phoneNo || '-')}
                {renderInfoField("Email ID", profile.emailId || '-')}
            </div>

            <div className="mt-6">
                {renderInfoField("Volunteering Experience", profile.experienceText || 'No experience shared yet.')}
            </div>

            {profile.marksheetUrl && (
                <div className="mt-6 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Marksheet</label>
                    <a
                        href={uploadAPI.getFullUrl(profile.marksheetUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nss-blue hover:underline inline-flex items-center gap-2"
                    >
                        📄 View Uploaded Marksheet
                    </a>
                </div>
            )}
        </div>
    );

    // Info Field Component for view mode
    const renderInfoField = (label: string, value: string) => (
        <div key={label}>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            <p className="text-gray-900 font-medium bg-gray-50 px-4 py-3 rounded-lg">{value || '-'}</p>
        </div>
    );

    // Profile Edit Form
    const renderProfileEditForm = () => (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                    {hasProfile ? 'Edit Profile' : 'Complete Your Profile'}
                </h2>
                {hasProfile && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="mb-8 flex flex-col items-center">
                {profile.profilePhotoUrl ? (
                    <img src={uploadAPI.getFullUrl(profile.profilePhotoUrl)} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-4" />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-4">
                        No Photo
                    </div>
                )}
                <label className="cursor-pointer text-sm text-nss-blue hover:underline bg-blue-50 px-4 py-2 rounded-lg font-medium">
                    Upload Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingFile} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter your full name"
                        required
                    />
                </div>

                {/* 2. PRN No */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        PRN No <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={profile.prnNo}
                        onChange={(e) => setProfile(prev => ({ ...prev, prnNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter PRN number"
                        required
                    />
                </div>

                {/* 3. Department */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.department}
                        onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* 4. Academic Year */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.collegeYearAtEnrollment}
                        onChange={(e) => setProfile(prev => ({ ...prev, collegeYearAtEnrollment: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select Academic Year</option>
                        {ACADEMIC_YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* 5. NSS Year */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        NSS Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.nssYear || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, nssYear: parseInt(e.target.value) || undefined }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select NSS Year</option>
                        {NSS_YEARS.map(year => (
                            <option key={year} value={year}>Year {year}</option>
                        ))}
                    </select>
                </div>

                {/* 6. CGPA */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                    <input
                        type="text"
                        value={profile.cgpa}
                        onChange={(e) => setProfile(prev => ({ ...prev, cgpa: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="e.g. 8.5"
                    />
                </div>

                {/* 7. Eligibility No */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility No</label>
                    <input
                        type="text"
                        value={profile.eligibilityNo}
                        onChange={(e) => setProfile(prev => ({ ...prev, eligibilityNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter eligibility number"
                    />
                </div>

                {/* 8. Religion */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <input
                        type="text"
                        value={profile.religion}
                        onChange={(e) => setProfile(prev => ({ ...prev, religion: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter religion"
                    />
                </div>

                {/* 9. Caste */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                    <input
                        type="text"
                        value={profile.caste}
                        onChange={(e) => setProfile(prev => ({ ...prev, caste: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter caste"
                    />
                </div>

                {/* 10. Caste Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste Category</label>
                    <select
                        value={profile.casteCategory}
                        onChange={(e) => setProfile(prev => ({ ...prev, casteCategory: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    >
                        <option value="">Select Category</option>
                        {CASTE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* 11. Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={profile.phoneNo}
                        onChange={(e) => setProfile(prev => ({ ...prev, phoneNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter phone number"
                        required
                    />
                </div>

                {/* 12. Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={profile.emailId}
                        onChange={(e) => setProfile(prev => ({ ...prev, emailId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Enter email address"
                        disabled={true}
                        required
                    />
                </div>
            </div>

            {/* Experience Text */}
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteering Experience <span className="text-gray-400 text-xs font-normal">(Shown on public page)</span>
                </label>
                <textarea
                    value={profile.experienceText}
                    onChange={(e) => setProfile(prev => ({ ...prev, experienceText: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    placeholder="Share your experience working with NSS JSPM RSCOE..."
                    rows={4}
                />
            </div>

            {/* Marksheet Upload */}
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marksheet (PDF/DOCX/Image, max 5MB)
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept=".pdf,.docx,image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-nss-blue file:text-white hover:file:bg-blue-900"
                        disabled={uploadingFile}
                    />
                    {uploadingFile && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {profile.marksheetUrl && (
                    <div className="mt-2">
                        <a
                            href={uploadAPI.getFullUrl(profile.marksheetUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-nss-blue hover:underline"
                        >
                            View uploaded marksheet
                        </a>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-nss-blue text-white rounded-lg hover:bg-blue-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Saving...
                        </span>
                    ) : 'Save Profile'}
                </button>
            </div>
        </form>
    );

    // Volunteers List Tab
    const VolunteersList = () => (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Current NSS Volunteers</h2>

            {loadingVolunteers ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nss-blue"></div>
                </div>
            ) : allVolunteers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active volunteers found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allVolunteers.map((volunteer) => (
                        <div key={volunteer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-nss-blue rounded-full flex items-center justify-center text-white text-lg font-bold">
                                    {volunteer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{volunteer.name}</h3>
                                    <p className="text-sm text-gray-500">{volunteer.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-nss-blue">Volunteer Dashboard</h1>
                            <p className="text-gray-500">Welcome, {userName}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 px-6 py-4 text-center font-medium transition ${activeTab === 'profile'
                                ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📋 My Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('volunteers')}
                            className={`flex-1 px-6 py-4 text-center font-medium transition ${activeTab === 'volunteers'
                                ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            👥 All Volunteers
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'profile' ? (
                    <>
                        {isEditing ? renderProfileEditForm() : renderProfileViewCard()}

                        {/* Password Change Section */}
                        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">Update Password</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className="text-nss-blue hover:underline"
                                >
                                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                                </button>
                            </div>

                            {showPasswordForm && (
                                <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="px-6 py-2 bg-nss-blue text-white rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                                    >
                                        {changingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <VolunteersList />
                )}
            </div>
        </div>
    );
};

export default VolunteerDashboard;
