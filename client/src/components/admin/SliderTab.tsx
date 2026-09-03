import { useState } from 'react';
import { uploadAPI } from '../../services/api';
import ImageCropperModal from '../common/ImageCropperModal';
import { useAuthStore } from '../../stores/authStore';
import { decodeToken } from '../../services/api';
import toast from 'react-hot-toast';
import { useEvents } from '../../hooks/useEvents';
import { useSliderImages, useCreateSliderImage, useUpdateSliderImage, useDeleteSliderImage } from '../../hooks/useSlider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { formatDate } from '@/utils/dateFormatter';
export const SliderTab = () => {
    const { token } = useAuthStore();
    const isAdmin = token ? ['admin', 'superadmin'].includes(decodeToken(token)?.role || '') : false;
    
    const { data: sliderImages = [], isLoading } = useSliderImages();
    const { data: events = [] } = useEvents();
    
    const createSlider = useCreateSliderImage();
    const updateSlider = useUpdateSliderImage();
    const deleteSlider = useDeleteSliderImage();
    
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropCallback, setCropCallback] = useState<((file: File) => void)>(() => () => {});

    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || '');
            setCropCallback(() => async (croppedFile: File) => {
                setUploadingImage(true);
                try {
                    const res = await uploadAPI.uploadFile(croppedFile);
                    await createSlider.mutateAsync({
                        url: res.url,
                        description: '',
                    });
                    toast.success('Image added to slider! ' + (isAdmin ? '' : 'Pending approval.'));
                } catch (error) {
                    toast.error('Failed to upload image');
                } finally {
                    setUploadingImage(false);
                }
            });
            setCropModalOpen(true);
        });
        reader.readAsDataURL(file);
        
        e.target.value = '';
    };

    const handleUpdate = async (id: number, field: string, value: any) => {
        try {
            await updateSlider.mutateAsync({ id, data: { [field]: value } });
            toast.success('Updated successfully');
        } catch(e) {
            toast.error('Failed to update');
        }
    };

    const handleRemove = async (id: number) => {
        if (!window.confirm('Are you sure you want to remove this slider image?')) return;
        try {
            await deleteSlider.mutateAsync(id);
            toast.success('Image removed');
        } catch(e) {
            toast.error('Failed to remove image');
        }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading slider images...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="shadow-sm border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Home Slider Images</h2>
                        <p className="text-sm text-slate-500 mt-1">{sliderImages.length} image{sliderImages.length !== 1 ? 's' : ''} &mdash; newest shown first</p>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        {sliderImages.map((img) => (
                            <div key={img.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-gray-50 items-start">
                                <div className="w-full md:w-48 shrink-0">
                                    <div className="relative aspect-video rounded overflow-hidden bg-gray-200 border">
                                        <img src={uploadAPI.getFullUrl(img.url)} alt="Slider" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2">
                                            {img.approvalStatus === 'pending' && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>}
                                            {img.approvalStatus === 'approved' && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>}
                                            {img.approvalStatus === 'rejected' && <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 w-full">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                        <input 
                                            type="text" 
                                            defaultValue={img.description} 
                                            onBlur={(e) => {
                                                if (e.target.value !== img.description) {
                                                    handleUpdate(img.id, 'description', e.target.value);
                                                }
                                            }}
                                            className="w-full border rounded px-3 py-2 text-sm focus:ring-nss-blue focus:border-nss-blue"
                                            placeholder="Enter short description..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Event (Optional)</label>
                                        <select 
                                            value={img.eventId || ''} 
                                            onChange={(e) => handleUpdate(img.id, 'eventId', e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full border rounded px-3 py-2 text-sm focus:ring-nss-blue focus:border-nss-blue"
                                        >
                                            <option value="">-- No link --</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.title} ({formatDate(ev.date)})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemove(img.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    title="Remove Image"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}

                        {sliderImages.length === 0 && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                                No slider images added yet.
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t flex justify-end">
                        <label className="cursor-pointer bg-nss-blue text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors inline-block relative overflow-hidden font-medium">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                onChange={handleAddImage}
                                disabled={uploadingImage}
                            />
                            {uploadingImage ? 'Uploading...' : '+ Add Slider Image'}
                        </label>
                    </div>
                </div>
            </Card>

            <ImageCropperModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={cropImageSrc}
                onCropComplete={cropCallback}
                aspectRatio={21/9}
            />
        </div>
    );
};
