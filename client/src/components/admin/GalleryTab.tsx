import { useState, useEffect } from 'react';
import { galleryAPI, uploadAPI } from '../../services/api';

export const GalleryTab = ({ gallery, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<any>({ title: '', description: '', url: '', type: 'image' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
    const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');

    useEffect(() => {
        if (editingItem) {
            setFormData({ title: editingItem.title, description: editingItem.description || '', url: editingItem.url, type: editingItem.type });
            setFilePreview(uploadAPI.getFullUrl(editingItem.url));
            setUploadMediaType(editingItem.type);
            setShowForm(true);
        }
    }, [editingItem]);

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
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
        }
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
                alert('Please select a file to upload');
                setUploading(false);
                return;
            }

            const galleryData = { ...formData, url, type: uploadMediaType };

            if (editingItem) {
                await galleryAPI.update(editingItem.id, galleryData);
            } else {
                await galleryAPI.create(galleryData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving gallery item:', error);
            alert('Error saving gallery item');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await galleryAPI.delete(id);
            onRefresh();
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

    const openUploadForm = (type: 'image' | 'video') => {
        resetForm();
        setUploadMediaType(type);
        setFormData({ ...formData, type });
        setShowForm(true);
    };

    const images = gallery.filter((item: any) => item.type !== 'video');
    const videos = gallery.filter((item: any) => item.type === 'video');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Gallery</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => openUploadForm('image')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
                    >
                        📷 Add Image
                    </button>
                    <button
                        onClick={() => openUploadForm('video')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"
                    >
                        🎥 Add Video
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-l-nss-blue">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {uploadMediaType === 'video' ? '🎥' : '📷'}
                        {editingItem ? `Edit ${uploadMediaType === 'video' ? 'Video' : 'Image'}` : `Add New ${uploadMediaType === 'video' ? 'Video' : 'Image'}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                            <input
                                type="text"
                                placeholder={`Enter ${uploadMediaType} title`}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                required
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
                    {images.map((item: any) => (
                        <div key={item.id} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img src={uploadAPI.getFullUrl(item.url)} alt={item.title || 'Gallery'} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
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
                    {videos.map((item: any) => (
                        <div key={item.id} className="relative group bg-black rounded-lg overflow-hidden">
                            <video
                                src={uploadAPI.getFullUrl(item.url)}
                                className="w-full aspect-video object-cover"
                                controls
                            />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
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
        </div>
    );
};
