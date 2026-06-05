import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { galleryAPI, uploadAPI, settingsAPI } from '../services/api';

interface VideoItem {
    id: number;
    title: string | null;
    description?: string;
    url: string;
    type: string;
    createdAt: string;
}

const DescriptionText = ({ text }: { text: string }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    
    if (text.length <= 100) {
        return <p className="mt-2 text-sm text-gray-400">{text}</p>;
    }
    
    return (
        <div className="mt-2 text-sm text-gray-400">
            {expanded ? text : `${text.substring(0, 100)}... `}
            <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                className="text-blue-400 hover:text-blue-300 font-medium"
            >
                {expanded ? 'Show less' : 'more'}
            </button>
        </div>
    );
};

const Videos = () => {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/@NSSRSCOE'); // Fallback

    useEffect(() => {
        fetchVideos();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await settingsAPI.get();
            if (res.data.data?.youtubeChannelUrl) {
                setYoutubeUrl(res.data.data.youtubeChannelUrl);
            } else if (res.data.data?.socialYoutube) {
                setYoutubeUrl(res.data.data.socialYoutube);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchVideos = async () => {
        try {
            const response = await galleryAPI.getAll();
            // Filter only videos
            const videoItems = (response.data.data || []).filter((item: VideoItem) => item.type === 'video');
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
                            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow cursor-pointer group flex flex-col"
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
                            <div className="p-4 flex-1">
                                <h3 className="text-white font-bold text-lg truncate">
                                    {video.title || 'NSS Activity Video'}
                                </h3>
                                <DescriptionText text={video.description || ''} />
                                <p className="text-gray-500 text-xs mt-2">
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
                    className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition z-50"
                    >
                        &times;
                    </button>
                    <div
                        className="max-w-[90vw] max-h-[90vh] flex flex-col bg-black rounded-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedVideo.title && (
                            <div className="p-4 bg-gray-900 border-b border-gray-800">
                                <h2 className="text-white text-xl font-bold">
                                    {selectedVideo.title}
                                </h2>
                            </div>
                        )}
                        <video
                            src={uploadAPI.getFullUrl(selectedVideo.url)}
                            className="max-h-[80vh] w-auto mx-auto object-contain"
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
                        href={youtubeUrl}
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
