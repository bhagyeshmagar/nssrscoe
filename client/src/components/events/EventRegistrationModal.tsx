import { X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventTitle: string;
    isRegistered: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
}

export const EventRegistrationModal = ({ isOpen, onClose, eventTitle, isRegistered, onSubmit, onReset }: EventRegistrationModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        {!isRegistered ? (
                            <>
                                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-800">Event Registration</h3>
                                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={onSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input type="email" required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition" placeholder="john@example.com" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition">
                                                <option>Select...</option>
                                                <option>Computer</option>
                                                <option>IT</option>
                                                <option>Mechanical</option>
                                                <option>Civil</option>
                                                <option>ENTC</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition">
                                                <option>Select...</option>
                                                <option>FE</option>
                                                <option>SE</option>
                                                <option>TE</option>
                                                <option>BE</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-nss-blue hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md transition mt-2">
                                        Confirm Registration
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
                                <p className="text-gray-600 mb-8">You have successfully registered for "{eventTitle}". Check your email for details.</p>
                                <button
                                    onClick={() => { onClose(); onReset(); }}
                                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
