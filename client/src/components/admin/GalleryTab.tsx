import { useState, useEffect } from 'react';
import { uploadAPI } from '../../services/api';
import type { GalleryData } from '../../services/api';
import ImageCropperModal from '../common/ImageCropperModal';
import { useFlash } from './Shared';
import {
    useGallery, useCreateGalleryItem, useUpdateGalleryItem,
    useDeleteGalleryItem, useApproveGalleryItem, useRejectGalleryItem
} from '../../hooks/useGallery';

export type GalleryItem = GalleryData & { id: number; createdAt?: string; };

const statusBadge = (status?: string) => {
    if (status === 'pending') return <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded z-10 shadow">Pending</span>;
    if (status === 'rejected') return <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded z-10 shadow">Rejected</span>;
    return null;
};

const PendingGalleryApprovals = ({ items, onApprove, onReject, actionId }: { items: GalleryItem[]; onApprove: (id: number) => void; onReject: (id: number, reason: string) => void; actionId: number | null }) => {
    const pending = items.filter(i => i.status === 'pending');
    if (pending.length === 0) return null;
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 shadow-sm">
            <h3 className="font-semibold text-yellow-800 mb-3">Pending Approval ({pending.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pending.map(item => (
                    <div key={item.id} className="bg-white rounded-lg border shadow-sm p-3 flex flex-col">
                        <div className="relative aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                            {item.type === 'video' ? (
                                <video src={uploadAPI.getFullUrl(item.url)} controls className="w-full h-full object-cover" />
                            ) : (
                                <img src={uploadAPI.getFullUrl(item.url)} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate" title={item.title || item.description}>{item.title || item.description || 'Untitled'}</p>
                        <p className="text-xs text-gray-500 mb-3">{item.type.toUpperCase()}</p>
                        <div className="flex gap-2 mt-auto">
                            <button onClick={() => onApprove(item.id)} disabled={actionId === item.id} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded hover:bg-green-700 font-medium disabled:opacity-50">Approve</button>
                            <button onClick={() => { const reason = prompt('Rejection reason (optional):') || ''; onReject(item.id, reason); }} disabled={actionId === item.id} className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700 font-medium disabled:opacity-50">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GalleryTab = ({ isSuperadmin }: { isSuperadmin?: boolean }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const { data: gallery = [], isLoading } = useGallery(true); // true for admin fetch
    const createGalleryItem = useCreateGalleryItem();
    const updateGalleryItem = useUpdateGalleryItem();
    const deleteGalleryItem = useDeleteGalleryItem();
    const approveGalleryItem = useApproveGalleryItem();
    const rejectGalleryItem = useRejectGalleryItem();

    const { msg, flash } = useFlash();
    const [formData, setFormData] = useState<Partial<GalleryData>>({ title: '', description: '', url: '', type: 'image' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
    const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');

    const [actionId, setActionId] = useState<number | null>(null);

    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');

    useEffect(() => {
        if (editingItem) {
            setFormData({ title: editingItem.title, description: editingItem.description || '', url: editingItem.url, type: editingItem.type });
            setFilePreview(uploadAPI.getFullUrl(editingItem.url));
            setUploadMediaType(editingItem.type || 'image');
            setShowForm(true);
        }
    }, [editingItem, setShowForm]);

    // Memory cleanup for object URLs
    useEffect(() => {
        return () => {
            if (filePreview && filePreview.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (uploadMediaType === 'image') {
                const reader = new FileReader();
                reader.onload = () => {
                    setCropImageSrc(reader.result as string);
                    setCropModalOpen(true);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            } else {
                setSelectedFile(file);
                setFilePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setSelectedFile(croppedFile);
        setFilePreview(URL.createObjectURL(croppedFile));
        setCropModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let url = formData.url;

            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                url = uploadResult.url;
            }

            if (!url) {
                flash('err', 'Please select a file to upload');
                setUploading(false);
                return;
            }

            const galleryData = { ...formData, url, type: uploadMediaType } as GalleryData;

            if (editingItem) {
                await updateGalleryItem.mutateAsync({ id: editingItem.id, data: galleryData });
            } else {
                await createGalleryItem.mutateAsync(galleryData);
            }
            resetForm();
        } catch (error: any) {
            console.error("Gallery Submission Error:", error);
            // Check if the error came from the upload step (AxiosError)
            if (error.response?.data?.message) {
                flash('err', error.response.data.message);
            } else {
                flash('err', `Unexpected error: ${error.message || String(error)}`);
            }
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            setActionId(id);
            try {
                await deleteGalleryItem.mutateAsync(id);
            } catch (error) {
                // Toast handles the error display
            }
            setActionId(null);
        }
    };

    const handleApprove = async (id: number) => {
        setActionId(id);
        try {
            await approveGalleryItem.mutateAsync(id);
        } catch (e: any) {
            // Toast handles error
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (id: number, reason: string) => {
        setActionId(id);
        try {
            await rejectGalleryItem.mutateAsync({ id, reason });
        } catch (e: any) {
            // Toast handles error
        } finally {
            setActionId(null);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ title: '', description: '', url: '', type: 'image' });
        setSelectedFile(null);
        if (filePreview && filePreview.startsWith('blob:')) {
            URL.revokeObjectURL(filePreview);
        }
        setFilePreview('');
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64 text-gray-500 font-medium animate-pulse">Loading gallery...</div>;
    }

    const images = (gallery as GalleryItem[]).filter((item: GalleryItem) => item.type !== 'video');
    const videos = (gallery as GalleryItem[]).filter((item: GalleryItem) => item.type === 'video');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gallery Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            resetForm();
                            setUploadMediaType('image');
                            setShowForm(true);
                        }}
                        className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add Image
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setUploadMediaType('video');
                            setShowForm(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Add Video
                    </button>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}

            {isSuperadmin && <PendingGalleryApprovals items={gallery as GalleryItem[]} onApprove={handleApprove} onReject={handleReject} actionId={actionId} />}

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-l-nss-blue">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {uploadMediaType === 'video' ? '🎥' : '📷'}
                        {editingItem ? `Edit ${uploadMediaType === 'video' ? 'Video' : 'Image'}` : `Add New ${uploadMediaType === 'video' ? 'Video' : 'Image'}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title </label>
                            <input
                                type="text"
                                placeholder={`Enter ${uploadMediaType} title`}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description </label>
                            <textarea
                                placeholder="Enter description/caption..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="border rounded px-3 py-2 w-full h-24"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload {uploadMediaType === 'video' ? 'Video' : 'Image'} *
                            </label>
                            <input
                                type="file"
                                accept={uploadMediaType === 'video' ? 'video/*' : 'image/*'}
                                onChange={handleFileChange}
                                className="border rounded px-3 py-2 w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {uploadMediaType === 'video'
                                    ? 'Supported: MP4, WebM, MOV (max 100MB). Videos will be shown on public Videos page.'
                                    : 'Supported: JPG, PNG, GIF, WebP (max 10MB)'
                                }
                            </p>
                        </div>

                        {filePreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                                {uploadMediaType === 'video' ? (
                                    <video src={filePreview} controls className="h-40 w-auto rounded border" />
                                ) : (
                                    <img src={filePreview} alt="Preview" className="h-40 w-auto object-cover rounded border" />
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveMediaTab('images')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'images'
                            ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📷 Images <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">{images.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveMediaTab('videos')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'videos'
                            ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🎥 Videos <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">{videos.length}</span>
                    </button>
                </div>
            </div>

            {activeMediaTab === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((item) => (
                        <div key={item.id} className="relative group">
                            {statusBadge(item.status)}
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img src={uploadAPI.getFullUrl(item.url)} alt={item.title || 'Gallery'} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                                <button onClick={() => setEditingItem(item)} disabled={actionId === item.id} className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50">Edit</button>
                                <button onClick={() => handleDelete(item.id)} disabled={actionId === item.id} className="bg-red-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50">Delete</button>
                            </div>
                            {item.title && <p className="text-sm text-gray-600 mt-1 truncate">{item.title}</p>}
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">📷</span>
                            No images uploaded yet. Click "Add Image" to get started.
                        </div>
                    )}
                </div>
            )}

            {activeMediaTab === 'videos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((item) => (
                        <div key={item.id} className="relative group bg-black rounded-lg overflow-hidden">
                            {statusBadge(item.status)}
                            <video
                                src={uploadAPI.getFullUrl(item.url)}
                                className="w-full aspect-video object-cover"
                                controls
                            />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setEditingItem(item)} disabled={actionId === item.id} className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50">Edit</button>
                                <button onClick={() => handleDelete(item.id)} disabled={actionId === item.id} className="bg-red-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50">Delete</button>
                            </div>
                            {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                                    <p className="text-white font-medium truncate">{item.title}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {videos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">🎥</span>
                            No videos uploaded yet. Click "Add Video" to get started.
                            <p className="text-sm mt-1">Uploaded videos will appear on the public Videos page.</p>
                        </div>
                    )}
                </div>
            )}

            <ImageCropperModal
                isOpen={cropModalOpen}
                imageSrc={cropImageSrc}
                aspectRatio={undefined}
                onClose={() => setCropModalOpen(false)}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};
