import { motion } from 'framer-motion';
import { useEffect } from 'react';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        // Show splash screen for 2.5 seconds before hiding
        const timer = setTimeout(() => {
            onComplete();
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-r from-nss-blue to-nss-red"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center text-center px-4"
            >
                <div className="bg-white p-4 rounded-full shadow-lg mb-8">
                    <img 
                        src="/assets/nss_logo.jpg" 
                        alt="NSS Logo" 
                        className="w-28 h-28 md:w-40 md:h-40 object-contain rounded-full" 
                    />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">NOT ME, BUT YOU</h1>
                <p className="text-xl md:text-2xl text-gray-200 font-medium">National Service Scheme - JSPM RSCOE</p>
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
