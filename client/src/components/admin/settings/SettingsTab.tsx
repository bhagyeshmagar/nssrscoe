import { useState, useEffect } from 'react';
import ImageCropperModal from '../../common/ImageCropperModal';
import { decodeToken } from '../../../services/api';
import type { SiteSettings } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { AboutSection } from './AboutSection';
import { LeadershipSection } from './LeadershipSection';
import { SocialSection } from './SocialSection';

import { useSettings, useUpdateSettings } from '../../../hooks/useSettings';

export const SettingsTab = () => {
    const { data: settings } = useSettings();
    const updateSettings = useUpdateSettings();
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;
    const [formData, setFormData] = useState<SiteSettings>({
        heroTitle: '',
        heroSubtitle: '',
        heroCta: '',
        statEventsCount: '',
        statEventsLabel: '',
        statVolunteersCount: '',
        statVolunteersLabel: '',
        statImpactCount: '',
        statImpactLabel: '',
        aboutMission: '',
        aboutHistory: '',
        aboutTeamPhoto: '',
        aboutDirectorMessage: '',
        aboutDirectorName: '',
        aboutDirectorPhoto: '',
        aboutPoMessage: '',
        aboutPoName: '',
        aboutPoPhoto: '',
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: '',
        socialYoutube: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState(false);
    const [uploadingDirectorPhoto, setUploadingDirectorPhoto] = useState(false);
    const [uploadingPoPhoto, setUploadingPoPhoto] = useState(false);
    
    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropCallback, setCropCallback] = useState<((file: File) => void)>(() => () => {});
    const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (settings) {
            setFormData({
                ...settings
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                ...formData
            };
            await updateSettings.mutateAsync(dataToSave);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (!isSuperadmin) {
        return <div className="p-6 text-center text-gray-500">You do not have permission to edit site settings.</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                <HeroSection formData={formData} setFormData={setFormData} />
                <StatsSection formData={formData} setFormData={setFormData} />
                <AboutSection 
                    formData={formData} setFormData={setFormData}
                    uploadingTeamPhoto={uploadingTeamPhoto} setUploadingTeamPhoto={setUploadingTeamPhoto}
                    setCropImageSrc={setCropImageSrc} setCropAspect={setCropAspect} setCropCallback={setCropCallback} setCropModalOpen={setCropModalOpen}
                />
                <LeadershipSection 
                    formData={formData} setFormData={setFormData}
                    uploadingDirectorPhoto={uploadingDirectorPhoto} setUploadingDirectorPhoto={setUploadingDirectorPhoto}
                    uploadingPoPhoto={uploadingPoPhoto} setUploadingPoPhoto={setUploadingPoPhoto}
                    setCropImageSrc={setCropImageSrc} setCropAspect={setCropAspect} setCropCallback={setCropCallback} setCropModalOpen={setCropModalOpen}
                />
                <SocialSection formData={formData} setFormData={setFormData} />

                <button
                    type="submit"
                    disabled={saving || uploadingTeamPhoto || uploadingDirectorPhoto || uploadingPoPhoto}
                    className="bg-nss-blue text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </form>

            <ImageCropperModal
                isOpen={cropModalOpen}
                imageSrc={cropImageSrc}
                aspectRatio={cropAspect}
                onClose={() => setCropModalOpen(false)}
                onCropComplete={(croppedFile) => {
                    setCropModalOpen(false);
                    cropCallback(croppedFile);
                }}
            />
        </div>
    );
};
