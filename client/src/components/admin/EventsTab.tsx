import { useState, useEffect } from 'react';
import { eventImagesAPI, uploadAPI } from '../../services/api';
import type { EventData, EventImage } from '../../services/api';
import ImageCropperModal from '../common/ImageCropperModal';
import { useFlash } from './Shared';
import { useAuthStore } from '../../stores/authStore';
import { decodeToken } from '../../services/api';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents';
import { useAcademicYears, useCurrentAcademicYear } from '../../hooks/useAcademicYears';

import { formatDate } from '@/utils/dateFormatter';
export const EventsTab = () => {
    const { token } = useAuthStore();
    const isAdmin = token ? ['admin', 'superadmin'].includes(decodeToken(token)?.role || '') : false;
    const { data: years = [] } = useAcademicYears();
    const { data: currentAY } = useCurrentAcademicYear();
    const { data: events = [], isLoading } = useEvents();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const { flash } = useFlash();
    
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<EventData | null>(null);
    
    const [formData, setFormData] = useState<EventData>({
        id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0, driveLink: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [masterIndex, setMasterIndex] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [existingImages, setExistingImages] = useState<EventImage[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [actionId, setActionId] = useState<number | null>(null);

    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropCallback, setCropCallback] = useState<((file: File) => void)>(() => () => { });

    const fetchEventImages = async (eventId: number) => {
        try {
            const response = await eventImagesAPI.getByEvent(eventId);
            setExistingImages(response.data.data || []);
        } catch (error: any) {
            console.error('Error fetching event images:', error);
            flash('err', error.response?.data?.message || 'Failed to load event images.');
        }
    };

    useEffect(() => {
        if (editingItem) {
            setFormData({
                id: editingItem.id,
                title: editingItem.title,
                description: editingItem.description,
                date: editingItem.date?.split('T')[0] || '',
                location: editingItem.location,
                type: editingItem.type || 'upcoming',
                volunteersCount: editingItem.volunteersCount || 0,
                driveLink: editingItem.driveLink || ''
            });
            fetchEventImages(editingItem.id);
            setShowForm(true);
        }
    }, [editingItem]);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setCropCallback(() => (croppedFile: File) => {
                setSelectedFiles(prev => [...prev, croppedFile]);
                const preview = URL.createObjectURL(croppedFile);
                setImagePreviews(prev => [...prev, preview]);
            });
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }
};

const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
    });
    if (masterIndex === index) {
        setMasterIndex(0);
    } else if (masterIndex > index) {
        setMasterIndex(masterIndex - 1);
    }
};

const setNewMaster = (index: number) => {
    setMasterIndex(index);
    setExistingImages(prev => prev.map(img => ({ ...img, isMaster: false })));
};

const removeExistingImage = async (imageId: number) => {
    if (confirm('Delete this image?')) {
        try {
            await eventImagesAPI.delete(imageId);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            flash('ok', 'Image deleted.');
        } catch (error: any) {
            console.error('Error deleting image:', error);
            flash('err', error.response?.data?.message || 'Failed to delete image.');
        }
    }
};

const setExistingMaster = async (imageId: number) => {
    if (editingItem) {
        try {
            await eventImagesAPI.setMaster(editingItem.id, imageId);
            setExistingImages(prev => prev.map(img => ({ ...img, isMaster: img.id === imageId })));
            setMasterIndex(-1);
            flash('ok', 'Master image set.');
        } catch (error: any) {
            console.error('Error setting master:', error);
            flash('err', error.response?.data?.message || 'Failed to set master image.');
        }
    }
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
        let eventId = editingItem?.id;

        if (editingItem) {
            await updateEvent.mutateAsync({ id: editingItem.id, data: formData });
        } else {
            const response = await createEvent.mutateAsync(formData);
            eventId = response.data.data.id;
        }

        if (selectedFiles.length > 0 && eventId) {
            try {
                const uploadedImages = await Promise.all(
                    selectedFiles.map(async (file, index) => {
                        const result = await uploadAPI.uploadFile(file);
                        return {
                            url: result.url,
                            isMaster: index === masterIndex,
                            caption: ''
                        };
                    })
                );
                await eventImagesAPI.add(eventId, uploadedImages);
            } catch (imgError: any) {
                console.error('Error uploading images:', imgError);
                flash('err', 'Event saved, but failed to upload some images. Please try uploading them again.');
                setUploading(false);
                return;
            }
        }

        flash('ok', editingItem ? 'Event updated.' : 'Event created.');
        resetForm();
    } catch (error: any) {
        console.error('Error saving event:', error);
        flash('err', error.response?.data?.message || 'Failed to save event.');
    } finally {
        setUploading(false);
    }
};

