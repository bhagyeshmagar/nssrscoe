import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle, Hash, Search, Loader2 } from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../services/api';
import type { EventData, EventRegistration } from '../services/api';
import { VisitorPassCard } from '../components/events/VisitorPassCard';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    const [lookupResult, setLookupResult] = useState<{ registration: EventRegistration, event: EventData } | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [loading, setLoading] = useState(false);

    const passRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUpcomingEvents = async () => {
            try {
                const res = await eventsAPI.getAll();
                const upcoming = ((res.data.data as EventData[]) || []).filter((e: EventData) => e.type === 'upcoming');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
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
        <div className="max-w-3xl mx-auto px-4 py-16">
            {step === 1 ? (
                <>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-nss-blue mb-2">Event Registration</h1>
                        <p className="text-gray-600">Join us in serving the community or look up your existing pass.</p>
                    </div>

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
                        <Card className="border-t-4 border-t-nss-red shadow-lg">
                            <CardHeader>
                                <CardTitle>Volunteer Details</CardTitle>
                                <CardDescription>Fill in your information to register for an upcoming event.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Phone" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Input id="department" type="text" name="department" value={formData.department} onChange={handleChange} required placeholder="Department" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="year">Year</Label>
                                            <Select value={formData.year} onValueChange={(val) => handleSelectChange('year', val)} required>
                                                <SelectTrigger id="year">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FY">First Year</SelectItem>
                                                    <SelectItem value="SY">Second Year</SelectItem>
                                                    <SelectItem value="TY">Third Year</SelectItem>
                                                    <SelectItem value="BE">Final Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="eventId">Event</Label>
                                            <Select value={formData.eventId} onValueChange={(val) => handleSelectChange('eventId', val)} required>
                                                <SelectTrigger id="eventId">
                                                    <SelectValue placeholder="Select an Upcoming Event" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {events.map(event => (
                                                        <SelectItem key={event.id} value={event.id.toString()}>
                                                            {event.title} - {new Date(event.date).toLocaleDateString()}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {events.length === 0 && <p className="text-red-500 text-sm mt-1">No upcoming events available for registration.</p>}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || events.length === 0}
                                        className="w-full bg-nss-blue hover:bg-blue-900 transition-colors py-6 text-lg"
                                    >
                                        {loading ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                        ) : (
                                            <>Register & Get Pass <CheckCircle className="ml-2 w-5 h-5" /></>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-t-4 border-t-nss-blue max-w-md mx-auto shadow-lg">
                            <CardHeader>
                                <CardTitle>Lookup Pass</CardTitle>
                                <CardDescription>Enter your Visitor ID to retrieve your pass.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLookup} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="lookupId">Visitor ID</Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Hash className="text-gray-400 w-5 h-5" />
                                            </div>
                                            <Input
                                                id="lookupId"
                                                type="text"
                                                value={lookupId}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLookupId(e.target.value)}
                                                className="pl-10 py-6 text-lg"
                                                required
                                                placeholder="e.g. NSS-1234"
                                            />
                                        </div>
                                        {lookupError && (
                                            <Alert variant="destructive" className="mt-4">
                                                <AlertDescription>{lookupError}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || !lookupId.trim()}
                                        className="w-full bg-nss-blue hover:bg-blue-900 transition-colors py-6 text-lg"
                                    >
                                        {loading ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching...</>
                                        ) : (
                                            <><Search className="mr-2 w-5 h-5" /> Lookup Pass</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <Alert className="bg-green-50 border-green-200 text-green-800 mb-8 max-w-md">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <CardTitle className="ml-2 text-lg text-green-800">Registration Successful!</CardTitle>
                        <AlertDescription className="ml-2 mt-1">
                            Your Visitor ID has been generated. Please save this pass.
                        </AlertDescription>
                    </Alert>

                    <VisitorPassCard
                        ref={passRef}
                        visitorPassId={visitorPassId}
                        name={formData.name}
                        eventTitle={lookupResult?.event.title || events.find(e => e.id.toString() === formData.eventId)?.title || "NSS Event"}
                    />

                    <Button
                        onClick={downloadPass}
                        className="mt-8 bg-nss-red hover:bg-red-700 transition-colors rounded-full px-8 py-6 text-lg shadow-lg"
                    >
                        <Download className="mr-2 w-5 h-5" /> Download Pass
                    </Button>

                    <Button
                        variant="link"
                        onClick={() => {
                            setStep(1);
                            setFormData({ name: '', email: '', phone: '', department: '', year: '', eventId: events.length > 0 ? events[0].id.toString() : '' });
                            setLookupResult(null);
                            setLookupId('');
                        }}
                        className="mt-4 text-gray-500"
                    >
                        {viewMode === 'register' ? 'Register Another Person' : 'Go Back'}
                    </Button>
                </div>
            )}
        </div>
    );
}
export default Register;
