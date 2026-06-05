import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle, Hash, Search } from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../services/api';
import type { EventData, EventRegistration } from '../services/api';
import { VisitorPassCard } from '../components/events/VisitorPassCard';

const Register = () => {
    const [viewMode, setViewMode] = useState<'register' | 'lookup'>('register');
    const [step, setStep] = useState(1); // 1: Form, 2: Success/Pass
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: '', year: '', eventId: ''
    });
    
    const [events, setEvents] = useState<EventData[]>([]);
    const [visitorPassId, setVisitorPassId] = useState('');
    const [lookupId, setLookupId] = useState('');
    
    // For looking up existing registrations
    const [lookupResult, setLookupResult] = useState<{registration: EventRegistration, event: EventData} | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [loading, setLoading] = useState(false);

    const passRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUpcomingEvents = async () => {
            try {
                const res = await eventsAPI.getAll();
                const upcoming = (res.data.data || []).filter((e: EventData) => e.type === 'upcoming');
                setEvents(upcoming);
                if (upcoming.length > 0) {
                    setFormData(prev => ({ ...prev, eventId: upcoming[0].id.toString() }));
                }
            } catch (err) {
                console.error("Failed to load events", err);
            }
        };
        fetchUpcomingEvents();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.eventId) {
            alert("Please select an event.");
            return;
        }
        
        setLoading(true);
        try {
            const res = await registrationsAPI.create({
                ...formData,
                eventId: Number(formData.eventId)
            });
            setVisitorPassId(res.data.data.visitorPassId);
            setStep(2);
        } catch (err) {
            console.error("Failed to register", err);
            alert("Registration failed. Please try again.");
        }
        setLoading(false);
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupId.trim()) return;
        
        setLoading(true);
        setLookupError('');
        setLookupResult(null);
        
        try {
            const res = await registrationsAPI.getByVisitorId(lookupId.trim());
            const resultData = res.data.data;
            setLookupResult(resultData);
            setVisitorPassId(resultData.registration.visitorPassId!);
            // We set formData for the pass generation view
            setFormData({
                name: resultData.registration.name,
                email: resultData.registration.email,
                phone: resultData.registration.phone,
                department: resultData.registration.department,
                year: resultData.registration.year,
                eventId: resultData.event.id.toString(),
            });
            setStep(2); // Go to pass view
        } catch (err: unknown) {
            console.error("Lookup failed", err);
            const axiosError = err as { response?: { data?: { message?: string } } };
            setLookupError(axiosError.response?.data?.message || "Visitor ID not found.");
        }
        setLoading(false);
    };

    const downloadPass = async () => {
        if (passRef.current) {
            const canvas = await html2canvas(passRef.current);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `NSS-Visitor-Pass-${formData.name.replace(/\s+/g, '-')}.png`;
            link.click();
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-16">
            {step === 1 ? (
                <>
                    <h1 className="text-3xl font-bold text-nss-blue mb-2 text-center">Event Registration</h1>
                    <p className="text-gray-600 text-center mb-6">Join us in serving the community or look up your existing pass.</p>

                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                            <button 
                                onClick={() => setViewMode('register')}
                                className={`px-6 py-2 rounded-md font-medium transition ${viewMode === 'register' ? 'bg-white shadow text-nss-blue' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                New Registration
                            </button>
                            <button 
                                onClick={() => setViewMode('lookup')}
                                className={`px-6 py-2 rounded-md font-medium transition ${viewMode === 'lookup' ? 'bg-white shadow text-nss-blue' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Check Pass
                            </button>
                        </div>
                    </div>

                    {viewMode === 'register' ? (
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-nss-red">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required placeholder="John Doe" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required placeholder="john@example.com" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Phone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required placeholder="1234567890" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Department</label>
                                <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required placeholder="Comp / IT / EnTC" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Year</label>
                                <select name="year" value={formData.year} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required>
                                    <option value="">Select Year</option>
                                    <option value="FE">First Year (FE)</option>
                                    <option value="SE">Second Year (SE)</option>
                                    <option value="TE">Third Year (TE)</option>
                                    <option value="BE">Final Year (BE)</option>
                                </select>
                            </div>
                            <div className="mb-6 md:col-span-2">
                                <label className="block text-gray-700 font-bold mb-2">Event</label>
                                <select name="eventId" value={formData.eventId} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nss-blue" required>
                                    <option value="" disabled>Select an Upcoming Event</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>
                                            {event.title} - {new Date(event.date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                {events.length === 0 && <p className="text-red-500 text-sm mt-1">No upcoming events available for registration.</p>}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || events.length === 0}
                            className="w-full bg-nss-blue text-white font-bold py-3 rounded hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                            {loading ? 'Processing...' : (
                                <>Register & Get Pass <CheckCircle className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                    ) : (
                        <form onSubmit={handleLookup} className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-nss-blue max-w-md mx-auto">
                            <div className="mb-6">
                                <label className="block text-gray-700 font-bold mb-2">Visitor ID</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={lookupId}
                                        onChange={(e) => setLookupId(e.target.value)} 
                                        className="w-full border rounded-lg pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-nss-blue text-lg" 
                                        required 
                                        placeholder="e.g. NSS-1234" 
                                    />
                                </div>
                                {lookupError && <p className="text-red-500 text-sm mt-2">{lookupError}</p>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || !lookupId.trim()}
                                className="w-full bg-nss-blue text-white font-bold py-3 rounded hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                {loading ? 'Searching...' : (
                                    <><Search className="w-5 h-5" /> Lookup Pass</>
                                )}
                            </button>
                        </form>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="bg-green-100 text-green-800 px-6 py-4 rounded-lg mb-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
                        <p>Your Visitor ID has been generated. Please save this pass.</p>
                    </div>

                    <VisitorPassCard 
                        ref={passRef}
                        visitorPassId={visitorPassId}
                        name={formData.name}
                        eventTitle={lookupResult?.event.title || events.find(e => e.id.toString() === formData.eventId)?.title || "NSS Event"}
                    />

                    <button
                        onClick={downloadPass}
                        className="mt-8 bg-nss-red text-white px-6 py-3 rounded-full hover:bg-red-700 transition flex items-center gap-2 shadow-lg"
                    >
                        <Download className="w-5 h-5" /> Download Pass
                    </button>

                    <button
                        onClick={() => { 
                            setStep(1); 
                            setFormData({ name: '', email: '', phone: '', department: '', year: '', eventId: events.length > 0 ? events[0].id.toString() : '' });
                            setLookupResult(null);
                            setLookupId(''); 
                        }}
                        className="mt-4 text-gray-500 underline hover:text-gray-700"
                    >
                        {viewMode === 'register' ? 'Register Another Person' : 'Go Back'}
                    </button>
                </div>
            )}
        </div>
    );
}
export default Register;
