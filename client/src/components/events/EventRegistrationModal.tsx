import { useState } from 'react';
import { X, CheckCircle, Clock, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrationsAPI } from '../../services/api';

interface EventRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    eventTitle: string;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    department: string;
    year: string;
}

const DEPARTMENTS = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
    'Other',
];

export const EventRegistrationModal = ({ isOpen, onClose, eventId, eventTitle }: EventRegistrationModalProps) => {
    const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', department: '', year: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (!form.email.trim()) {
            setError('Email address is required.');
            return;
        }
        if (!form.department) {
            setError('Please select your department.');
            return;
        }
        if (!form.year) {
            setError('Please select your year.');
            return;
        }

        setSubmitting(true);
        try {
            await registrationsAPI.create({
                eventId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                department: form.department,
                year: form.year,
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
        }
        setSubmitting(false);
    };

    const handleClose = () => {
        // Reset state on close
        setForm({ name: '', email: '', phone: '', department: '', year: '' });
        setSubmitted(false);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {!submitted ? (
                            <>
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Volunteer Registration</h3>
                                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{eventTitle}</p>
                                    </div>
                                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Note banner */}
                                <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-start gap-2.5 text-sm text-blue-700">
                                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        After admin approval, you will receive a <strong>Volunteering Pass</strong> on your email.
                                        You can also download it anytime from this website using your pass ID.
                                    </span>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                                    {error && (
                                        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address <span className="text-red-500">*</span>
                                            <span className="ml-1 text-xs text-blue-600 font-normal">(your pass will be sent here)</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="department"
                                                value={form.department}
                                                onChange={handleChange}
                                                required
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            >
                                                <option value="">Select...</option>
                                                {DEPARTMENTS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Year <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="year"
                                                value={form.year}
                                                onChange={handleChange}
                                                required
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                                            >
                                                <option value="">Select...</option>
                                                <option>FE</option>
                                                <option>SE</option>
                                                <option>TE</option>
                                                <option>BE</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-nss-blue hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md transition mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting…' : 'Submit Registration'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── Success screen ── */
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <Clock className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h3>
                                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                                    Your registration for <strong>"{eventTitle}"</strong> has been received and is
                                    <span className="inline-flex items-center gap-1 mx-1 text-yellow-600 font-semibold">
                                        <Clock className="w-3.5 h-3.5" /> pending admin approval.
                                    </span>
                                </p>

                                {/* Info note */}
                                <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-left mb-6 space-y-2">
                                    <div className="flex items-start gap-2 text-green-700 text-sm">
                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>Once approved, you will receive a <strong>Volunteering Pass</strong> at <strong className="text-green-800">{form.email}</strong>.</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-green-700 text-sm">
                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>You can also download the pass anytime from this website using your Pass ID from the email.</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-green-700 text-sm">
                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>Please carry the digital or printed pass to the event venue.</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="bg-nss-blue text-white px-8 py-3 rounded-xl hover:bg-blue-900 transition font-semibold"
                                >
                                    Got it, Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
