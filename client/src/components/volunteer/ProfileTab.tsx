import { useState, useEffect, useCallback } from 'react';
import { volunteerProfileAPI, uploadAPI, DEPARTMENTS } from '../../services/api';
import type { VolunteerProfileData } from '../../services/api';
const ACADEMIC_YEARS = ['FY', 'SY', 'TY', 'B-Tech'];
const NSS_YEARS = [1, 2];
const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'NT', 'SBC', 'VJ/DT'];
const PORTFOLIOS = [
    'Event', 'PR', 'Social Media', 'Graphic design', 'Documentation',
    'Hospitality', 'Cultural', 'Technical', 'Website'
];

export const ProfileTab = ({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);

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
        portfolioChoices: '',
    });

    const fetchProfile = useCallback(async () => {
        try {
            const response = await volunteerProfileAPI.getMyProfile();
            const data = (response.data as { data?: any }).data || response.data;
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
                    portfolioChoices: data.profile.portfolioChoices || '',
                });
            } else {
                setHasProfile(false);
                setIsEditing(true); // No profile, start in edit mode
                setProfile((prev) => ({
                    ...prev,
                    emailId: data.email || '',
                    department: data.department || '',
                    fullName: data.name || ''
                }));
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    }, [setMessage]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

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
            setProfile((prev) => ({ ...prev, marksheetUrl: response.url }));
            setMessage({ type: 'success', text: 'Marksheet uploaded successfully!' });
        } catch (error: any) {
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
            setProfile((prev) => ({ ...prev, profilePhotoUrl: response.url }));
            setMessage({ type: 'success', text: 'Profile photo uploaded successfully!' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload photo' });
        } finally {
            setUploadingFile(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    const renderInfoField = (label: string, value: string) => (
        <div key={label}>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            <p className="text-gray-900 font-medium bg-gray-50 px-4 py-3 rounded-lg">{value || '-'}</p>
        </div>
    );

    if (!isEditing && hasProfile) {
        return (
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
                    {renderInfoField("Portfolio Choices", profile.portfolioChoices?.split(',').filter(Boolean).join(', ') || '-')}
                </div>

                <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-500">Volunteering Experience</label>
                        {profile.experienceText ? (
                            profile.isExperienceApproved ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">Approved & Public</span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">Pending Admin Approval</span>
                            )
                        ) : null}
                    </div>
                    <div className="text-sm font-medium text-gray-900 bg-gray-50 p-4 rounded-lg italic">
                        {profile.experienceText || 'No experience shared yet.'}
                    </div>
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
    }

    return (
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter your full name"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        PRN No <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={profile.prnNo}
                        onChange={(e) => setProfile((prev) => ({ ...prev, prnNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter PRN number"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.department}
                        onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.collegeYearAtEnrollment}
                        onChange={(e) => setProfile((prev) => ({ ...prev, collegeYearAtEnrollment: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select Academic Year</option>
                        {ACADEMIC_YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        NSS Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={profile.nssYear || ''}
                        onChange={(e) => setProfile((prev) => ({ ...prev, nssYear: parseInt(e.target.value) || undefined }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        required
                    >
                        <option value="">Select NSS Year</option>
                        {NSS_YEARS.map(year => (
                            <option key={year} value={year}>Year {year}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                    <input
                        type="text"
                        value={profile.cgpa}
                        onChange={(e) => setProfile((prev) => ({ ...prev, cgpa: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="e.g. 8.5"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility No</label>
                    <input
                        type="text"
                        value={profile.eligibilityNo}
                        onChange={(e) => setProfile((prev) => ({ ...prev, eligibilityNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter eligibility number"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <input
                        type="text"
                        value={profile.religion}
                        onChange={(e) => setProfile((prev) => ({ ...prev, religion: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter religion"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                    <input
                        type="text"
                        value={profile.caste}
                        onChange={(e) => setProfile((prev) => ({ ...prev, caste: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter caste"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste Category</label>
                    <select
                        value={profile.casteCategory}
                        onChange={(e) => setProfile((prev) => ({ ...prev, casteCategory: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    >
                        <option value="">Select Category</option>
                        {CASTE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={profile.phoneNo}
                        onChange={(e) => setProfile((prev) => ({ ...prev, phoneNo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter phone number"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={profile.emailId}
                        onChange={(e) => setProfile((prev) => ({ ...prev, emailId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Enter email address"
                        disabled={true}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Choice 1</label>
                    <select
                        value={profile.portfolioChoices?.split(',')[0] || ''}
                        onChange={(e) => {
                            const currentChoices = profile.portfolioChoices?.split(',') || ['', ''];
                            currentChoices[0] = e.target.value;
                            setProfile((prev) => ({ ...prev, portfolioChoices: currentChoices.join(',') }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    >
                        <option value="">Select Portfolio</option>
                        {PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Choice 2</label>
                    <select
                        value={profile.portfolioChoices?.split(',')[1] || ''}
                        onChange={(e) => {
                            const currentChoices = profile.portfolioChoices?.split(',') || ['', ''];
                            currentChoices[1] = e.target.value;
                            setProfile((prev) => ({ ...prev, portfolioChoices: currentChoices.join(',') }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    >
                        <option value="">Select Portfolio</option>
                        {PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Volunteering Experience <span className="text-gray-400 text-xs font-normal">(Shown on public page)</span>
                    </label>
                    {profile.experienceText && !isEditing ? null : (
                         profile.experienceText ? (
                            profile.isExperienceApproved ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">Approved & Public</span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">Pending Admin Approval</span>
                            )
                        ) : null
                    )}
                </div>
                <textarea
                    value={profile.experienceText}
                    onChange={(e) => setProfile((prev) => ({ ...prev, experienceText: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                    placeholder="Share your experience working with NSS JSPM RSCOE..."
                    rows={4}
                />
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marksheet (PDF/DOCX/Image, max 5MB)
                </label>
                
                {profile.marksheetUrl ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-green-600 bg-green-100 p-1.5 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <a
                                href={uploadAPI.getFullUrl(profile.marksheetUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-nss-blue hover:underline"
                            >
                                Document Uploaded (Click to view)
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 bg-white px-3 py-1.5 rounded-md shadow-sm transition">
                                Replace
                                <input
                                    type="file"
                                    accept=".pdf,.docx,image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploadingFile}
                                />
                            </label>
                            {uploadingFile && <span className="text-sm text-gray-500">Uploading...</span>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".pdf,.docx,image/*"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-nss-blue file:text-white hover:file:bg-blue-900 cursor-pointer"
                            disabled={uploadingFile}
                        />
                        {uploadingFile && <span className="text-sm text-gray-500">Uploading...</span>}
                    </div>
                )}
            </div>

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
};
