import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { CheckCircle, Hash, Search, Loader2, Clock, XCircle, Download, Mail, AlertCircle } from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../services/api';
import type { EventData, EventRegistration } from '../services/api';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ── Inline pass card (only shown after lookup of an approved registration) ────
const PassCard = ({ reg, eventTitle }: { reg: EventRegistration; eventTitle: string }) => (
    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border-2 border-nss-blue">
        <div className="bg-nss-blue text-white p-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <img src="/assets/nss_logo.jpg" alt="NSS" className="w-10 h-10 rounded-full bg-white p-0.5" />
                <img src="/assets/rscoe_logo.png" alt="RSCOE" className="w-10 h-10 rounded-full bg-white p-0.5" />
            </div>
            <h3 className="font-bold text-lg tracking-wide uppercase">Volunteering Pass</h3>
            <p className="text-xs opacity-90">NSS – JSPM RSCOE</p>
        </div>
        <div className="p-6 space-y-3 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                <img src="/assets/nss_logo.jpg" alt="" className="w-48 h-48 grayscale" />
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Volunteer Name</p>
                <p className="font-bold text-xl text-gray-900">{reg.name}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pass ID</p>
                <p className="font-mono font-bold text-2xl text-nss-blue tracking-widest">{reg.visitorPassId}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Event</p>
                <p className="font-semibold text-gray-800 text-sm">{eventTitle}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Department / Year</p>
                <p className="text-sm text-gray-700">{reg.department} · {reg.year}</p>
            </div>
        </div>
        <div className="bg-gray-50 border-t p-3 text-center">
            <p className="text-[10px] text-gray-400">Present this pass at the venue. Valid for registered event only.</p>
        </div>
    </div>
);

const DEPARTMENTS = [
    'Computer Engineering', 'Computer Science and Business Systems',
    'Information Technology', 'Electronics and Telecommunication',
    'Electrical Engineering', 'Automation and Robotics',
    'Mechanical Engineering', 'Civil Engineering',
    'Bachelor of Computer Applications', 'Other',
];

