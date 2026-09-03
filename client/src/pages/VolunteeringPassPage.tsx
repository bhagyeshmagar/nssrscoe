import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationsAPI } from '../services/api';
import { Download, CheckCircle, XCircle, Clock, Calendar, MapPin, Hash, User } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

import { formatDate } from '@/utils/dateFormatter';
interface PassData {
    registration: {
        id: number;
        name: string;
        email: string;
        phone: string;
        department: string;
        year: string;
        visitorPassId: string;
        status: string;
        createdAt: string;
    };
    event: {
        id: number;
        title: string;
        date: string;
        location: string;
        imageUrl?: string;
    };
}

const VolunteeringPassPage = () => {
    const { visitorId } = useParams<{ visitorId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<PassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const passRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!visitorId) { setNotFound(true); setLoading(false); return; }
        registrationsAPI.getByVisitorId(visitorId)
            .then(res => {
                const payload = (res.data as any).data;
                setData(payload as PassData);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [visitorId]);

    const handleDownload = async () => {
        if (!passRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(passRef.current, { scale: 2, useCORS: true });
            const link = document.createElement('a');
            link.download = `NSS-Pass-${visitorId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Download failed', e);
        }
        setDownloading(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue" />
        </div>
    );

    if (notFound || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm">
                <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pass Not Found</h2>
                <p className="text-gray-500 text-sm mb-6">The pass ID <code className="bg-gray-100 px-1 rounded">{visitorId}</code> is not valid or does not exist.</p>
                <button onClick={() => navigate('/')} className="bg-nss-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition">
                    Go to Home
                </button>
            </div>
        </div>
    );

    const { registration: reg, event } = data;
    const isPending = reg.status === 'pending';
    const isApproved = reg.status === 'approved';
    const isRejected = reg.status === 'rejected';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-sm mx-auto">

                {/* Status banner */}
                {isPending && (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        Your registration is <strong>pending admin approval</strong>. Your pass will be emailed once approved.
                    </div>
                )}
                {isRejected && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
                        <XCircle className="w-4 h-4 flex-shrink-0" />
                        Your registration was <strong>not approved</strong>. Please contact the NSS team for more info.
                    </div>
                )}

                {/* Pass card (only rendered for approved) */}
                {isApproved && (
                    <>
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            Your registration is <strong>approved</strong>. Download your pass below.
                        </div>

                        {/* The actual pass card for download */}
                        <div ref={passRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-nss-blue">
                            {/* Header */}
                            <div className="bg-nss-blue text-white p-5 text-center">
                                <div className="flex justify-center items-center gap-3 mb-3">
                                    <img src="/assets/nss_logo.jpg" alt="NSS" className="w-10 h-10 rounded-full bg-white p-0.5" />
                                    <img src="/assets/rscoe_logo.png" alt="RSCOE" className="w-10 h-10 rounded-full bg-white p-0.5" />
                                </div>
                                <h3 className="font-bold text-xl tracking-widest uppercase">Volunteering Pass</h3>
                                <p className="text-xs opacity-80 mt-1">NSS – JSPM RSCOE</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 relative">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                                    <img src="/assets/nss_logo.jpg" alt="" className="w-48 h-48 grayscale" />
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full"><User className="w-5 h-5 text-nss-blue" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Volunteer Name</p>
                                        <p className="font-bold text-lg text-gray-900">{reg.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full"><Hash className="w-5 h-5 text-nss-blue" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pass ID</p>
                                        <p className="font-mono font-bold text-xl text-nss-blue tracking-wider">{reg.visitorPassId}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full"><Calendar className="w-5 h-5 text-nss-blue" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Event</p>
                                        <p className="font-semibold text-gray-800 text-sm leading-tight">{event.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full"><MapPin className="w-5 h-5 text-nss-blue" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Venue</p>
                                        <p className="font-semibold text-gray-800 text-sm">{event.location}</p>
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-gray-200 pt-3">
                                    <p className="text-xs text-gray-500">{reg.department} · {reg.year}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 border-t px-4 py-3 text-center">
                                <p className="text-[10px] text-gray-400">Present this pass at the event venue · Valid only for the registered event</p>
                            </div>
                        </div>

                        {/* Download button */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full mt-5 flex items-center justify-center gap-2 bg-nss-blue hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition disabled:opacity-60"
                        >
                            <Download className="w-5 h-5" />
                            {downloading ? 'Preparing…' : 'Download Pass (PNG)'}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-2">You can also print this page from your browser.</p>
                    </>
                )}

                {/* Show registration info for pending/rejected too */}
                {!isApproved && (
                    <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-700 space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium">{reg.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Pass ID</span><span className="font-mono text-nss-blue font-semibold">{reg.visitorPassId}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Event</span><span className="font-medium text-right max-w-[60%]">{event.title}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Submitted</span><span>{reg.createdAt ? formatDate(reg.createdAt) : '—'}</span></div>
                    </div>
                )}

                <div className="text-center mt-6">
                    <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-nss-blue transition">
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VolunteeringPassPage;
