import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import { settingsAPI, uploadAPI } from '../services/api';
import type { SiteSettings } from '../services/api';

const Home = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [sliderImages, setSliderImages] = useState<{url: string, description: string}[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.get();
                const fetchedSettings = response.data;
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
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentSlideIndex 
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
        </div>
    );
};

export default Home;