const Register = () => {
    const [viewMode, setViewMode] = useState<'register' | 'lookup'>('register');

    // ── Registration form state ───────────────────────────────────────────────
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: '', year: '', eventId: ''
    });
    const [events, setEvents] = useState<EventData[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);   // true after successful POST
    const [submitError, setSubmitError] = useState('');
    const [submittedEmail, setSubmittedEmail] = useState('');

    // ── Lookup state ──────────────────────────────────────────────────────────
    const [lookupId, setLookupId] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [lookupResult, setLookupResult] = useState<{ registration: EventRegistration; event: EventData } | null>(null);

    // ── Pass download ref ─────────────────────────────────────────────────────
    const passRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        eventsAPI.getAll().then(res => {
            const upcoming = ((res.data.data as EventData[]) || []).filter(e => e.type === 'upcoming');
            setEvents(upcoming);
            if (upcoming.length > 0) setFormData(p => ({ ...p, eventId: upcoming[0].id.toString() }));
        }).catch(() => {});
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setSubmitError('');
    };

    const handleSelect = (name: string, value: string) => {
        setFormData(p => ({ ...p, [name]: value }));
        setSubmitError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email.trim()) { setSubmitError('Email address is required.'); return; }
        if (!formData.department)   { setSubmitError('Please select your department.'); return; }
        if (!formData.year)         { setSubmitError('Please select your year.'); return; }
        if (!formData.eventId)      { setSubmitError('Please select an event.'); return; }

        setSubmitting(true);
        setSubmitError('');
        try {
            await registrationsAPI.create({ ...formData, eventId: Number(formData.eventId) });
            setSubmittedEmail(formData.email);
            setSubmitted(true);
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message || 'Registration failed. Please try again.');
        }
        setSubmitting(false);
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupId.trim()) return;
        setLookupLoading(true);
        setLookupError('');
        setLookupResult(null);
        try {
            const res = await registrationsAPI.getByVisitorId(lookupId.trim());
            const payload = (res.data as any).data as { registration: EventRegistration; event: EventData };
            setLookupResult(payload);
        } catch {
            setLookupError('Pass ID not found. Please check and try again.');
        }
        setLookupLoading(false);
    };

    const handleDownload = async () => {
        if (!passRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(passRef.current, { scale: 2, useCORS: true });
            const link = document.createElement('a');
            link.download = `NSS-Pass-${lookupId.trim()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch { /* ignore */ }
        setDownloading(false);
    };

    const resetRegistration = () => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', department: '', year: '', eventId: events.length > 0 ? events[0].id.toString() : '' });
        setSubmitError('');
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-nss-blue mb-2">Event Registration</h1>
                <p className="text-gray-600">Register to volunteer for an upcoming NSS event, or look up your approved pass.</p>
            </div>

            {/* Tab toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => { setViewMode('register'); setSubmitted(false); }}
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

            {/* ── REGISTER TAB ─────────────────────────────────────────────── */}
            {viewMode === 'register' && (
                <>
                    {!submitted ? (
                        <Card className="border-t-4 border-t-nss-red shadow-lg">
                            <CardHeader>
                                <CardTitle>Volunteer Details</CardTitle>
                                <CardDescription>Fill in your details. Your pass will be emailed after admin approval.</CardDescription>
                            </CardHeader>

                            {/* Info banner */}
                            <div className="mx-6 mb-2 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    After submitting, your registration will be reviewed by the admin.
                                    If approved, your <strong>Volunteering Pass</strong> will be sent to your email address.
                                </span>
                            </div>

                            <CardContent className="pt-4">
                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {submitError && (
                                        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {submitError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">
                                                Email Address <span className="text-red-500">*</span>
                                                <span className="ml-1 text-xs text-blue-500 font-normal">(pass sent here)</span>
                                            </Label>
                                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                                            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Department <span className="text-red-500">*</span></Label>
                                            <Select value={formData.department} onValueChange={v => handleSelect('department', v)} required>
                                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                                <SelectContent>
                                                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Year <span className="text-red-500">*</span></Label>
                                            <Select value={formData.year} onValueChange={v => handleSelect('year', v)} required>
                                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="FE">First Year (FE)</SelectItem>
                                                    <SelectItem value="SE">Second Year (SE)</SelectItem>
                                                    <SelectItem value="TE">Third Year (TE)</SelectItem>
                                                    <SelectItem value="BE">Final Year (BE)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Event <span className="text-red-500">*</span></Label>
                                            <Select value={formData.eventId} onValueChange={v => handleSelect('eventId', v)} required>
                                                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                                                <SelectContent>
                                                    {events.map(ev => (
                                                        <SelectItem key={ev.id} value={ev.id.toString()}>
                                                            {ev.title} – {new Date(ev.date).toLocaleDateString()}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {events.length === 0 && <p className="text-red-500 text-xs">No upcoming events available.</p>}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting || events.length === 0}
                                        className="w-full bg-nss-blue hover:bg-blue-900 transition-colors py-6 text-lg"
                                    >
                                        {submitting
                                            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting…</>
                                            : 'Submit Registration'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        /* ── Pending approval screen ── */
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                <Clock className="w-12 h-12 text-nss-blue" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
                            <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
                                Thank you for registering. Your application is now <span className="font-semibold text-yellow-600">pending admin approval</span>.
                                We will review it shortly.
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-left max-w-md w-full mb-6 space-y-3">
                                <div className="flex items-start gap-2.5 text-green-700 text-sm">
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Once approved, your <strong>Volunteering Pass</strong> will be emailed to <strong className="text-green-800">{submittedEmail}</strong>.</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-green-700 text-sm">
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>You can also check your pass status anytime using the <strong>Check Pass</strong> tab above with your Pass ID.</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-green-700 text-sm">
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Please carry your pass (digital or printed) to the event venue.</span>
                                </div>
                            </div>

                            <Button variant="outline" onClick={resetRegistration} className="text-gray-500">
                                Register Another Person
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* ── CHECK PASS TAB ──────────────────────────────────────────── */}
            {viewMode === 'lookup' && (
                <Card className="border-t-4 border-t-nss-blue max-w-md mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Check Your Pass</CardTitle>
                        <CardDescription>Enter your Pass ID from the approval email to view or download your pass.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLookup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lookupId">Pass ID</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="text-gray-400 w-5 h-5" />
                                    </div>
                                    <Input
                                        id="lookupId"
                                        value={lookupId}
                                        onChange={e => { setLookupId(e.target.value); setLookupError(''); setLookupResult(null); }}
                                        className="pl-10 py-6 text-lg font-mono"
                                        placeholder="e.g. NSS-1234"
                                    />
                                </div>
                            </div>

                            {lookupError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{lookupError}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                disabled={lookupLoading || !lookupId.trim()}
                                className="w-full bg-nss-blue hover:bg-blue-900 py-6 text-lg"
                            >
                                {lookupLoading
                                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking…</>
                                    : <><Search className="mr-2 w-5 h-5" /> Check Pass</>}
                            </Button>
                        </form>

                        {/* ── Lookup result ── */}
                        {lookupResult && (
                            <div className="mt-6">
                                {lookupResult.registration.status === 'approved' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium w-full">
                                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                            Registration approved! Your pass is ready.
                                        </div>
                                        <div ref={passRef} className="w-full">
                                            <PassCard
                                                reg={lookupResult.registration}
                                                eventTitle={lookupResult.event?.title || 'NSS Event'}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleDownload}
                                            disabled={downloading}
                                            className="w-full bg-nss-red hover:bg-red-700 py-5 text-base rounded-xl"
                                        >
                                            <Download className="mr-2 w-5 h-5" />
                                            {downloading ? 'Preparing…' : 'Download Pass (PNG)'}
                                        </Button>
                                    </div>
                                ) : lookupResult.registration.status === 'pending' ? (
                                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-4 text-sm">
                                        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold mb-1">Registration Pending Approval</p>
                                            <p>Your registration for <strong>{lookupResult.event?.title}</strong> is still being reviewed by the admin. You will receive an email once approved.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4 text-sm">
                                        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold mb-1">Registration Not Approved</p>
                                            <p>Unfortunately your registration was not approved. Please contact the NSS team at nssrscoe073@gmail.com for more information.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Register;
