import { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { X, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ImageCropperModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedFile: File) => void;
    aspectRatio?: number; // e.g., 16/9, 1/1, or undefined for freeform
}

export default function ImageCropperModal({ isOpen, imageSrc, onClose, onCropComplete, aspectRatio }: ImageCropperModalProps) {
    const cropperRef = useRef<ReactCropperElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = () => {
        setIsProcessing(true);
        const cropper = cropperRef.current?.cropper;
        if (!cropper) {
            setIsProcessing(false);
            return;
        }

        try {
            // Get the cropped canvas
            const canvas = cropper.getCroppedCanvas({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            if (!canvas) {
                toast.error('Could not crop image. Please try again.');
                setIsProcessing(false);
                return;
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    const croppedFile = new File([blob], 'cropped_image.jpeg', {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    onCropComplete(croppedFile);
                    onClose();
                } else {
                    toast.error('Failed to process image');
                }
                setIsProcessing(false);
            }, 'image/jpeg', 0.95);
        } catch (e) {
            console.error(e);
            toast.error('Failed to crop image');
            setIsProcessing(false);
        }
    };

    const handleRotate = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper && !isProcessing) {
            cropper.rotate(90);
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-800">Crop Image</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative flex-1 w-full bg-gray-900 min-h-[400px] sm:min-h-[500px] max-h-[60vh] flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full absolute inset-0">
                            <Cropper
                                src={imageSrc}
                                style={{ height: '100%', width: '100%' }}
                                // Initial aspect ratio. If undefined, it allows freeform resizing.
                                aspectRatio={aspectRatio !== undefined ? aspectRatio : NaN}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="crop"
                                responsive={true}
                                autoCropArea={0.8}
                                checkOrientation={false}
                                // Freeform adjustments:
                                cropBoxResizable={true}
                                cropBoxMovable={true}
                                toggleDragModeOnDblclick={false}
                            />
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-white flex-shrink-0">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                <button
                                    onClick={handleRotate}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 whitespace-nowrap disabled:opacity-50"
                                >
                                    <RotateCw className="w-4 h-4" /> Rotate 90°
                                </button>
                                <p className="text-sm text-gray-500 hidden sm:block">
                                    {aspectRatio !== undefined ? "Drag corners to resize." : "Drag borders and corners to freely adjust crop area."}
                                </p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 bg-nss-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/30 whitespace-nowrap"
                                >
                                    {isProcessing ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Crop & Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
