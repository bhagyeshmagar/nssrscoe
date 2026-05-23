import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { galleryAPI, uploadAPI } from '../services/api';

interface VideoItem {
    id: number;
    title: string | null;
    url: string;
    type: string;
    createdAt: string;
}

const Videos = () => {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const response = await galleryAPI.getAll();
            // Filter only videos
            const videoItems = response.data.filter((item: VideoItem) => item.type === 'video');
            setVideos(videoItems);
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Videos & Reels</h1>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-4 text-center">Videos & Reels</h1>
            <p className="text-center text-gray-600 mb-8">Watch our NSS activities and events in action</p>

            {videos.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-6xl block mb-4">🎬</span>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Videos Yet</h2>
                    <p className="text-gray-500">Check back later for amazing NSS activity videos!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow cursor-pointer group"
                            onClick={() => setSelectedVideo(video)}
                        >
                            <div className="relative aspect-video">
                                <video
                                    src={uploadAPI.getFullUrl(video.url)}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 group-hover:opacity-0 transition">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                        <Play className="w-12 h-12 text-white" fill="white" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-white font-bold text-lg truncate">
                                    {video.title || 'NSS Activity Video'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {video.createdAt ? new Date(video.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'NSS RSCOE'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="max-w-5xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white text-xl font-bold">
                                {selectedVideo.title || 'NSS Activity Video'}
                            </h2>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="text-white text-3xl hover:text-gray-300 transition"
                            >
                                &times;
                            </button>
                        </div>
                        <video
                            src={uploadAPI.getFullUrl(selectedVideo.url)}
                            className="w-full rounded-lg"
                            controls
                            autoPlay
                        />
                    </div>
                </div>
            )}

            {/* YouTube Link */}
            <div className="mt-16 text-center">
                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 max-w-2xl mx-auto">
                    <h2 className="text-white text-2xl font-bold mb-3">Want More Videos?</h2>
                    <p className="text-red-100 mb-6">Subscribe to our YouTube channel for more NSS activities and events</p>
                    <a
                        href="https://www.youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition"
                    >
                        <Play className="w-5 h-5" fill="currentColor" />
                        Visit Our YouTube Channel
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Videos;
