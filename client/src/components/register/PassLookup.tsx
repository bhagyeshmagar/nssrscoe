import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Search, Loader2, Clock, XCircle, CheckCircle, Download, Hash } from 'lucide-react';
import { registrationsAPI } from '../../services/api';
import type { EventData, EventRegistration } from '../../services/api';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PassCard } from './PassCard';

export const PassLookup = () => {
    const [lookupId, setLookupId] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [lookupResult, setLookupResult] = useState<{ registration: EventRegistration; event: EventData } | null>(null);

    const passRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

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

    return (
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
    );
};
