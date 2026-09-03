import { useState, useEffect } from 'react';
import { galleryAPI, uploadAPI } from '../services/api';

interface GalleryItem {
    id: number;
    title?: string;
    description?: string;
    url: string;
    type: 'image' | 'video';
    eventId?: number | null;
    createdAt?: string;
}

const DescriptionText = ({ text }: { text: string }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    
    if (text.length <= 100) {
        return <p className="mt-2 text-sm text-gray-600">{text}</p>;
    }
    
    return (
        <div className="mt-2 text-sm text-gray-600">
            {expanded ? text : `${text.substring(0, 100)}... `}
            <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                className="text-nss-blue hover:underline font-medium"
            >
                {expanded ? 'Show less' : 'more'}
            </button>
        </div>
    );
};

const Gallery = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await galleryAPI.getAll();
                setItems((response.data.data || []).filter((item: GalleryItem) => item.type === 'image'));
            } catch (error) {
                console.error('Error fetching gallery:', error);
            }
            setLoading(false);
        };
        fetchGallery();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
                    <p className="text-xl">No photos yet.</p>
                    <p className="mt-2">Check back soon for photos from our events!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="relative group flex flex-col">
                            <div 
                                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer relative"
                                onClick={() => setSelectedImage(uploadAPI.getFullUrl(item.url))}
                            >
                                <img
                                    src={uploadAPI.getFullUrl(item.url)}
                                    alt={item.title || 'Gallery image'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                                    <span className="text-white text-2xl">🔍</span>
                                </div>
                            </div>
                            <div className="mt-3 px-1">
                                {item.title && <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>}
                                <DescriptionText text={item.description || ''} />
                            </div>
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
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
                        onClick={() => setSelectedImage(null)}
                    >
                        ×
                    </button>
                    <img
                        src={selectedImage}
                        alt="Enlarged gallery view"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default Gallery;
