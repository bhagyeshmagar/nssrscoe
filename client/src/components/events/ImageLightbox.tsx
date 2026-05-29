import { X, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadAPI } from '../../services/api';

interface EventImage {
    id: number;
    url: string;
    isMaster: boolean;
    caption?: string;
}

interface ImageLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    images: EventImage[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
}

export const ImageLightbox = ({ isOpen, onClose, images, currentIndex, onNext, onPrev }: ImageLightboxProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-sm">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <button
                        onClick={onPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-3 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <div className="w-full h-full p-12 flex items-center justify-center relative">
                        <motion.img
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            src={uploadAPI.getFullUrl(images[currentIndex]?.url)}
                            alt="Gallery View"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        {images[currentIndex]?.isMaster && (
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                Featured Image
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-3 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                        <ArrowRight className="w-8 h-8" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
