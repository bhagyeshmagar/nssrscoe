import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import { settingsAPI, uploadAPI, eventsAPI } from '../services/api';
import type { SiteSettings, EventData } from '../services/api';
import { EventsTray } from '../components/home/EventsTray';
import { Info, Image, Users, FileText, Video, CalendarDays } from 'lucide-react';

const Home = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [sliderImages, setSliderImages] = useState<{ url: string, description: string }[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
    const [pastEvents, setPastEvents] = useState<EventData[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.get();
                const fetchedSettings = response.data.data;
                setSettings(fetchedSettings);

                if (fetchedSettings.homeSliderImages) {
                    try {
                        const parsed = JSON.parse(fetchedSettings.homeSliderImages);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setSliderImages(parsed);
                        }
                    } catch (e) {
                        console.error('Failed to parse slider images', e);
                    }
                }

                // Fetch Events
                try {
                    const eventsRes = await eventsAPI.getAll();
                    const allEvents: EventData[] = eventsRes.data.data;
                    const now = new Date();

                    const upcoming = allEvents.filter(e => new Date(e.date) >= now)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const past = allEvents.filter(e => new Date(e.date) < now)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    setUpcomingEvents(upcoming);
                    setPastEvents(past);
                } catch (e) {
                    console.error('Error fetching events:', e);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Use default values on error
                setSettings({
                    heroTitle: 'NOT ME, BUT YOU',
                    heroSubtitle: 'National Service Scheme - JSPM RSCOE',
                    heroCta: 'Join Us / Register',
                    statEventsCount: '50+',
                    statEventsLabel: 'Events Conducted',
                    statVolunteersCount: '200+',
                    statVolunteersLabel: 'Volunteers',
                    statImpactCount: '1000+',
                    statImpactLabel: 'Lives Impacted',
                    aboutMission: '',
                    aboutHistory: '',
                });
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    // Auto-advance slider
    useEffect(() => {
        if (sliderImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlideIndex((prev) => (prev + 1) % sliderImages.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [sliderImages]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-r from-nss-blue to-nss-red overflow-hidden">

                {sliderImages.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        <motion.img
                            key={currentSlideIndex}
                            src={uploadAPI.getFullUrl(sliderImages[currentSlideIndex].url)}
                            alt="Slider Background"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                ) : null}

                <div className="absolute inset-0 bg-black opacity-20"></div>


                {/* Slider Controls */}
                {sliderImages.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                        {sliderImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlideIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlideIndex
                                        ? 'bg-white scale-125'
                                        : 'bg-white/50 hover:bg-white/80'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Stats */}
            <section className="py-16 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="p-6 bg-white shadow-md rounded-lg"
                    >
                        <h3 className="text-4xl font-bold text-nss-blue mb-2">
                            {settings?.statEventsCount || '50+'}
                        </h3>
                        <p className="text-gray-600">{settings?.statEventsLabel || 'Events Conducted'}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="p-6 bg-white shadow-md rounded-lg"
                    >
                        <h3 className="text-4xl font-bold text-nss-red mb-2">
                            {settings?.statVolunteersCount || '200+'}
                        </h3>
                        <p className="text-gray-600">{settings?.statVolunteersLabel || 'Volunteers'}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="p-6 bg-white shadow-md rounded-lg"
                    >
                        <h3 className="text-4xl font-bold text-nss-blue mb-2">
                            {settings?.statImpactCount || '1000+'}
                        </h3>
                        <p className="text-gray-600">{settings?.statImpactLabel || 'Lives Impacted'}</p>
                    </motion.div>
                </div>

                {/* Moved CTA Button */}
                <div className="mt-12 text-center">
                    <Link
                        to="/register"
                        className="bg-nss-blue text-white font-bold py-3 px-8 rounded-full hover:bg-blue-900 transition duration-300 inline-block shadow-lg"
                    >
                        {settings?.heroCta || 'Join Us / Register'}
                    </Link>
                </div>
            </section>

            {/* Updates & Events */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-nss-blue mb-4">Updates & Events</h2>
                        <div className="w-24 h-1 bg-nss-red mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <EventsTray title="Upcoming Events" events={upcomingEvents} emptyMessage="No upcoming events currently scheduled." />
                        <EventsTray title="Past Events" events={pastEvents} emptyMessage="No past events to display." />
                    </div>
                </div>
            </section>

            {/* Discover More */}
            <section className="py-16 bg-orange-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-nss-red mb-4">Discover More</h2>
                        <div className="w-24 h-1 bg-nss-blue mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: 'About Us', icon: Info, link: '/about' },
                            { title: 'Gallery', icon: Image, link: '/gallery' },
                            { title: 'Volunteering', icon: Users, link: '/volunteering' },
                            { title: 'History', icon: CalendarDays, link: '/about/history' },
                            { title: 'Reports', icon: FileText, link: '/events/reports' },
                            { title: 'Videos & Reels', icon: Video, link: '/gallery/videos' }
                        ].map((item, index) => (
                            <Link
                                key={index}
                                to={item.link}
                                className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-md border-l-4 border-nss-red hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="p-3 bg-red-50 rounded-full text-nss-red group-hover:bg-nss-red group-hover:text-white transition-colors duration-300">
                                    <item.icon size={24} />
                                </div>
                                <span className="font-bold text-gray-800 text-lg group-hover:text-nss-blue transition-colors duration-300">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
