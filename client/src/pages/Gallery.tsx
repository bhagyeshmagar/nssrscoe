import { useState, useEffect } from 'react';
import { galleryAPI, uploadAPI } from '../services/api';

interface GalleryItem {
    id: number;
    title?: string;
    url: string;
    type: 'image' | 'video';
    eventId?: number;
    createdAt: string;
}

const Gallery = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await galleryAPI.getAll();
                setItems(response.data);
            } catch (error) {
                console.error('Error fetching gallery:', error);
            }
            setLoading(false);
        };
        fetchGallery();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Gallery</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Gallery</h1>

            {items.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-xl">No gallery items yet.</p>
                    <p className="mt-2">Check back soon for photos and videos from our events!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="relative group cursor-pointer"
                            onClick={() => item.type === 'image' && setSelectedImage(uploadAPI.getFullUrl(item.url))}
                        >
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                {item.type === 'video' ? (
                                    <div className="w-full h-full relative">
                                        <video
                                            src={uploadAPI.getFullUrl(item.url)}
                                            className="w-full h-full object-cover"
                                            controls
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={uploadAPI.getFullUrl(item.url)}
                                        alt={item.title || 'Gallery image'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                )}
                            </div>
                            {item.title && (
                                <p className="mt-2 text-sm text-gray-600 text-center">{item.title}</p>
                            )}
                            {item.type === 'image' && (
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                                    <span className="text-white text-2xl">🔍</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        ×
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

export default Gallery;
