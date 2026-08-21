import { useState, useEffect } from 'react';
import type { SiteSettings, EventData } from '../../services/api';
import { uploadAPI, settingsAPI, decodeToken } from '../../services/api';
import ImageCropperModal from '../common/ImageCropperModal';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export type SliderImage = { id: string; url: string; description: string; eventId?: number };

export const SliderTab = ({ settings, events = [], onRefresh }: { settings: SiteSettings | null, events?: EventData[], onRefresh: () => void }) => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;
    
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropCallback, setCropCallback] = useState<((file: File) => void)>(() => () => {});

    useEffect(() => {
        if (settings) {
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
        if (!settings) return;
        setSaving(true);
        try {
            const dataToSave = {
                ...settings,
                homeSliderImages: JSON.stringify(sliderImages)
            };
            await settingsAPI.update(dataToSave);
            toast.success('Slider images saved successfully!');
            onRefresh();
        } catch (error) {
            console.error('Error saving slider settings:', error);
            toast.error('Error saving slider settings');
        }
        setSaving(false);
    };

    if (!isSuperadmin) {
        return <div className="p-6 text-center text-gray-500">You do not have permission to edit site settings.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Home Slider Images</h2>
                    <p className="text-sm text-gray-500 mt-1">{sliderImages.length} image{sliderImages.length !== 1 ? 's' : ''} &mdash; newest shown first</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Slider Settings'}
                </button>
            </div>

            <div className="space-y-4">
                {sliderImages.map((img, index) => (
                    <div key={img.id} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded bg-gray-50">
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

            <ImageCropperModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={cropImageSrc}
                onCropComplete={cropCallback}
            />
        </div>
    );
};
