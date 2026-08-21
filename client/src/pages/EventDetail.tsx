import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, eventImagesAPI, uploadAPI } from '../services/api';
import { Calendar, MapPin, Download, Clock, Users, ChevronLeft, ArrowRight, ZoomIn, Share2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

import { EventRegistrationModal } from '../components/events/EventRegistrationModal';
import { ImageLightbox } from '../components/events/ImageLightbox';

interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    imageUrl?: string;
    type: 'upcoming' | 'today' | 'past';
    reportUrl?: string;
    driveLink?: string;
    volunteersCount?: number;
}

interface EventImage {
    id: number;
    url: string;
    isMaster: boolean;
    caption?: string;
}

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [eventImages, setEventImages] = useState<EventImage[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                const eventsResponse = await eventsAPI.getAll();
                const foundEvent = (eventsResponse.data.data || []).find((e: Event) => e.id === Number(id));
                setEvent(foundEvent || null);

                if (foundEvent) {
                    const imagesResponse = await eventImagesAPI.getByEvent(Number(id));
                    setEventImages(imagesResponse.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
                    <button onClick={() => navigate('/events')} className="text-nss-blue hover:underline">Return to Events</button>
                </div>
            </div>
        );
    }

    const bannerImage = eventImages.find(img => img.isMaster)?.url || event?.imageUrl || eventImages[0]?.url;

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Immersive Hero Section with Master Image */}
            <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] min-h-[260px] sm:min-h-[350px] md:min-h-[400px] w-full overflow-hidden group">
                <div className="absolute inset-0">
                    {bannerImage ? (
                        <img
                            src={uploadAPI.getFullUrl(bannerImage)}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-nss-blue to-nss-red" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-nss-blue/90 via-nss-blue/50 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to Events
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm ${event.type === 'upcoming' ? 'bg-green-500 text-white' : event.type === 'today' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {event.type}
                            </span>
                            <span className="text-blue-100 flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <Calendar className="w-4 h-4" /> {format(new Date(event.date), 'MMMM d, yyyy')}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight max-w-4xl shadow-sm">
                            {event.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-400" />
                                <span className="text-lg font-medium">{event.location}</span>
                            </div>
                            {event.volunteersCount && event.volunteersCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-yellow-400" />
                                    <span className="text-lg font-medium">{event.volunteersCount} NSS Volunteers Participated</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* About Section */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-l-4 border-nss-blue pl-4">
                                About the Event
                            </h2>
                            <div className="prose prose-lg text-gray-600 leading-relaxed text-justify max-w-none">
                                <p className="whitespace-pre-line">{event.description}</p>
                            </div>
                        </motion.section>

                        {/* Event Gallery Grid */}
                        {eventImages.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-l-4 border-nss-blue pl-4">
                                    Event Gallery
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {eventImages.map((img, index) => (
                                        <div
                                            key={img.id}
                                            className="relative group aspect-square overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-all"
                                            onClick={() => {
                                                setCurrentImageIndex(index);
                                                setLightboxOpen(true);
                                            }}
                                        >
                                            <img
                                                src={uploadAPI.getFullUrl(img.url)}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ZoomIn className="text-white w-8 h-8" />
                                            </div>
                                            {img.isMaster && (
                                                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow-sm">
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Report Section (for past events) */}
                        {event.type === 'past' && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-blue-50 rounded-2xl p-8 border border-blue-100 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Clock className="w-40 h-40" />
                                </div>
                                <h2 className="text-2xl font-bold text-nss-blue mb-4 relative z-10 flex items-center gap-2">
                                    <Clock className="w-6 h-6" /> Event Completed
                                </h2>
                                <p className="text-gray-700 relative z-10">
                                    This event has concluded. Thank you to all the volunteers who participated!
                                </p>

                                {event.reportUrl && (
                                    <button className="flex items-center gap-2 bg-white text-nss-blue px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition relative z-10 border border-blue-100 hover:text-blue-700 mt-4">
                                        <Download className="w-5 h-5" /> Download Report
                                    </button>
                                )}
                            </motion.section>
                        )}
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" /> Event Details
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg text-nss-blue shrink-0">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Date</p>
                                            <p className="text-gray-900 font-semibold text-lg">{format(new Date(event.date), 'EEEE, MMM do, yyyy')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-50 p-3 rounded-lg text-green-600 shrink-0">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Location</p>
                                            <p className="text-gray-900 font-semibold text-lg leading-tight">{event.location}</p>
                                        </div>
                                    </div>

                                    {event.volunteersCount && event.volunteersCount > 0 && (
                                        <div className="flex items-start gap-4">
                                            <div className="bg-yellow-50 p-3 rounded-lg text-yellow-600 shrink-0">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Volunteers</p>
                                                <p className="text-gray-900 font-semibold text-lg leading-tight">{event.volunteersCount}</p>
                                            </div>
                                        </div>
                                    )}

                                    {event.driveLink && (
                                        <div className="flex items-start gap-4">
                                            <div className="bg-purple-50 p-3 rounded-lg text-purple-600 shrink-0">
                                                <ExternalLink className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Resources</p>
                                                <a 
                                                    href={event.driveLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-nss-blue font-semibold text-lg leading-tight hover:underline flex items-center gap-1"
                                                >
                                                    Google Drive <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {event.type === 'upcoming' ? (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full mt-8 bg-nss-blue hover:bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Register Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <div className="w-full mt-8 bg-gray-100 text-gray-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                        Registration Closed
                                    </div>
                                )}
                            </div>

                            {/* Share & Register Prompt */}
                            <div className="bg-gradient-to-br from-nss-red to-red-700 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-bold text-lg mb-2">Spread the Word!</h3>
                                <p className="text-white/90 text-sm mb-4">Share this event with your friends and encourage them to join NSS.</p>
                                <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg backdrop-blur-sm transition flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" /> Share Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            <EventRegistrationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventId={event.id}
                eventTitle={event.title}
            />

            {/* Lightbox Modal */}
            <ImageLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                images={eventImages}
                currentIndex={currentImageIndex}
                onNext={() => setCurrentImageIndex((prev) => (prev + 1) % eventImages.length)}
                onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length)}
            />
        </div>
    );
};

export default EventDetail;
