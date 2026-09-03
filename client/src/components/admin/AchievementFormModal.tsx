import { useState, useEffect } from 'react';
import { uploadAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { getErrorMessage } from '@/utils/errors';
import { useCreateAchievement, useUpdateAchievement } from '@/hooks/useAchievements';
import type { Achievement } from '@/types/achievement';

interface AchievementFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Achievement | null;
    academicYears: { id: number; label: string }[];
}

export const AchievementFormModal = ({ isOpen, onClose, onSuccess, initialData, academicYears }: AchievementFormModalProps) => {
    const createMutation = useCreateAchievement();
    const updateMutation = useUpdateAchievement();

    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        academicYearId: '' as string | number,
        imageUrl: '',
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                date: initialData.date ? initialData.date.slice(0, 10) : '',
                academicYearId: initialData.academicYearId ?? '',
                imageUrl: initialData.imageUrl,
            });
            setPreviewUrl(uploadAPI.getFullUrl(initialData.imageUrl));
            setImageFile(null);
        } else if (isOpen) {
            setFormData({ title: '', description: '', date: '', academicYearId: '', imageUrl: '' });
            setPreviewUrl('');
            setImageFile(null);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
        e.target.value = '';

        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormData(prev => ({ ...prev, imageUrl: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl && !imageFile) { toast.error('Image is required'); return; }
        if (!formData.date) { toast.error('Date is required'); return; }

        let finalImageUrl = formData.imageUrl;

        if (imageFile) {
            setUploading(true);
            try {
                const res = await uploadAPI.uploadFile(imageFile);
                finalImageUrl = res.url;
            } catch (err) {
                toast.error(getErrorMessage(err) ?? 'Upload failed');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        const payload = {
            title: formData.title,
            description: formData.description,
            imageUrl: finalImageUrl,
            date: formData.date,
            academicYearId: formData.academicYearId ? Number(formData.academicYearId) : null,
        };

        const opts = {
            onSuccess: async () => {
                toast.success(initialData ? 'Achievement updated' : 'Achievement created');
                if (initialData && imageFile && initialData.imageUrl && initialData.imageUrl !== finalImageUrl) {
                    try {
                        await uploadAPI.deleteFile(initialData.imageUrl);
                    } catch (err) {
                        console.error('Failed to delete old image:', err);
                    }
                }
                onSuccess();
                onClose();
            },
            onError: async (err: unknown) => {
                toast.error(getErrorMessage(err) ?? 'Failed to save');
                if (imageFile && finalImageUrl) {
                    try {
                        await uploadAPI.deleteFile(finalImageUrl);
                    } catch (cleanupErr) {
                        console.error('Failed to cleanup new image after failed save:', cleanupErr);
                    }
                }
            },
        };

        if (initialData) {
            updateMutation.mutate({ id: initialData.id, data: payload }, opts);
        } else {
            createMutation.mutate(payload, opts);
        }
    };

    const submitting = createMutation.isPending || updateMutation.isPending || uploading;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Image Upload */}
                    <div>
                        <Label>Master Image <span className="text-red-500">*</span></Label>
                        {previewUrl ? (
                            <div className="mt-2 relative group rounded-lg overflow-hidden border border-gray-200 aspect-video">
                                <img
                                    src={previewUrl}
                                    alt="Achievement"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, imageUrl: '' }));
                                        setImageFile(null);
                                        setPreviewUrl('');
                                    }}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-nss-blue hover:bg-blue-50/30 transition-colors">
                                <ImagePlus className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-500">Click to upload image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>     
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <Label htmlFor="ach-title">Title <span className="text-red-500">*</span></Label>
                        <Input id="ach-title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required className="mt-1" />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="ach-desc">Description <span className="text-red-500">*</span></Label>
                        <Textarea id="ach-desc" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} required rows={3} className="mt-1" />
                    </div>

                    {/* Date + AY row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="ach-date">Achievement Date <span className="text-red-500">*</span></Label>
                            <Input id="ach-date" type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required className="mt-1" />
                        </div>
                        <div>
                            <Label>Academic Year</Label>
                            <Select value={String(formData.academicYearId || 'none')} onValueChange={v => setFormData(p => ({ ...p, academicYearId: v === 'none' ? '' : v }))}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select AY" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {academicYears.map(ay => (
                                        <SelectItem key={ay.id} value={String(ay.id)}>{ay.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Save Changes' : 'Create Achievement'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
