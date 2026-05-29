import { useState, useEffect } from 'react';
import { settingsAPI, uploadAPI } from '../../services/api';
import type { SiteSettings } from '../../services/api';

export const SettingsTab = ({ settings, onRefresh }: { settings: SiteSettings | null, onRefresh: () => void }) => {
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
        homeSliderImages: '[]',
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: '',
        socialYoutube: '',
    });
    const [saving, setSaving] = useState(false);

    // State for managing home slider images
    const [sliderImages, setSliderImages] = useState<{ url: string, description: string }[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                ...settings,
                homeSliderImages: settings.homeSliderImages || '[]'
            });
            try {
                if (settings.homeSliderImages) {
                    setSliderImages(JSON.parse(settings.homeSliderImages));
                }
            } catch (e) {
                console.error('Failed to parse homeSliderImages', e);
            }
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                homeSliderImages: JSON.stringify(sliderImages)
            };
            await settingsAPI.update(dataToSave);
            alert('Settings saved successfully!');
            onRefresh();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
        setSaving(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" value={formData.heroTitle} onChange={e => setFormData({ ...formData, heroTitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="NOT ME, BUT YOU" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input type="text" value={formData.heroSubtitle} onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="National Service Scheme - JSPM RSCOE" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                            <input type="text" value={formData.heroCta} onChange={e => setFormData({ ...formData, heroCta: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Join Us / Register" />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Statistics Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 1 - Events</label>
                            <input type="text" value={formData.statEventsCount} onChange={e => setFormData({ ...formData, statEventsCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="50+" />
                            <input type="text" value={formData.statEventsLabel} onChange={e => setFormData({ ...formData, statEventsLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Events Conducted" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 2 - Volunteers</label>
                            <input type="text" value={formData.statVolunteersCount} onChange={e => setFormData({ ...formData, statVolunteersCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="200+" />
                            <input type="text" value={formData.statVolunteersLabel} onChange={e => setFormData({ ...formData, statVolunteersLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Volunteers" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 3 - Impact</label>
                            <input type="text" value={formData.statImpactCount} onChange={e => setFormData({ ...formData, statImpactCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="1000+" />
                            <input type="text" value={formData.statImpactLabel} onChange={e => setFormData({ ...formData, statImpactLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Lives Impacted" />
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">About Content</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                            <textarea value={formData.aboutMission} onChange={e => setFormData({ ...formData, aboutMission: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="NSS aims to provide hands on experience..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our History</label>
                            <textarea value={formData.aboutHistory} onChange={e => setFormData({ ...formData, aboutHistory: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Established in..." />
                        </div>
                    </div>
                </div>

                {/* Social Links Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                            <input type="url" value={formData.socialInstagram || ''} onChange={e => setFormData({ ...formData, socialInstagram: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://instagram.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                            <input type="url" value={formData.socialFacebook || ''} onChange={e => setFormData({ ...formData, socialFacebook: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://facebook.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                            <input type="url" value={formData.socialTwitter || ''} onChange={e => setFormData({ ...formData, socialTwitter: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://twitter.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                            <input type="url" value={formData.socialYoutube || ''} onChange={e => setFormData({ ...formData, socialYoutube: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://youtube.com/@NSSRSCOE" />
                        </div>
                    </div>
                </div>

                {/* Home Slider Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-nss-blue">Home Slider Images</h3>
                        <span className="text-sm text-gray-500">{sliderImages.length} / 6 Images</span>
                    </div>

                    <div className="space-y-4">
                        {sliderImages.map((img, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded bg-gray-50">
                                <div className="w-full md:w-1/3">
                                    <img src={uploadAPI.getFullUrl(img.url)} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Brief Description</label>
                                    <textarea
                                        value={img.description}
                                        onChange={e => {
                                            const newImages = [...sliderImages];
                                            newImages[index].description = e.target.value;
                                            setSliderImages(newImages);
                                        }}
                                        className="w-full border rounded px-3 py-2"
                                        rows={3}
                                        placeholder="Enter brief description for this slide..."
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newImages = sliderImages.filter((_, i) => i !== index);
                                                setSliderImages(newImages);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sliderImages.length < 6 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <label className="cursor-pointer">
                                    <span className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition inline-block">
                                        {uploadingImage ? 'Uploading...' : '+ Add Slider Image'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingImage}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingImage(true);
                                                try {
                                                    const result = await uploadAPI.uploadFile(file);
                                                    setSliderImages([...sliderImages, { url: result.url, description: '' }]);
                                                } catch (err) {
                                                    console.error('Error uploading slider image', err);
                                                    alert('Error uploading image');
                                                }
                                                setUploadingImage(false);
                                                e.target.value = ''; // Reset input
                                            }
                                        }}
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Recommended size: 1920x1080px. You can add {6 - sliderImages.length} more images.</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-nss-blue text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </form>
        </div>
    );
};
