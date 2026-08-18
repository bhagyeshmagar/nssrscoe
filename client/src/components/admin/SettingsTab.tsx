import { useState, useEffect } from 'react';
import ImageCropperModal from '../common/ImageCropperModal';
import { settingsAPI, uploadAPI, decodeToken } from '../../services/api';
import type { SiteSettings, EventData } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

type SliderImage = { id: string; url: string; description: string; eventId?: number };

export const SettingsTab = ({ settings, events = [], onRefresh }: { settings: SiteSettings | null, events?: EventData[], onRefresh: () => void }) => {
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
        homeSliderImages: '[]',
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: '',
        socialYoutube: '',
    });
    const [saving, setSaving] = useState(false);

    // State for managing home slider images
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
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
                ...settings,
                homeSliderImages: settings.homeSliderImages || '[]'
            });
            try {
                if (settings.homeSliderImages) {
                    const parsed = JSON.parse(settings.homeSliderImages);
                    if (Array.isArray(parsed)) {
                        setSliderImages(parsed.map((img: any) => ({ ...img, id: img.id || crypto.randomUUID() })));
                    }
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
            toast.success('Settings saved successfully!');
            onRefresh();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings');
        }
        setSaving(false);
    };

    if (!isSuperadmin) {
        return <div className="p-6 text-center text-gray-500">You do not have permission to edit site settings.</div>;
    }

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our History (Vision)</label>
                            <textarea value={formData.aboutHistory} onChange={e => setFormData({ ...formData, aboutHistory: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Established in..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">NSS Team Photo</label>
                            <div className="flex items-center gap-4">
                                {formData.aboutTeamPhoto && (
                                    <img src={uploadAPI.getFullUrl(formData.aboutTeamPhoto)} alt="Team Photo" className="h-20 w-32 object-cover rounded shadow" />
                                )}
                                <label className="cursor-pointer">
                                    <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                        {uploadingTeamPhoto ? 'Uploading...' : (formData.aboutTeamPhoto ? 'Change Photo' : 'Upload Photo')}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingTeamPhoto}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    setCropImageSrc(reader.result as string);
                                                    setCropAspect(undefined);
                                                    setCropCallback(() => async (croppedFile: File) => {
                                                        setUploadingTeamPhoto(true);
                                                        try {
                                                            const result = await uploadAPI.uploadFile(croppedFile);
                                                            setFormData({ ...formData, aboutTeamPhoto: result.url });
                                                        } catch (err) {
                                                            console.error('Error uploading team photo', err);
                                                            toast.error('Error uploading image');
                                                        }
                                                        setUploadingTeamPhoto(false);
                                                    });
                                                    setCropModalOpen(true);
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leadership Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Leadership Messages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Director's Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 border-b pb-2">Director's Info</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Director's Name</label>
                                <input type="text" value={formData.aboutDirectorName || ''} onChange={e => setFormData({ ...formData, aboutDirectorName: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Dr. XYZ" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Director's Message</label>
                                <textarea value={formData.aboutDirectorMessage || ''} onChange={e => setFormData({ ...formData, aboutDirectorMessage: e.target.value })} className="w-full border rounded px-3 py-2" rows={5} placeholder="Message from the Director..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Director's Photo</label>
                                <div className="flex items-center gap-4">
                                    {formData.aboutDirectorPhoto && (
                                        <img src={uploadAPI.getFullUrl(formData.aboutDirectorPhoto)} alt="Director" className="h-20 w-20 object-cover rounded-full shadow" />
                                    )}
                                    <label className="cursor-pointer">
                                        <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                            {uploadingDirectorPhoto ? 'Uploading...' : (formData.aboutDirectorPhoto ? 'Change Photo' : 'Upload Photo')}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingDirectorPhoto}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setCropImageSrc(reader.result as string);
                                                        setCropAspect(1);
                                                        setCropCallback(() => async (croppedFile: File) => {
                                                            setUploadingDirectorPhoto(true);
                                                            try {
                                                                const result = await uploadAPI.uploadFile(croppedFile);
                                                                setFormData({ ...formData, aboutDirectorPhoto: result.url });
                                                            } catch (err) {
                                                                console.error('Error uploading director photo', err);
                                                                toast.error('Error uploading image');
                                                            }
                                                            setUploadingDirectorPhoto(false);
                                                        });
                                                        setCropModalOpen(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* NSS PO's Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 border-b pb-2">NSS PO's Info</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NSS PO's Name</label>
                                <input type="text" value={formData.aboutPoName || ''} onChange={e => setFormData({ ...formData, aboutPoName: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Prof. ABC" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NSS PO's Message</label>
                                <textarea value={formData.aboutPoMessage || ''} onChange={e => setFormData({ ...formData, aboutPoMessage: e.target.value })} className="w-full border rounded px-3 py-2" rows={5} placeholder="Message from the NSS PO..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">NSS PO's Photo</label>
                                <div className="flex items-center gap-4">
                                    {formData.aboutPoPhoto && (
                                        <img src={uploadAPI.getFullUrl(formData.aboutPoPhoto)} alt="NSS PO" className="h-20 w-20 object-cover rounded-full shadow" />
                                    )}
                                    <label className="cursor-pointer">
                                        <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                            {uploadingPoPhoto ? 'Uploading...' : (formData.aboutPoPhoto ? 'Change Photo' : 'Upload Photo')}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingPoPhoto}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setCropImageSrc(reader.result as string);
                                                        setCropAspect(1);
                                                        setCropCallback(() => async (croppedFile: File) => {
                                                            setUploadingPoPhoto(true);
                                                            try {
                                                                const result = await uploadAPI.uploadFile(croppedFile);
                                                                setFormData({ ...formData, aboutPoPhoto: result.url });
                                                            } catch (err) {
                                                                console.error('Error uploading PO photo', err);
                                                                toast.error('Error uploading image');
                                                            }
                                                            setUploadingPoPhoto(false);
                                                        });
                                                        setCropModalOpen(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
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
                        <span className="text-sm text-gray-500">{sliderImages.length} image{sliderImages.length !== 1 ? 's' : ''} &mdash; newest shown first</span>
                    </div>

                    <div className="space-y-4">
                        {sliderImages.map((img, index) => (
                            <div key={img.id} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded bg-gray-50">
                                {/* Badge for first image */}
                                <div className="w-full md:w-1/3 relative">
                                    {index === 0 && (
                                        <span className="absolute top-1 left-1 bg-nss-blue text-white text-xs px-2 py-0.5 rounded z-10">First Shown</span>
                                    )}
                                    <img src={uploadAPI.getFullUrl(img.url)} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
                                        <textarea
                                            value={img.description}
                                            onChange={e => {
                                                setSliderImages(sliderImages.map(s => s.id === img.id ? { ...s, description: e.target.value } : s));
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                            rows={2}
                                            placeholder="Enter brief description for this slide..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Event <span className="font-normal text-gray-400">(optional — clicking the slide will prompt users to visit this event)</span></label>
                                        <select
                                            value={img.eventId ?? ''}
                                            onChange={e => {
                                                const eventId = e.target.value ? Number(e.target.value) : undefined;
                                                setSliderImages(sliderImages.map(s => s.id === img.id ? { ...s, eventId } : s));
                                            }}
                                            className="w-full border rounded px-3 py-2 bg-white text-sm"
                                        >
                                            <option value="">— No event link —</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>
                                                    [{ev.type === 'upcoming' ? 'Upcoming' : 'Past'}] {ev.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to remove this slider image?')) {
                                                    setSliderImages(sliderImages.filter(s => s.id !== img.id));
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Upload — always visible, no limit */}
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
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCropImageSrc(reader.result as string);
                                                setCropAspect(undefined);
                                                setCropCallback(() => async (croppedFile: File) => {
                                                    setUploadingImage(true);
                                                    try {
                                                        const result = await uploadAPI.uploadFile(croppedFile);
                                                        setSliderImages([{ id: crypto.randomUUID(), url: result.url, description: '', eventId: undefined }, ...sliderImages]);
                                                    } catch (err) {
                                                        console.error('Error uploading slider image', err);
                                                        toast.error('Error uploading image');
                                                    }
                                                    setUploadingImage(false);
                                                });
                                                setCropModalOpen(true);
                                            };
                                            reader.readAsDataURL(file);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </label>
                            <p className="text-sm text-gray-500 mt-2">Recommended size: 1920×1080px. No upload limit. New images appear first.</p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving || uploadingImage || uploadingTeamPhoto || uploadingDirectorPhoto || uploadingPoPhoto}
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