const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setActionId(id);
    try {
        await deleteEvent.mutateAsync(id);
    } catch (error: any) {
        console.error('Error deleting event:', error);
        flash('err', error.response?.data?.message || 'Failed to delete event.');
    } finally {
        setActionId(null);
    }
};

const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0, driveLink: '' });
    setSelectedFiles([]);
    setImagePreviews(prev => {
        prev.forEach(p => URL.revokeObjectURL(p));
        return [];
    });
    setExistingImages([]);
    setMasterIndex(0);
};

return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Manage Events</h2>
            {currentAY && !currentAY.isLocked && isAdmin && (
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Event
                </button>
            )}
        </div>

        {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Event' : 'Add New Event'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="border rounded px-3 py-2" />
                        <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border rounded px-3 py-2" />
                        <input type="text" placeholder="Location" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="border rounded px-3 py-2" />
                        <input type="url" placeholder="Google Drive Link (Optional)" value={formData.driveLink} onChange={e => setFormData({ ...formData, driveLink: e.target.value })} className="border rounded px-3 py-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Count</label>
                            <input
                                type="number"
                                placeholder="Number of volunteers"
                                min="0"
                                value={formData.volunteersCount || ''}
                                onChange={e => setFormData({ ...formData, volunteersCount: parseInt(e.target.value) || 0 })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Add Event Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="border rounded px-3 py-2 w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">First image will be the banner. Click star to set master.</p>
                        </div>
                    </div>

                    {existingImages.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                            <div className="flex flex-wrap gap-2">
                                {existingImages.map((img) => (
                                    <div key={img.id} className="relative group">
                                        <img
                                            src={uploadAPI.getFullUrl(img.url)}
                                            alt="Event"
                                            className={`h-24 w-24 object-cover rounded border-2 ${img.isMaster ? 'border-yellow-500' : 'border-gray-200'}`}
                                        />
                                        {img.isMaster && (
                                            <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                            <button type="button" onClick={() => setExistingMaster(img.id)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                            <button type="button" onClick={() => removeExistingImage(img.id)} className="bg-red-500 text-white p-1 rounded text-xs">✖</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {imagePreviews.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">New Images to Upload:</p>
                            <div className="flex flex-wrap gap-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className={`h-24 w-24 object-cover rounded border-2 ${masterIndex === index ? 'border-yellow-500' : 'border-gray-200'}`}
                                        />
                                        {masterIndex === index && (
                                            <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                            <button type="button" onClick={() => setNewMaster(index)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                            <button type="button" onClick={() => removeSelectedFile(index)} className="bg-red-500 text-white p-1 rounded text-xs">✖</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="border rounded px-3 py-2 w-full" rows={3} />

                    <div className="flex gap-2">
                        <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                            {uploading ? 'Uploading...' : 'Save'}
                        </button>
                        <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Volunteers</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading events...</td></tr>
                    ) : events.map((event: EventData) => (
                        <tr key={event.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{event.title}</td>
                            <td className="px-4 py-3">{formatDate(event.date)}</td>
                            <td className="px-4 py-3">{event.location}</td>
                            <td className="px-4 py-3">{event.volunteersCount || 0}</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        event.type === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                        event.type === 'today' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {event.type?.toUpperCase()}
                                    </span>
                                    {event.approvalStatus === 'pending' && <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-800">Pending</span>}
                                    {event.approvalStatus === 'approved' && <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800">Approved</span>}
                                    {event.approvalStatus === 'rejected' && <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">Rejected</span>}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                {(!years.find(y => y.id === event.academicYearId)?.isLocked) && isAdmin && (
                                    <>
                                        <button onClick={() => setEditingItem(event)} disabled={actionId === event.id} className="text-blue-600 hover:underline mr-3 disabled:opacity-50">Edit</button>
                                        <button onClick={() => handleDelete(event.id)} disabled={actionId === event.id} className="text-red-600 hover:underline disabled:opacity-50">Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {!isLoading && events.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No events found. Click "Add Event" to create one.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        <ImageCropperModal
            isOpen={cropModalOpen}
            imageSrc={cropImageSrc}
            aspectRatio={undefined}
            onClose={() => setCropModalOpen(false)}
            onCropComplete={(croppedFile) => {
                setCropModalOpen(false);
                cropCallback(croppedFile);
            }}
        />
    </div>
);
};
