import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Search, Loader2, Clock, XCircle, CheckCircle, Download, Hash } from 'lucide-react';
import { registrationsAPI } from '../../services/api';

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
    const [lookupResult, setLookupResult] = useState<any | null>(null);

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
            const payload = (res.data as any).data;
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
                        {lookupResult.status === 'approved' ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium w-full">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    Registration approved! Your pass is ready.
                                </div>
                                <div ref={passRef} className="w-full">
                                    <PassCard
                                        reg={lookupResult as any}
                                        eventTitle={lookupResult.eventTitle || 'NSS Event'}
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
                        ) : null}
                        {lookupResult.status === 'pending' && (
                            <div className="flex flex-col items-center justify-center py-6">
                                <Clock className="w-12 h-12 text-yellow-500 mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold text-yellow-800">Approval Pending</h3>
                                <p className="text-sm text-yellow-700 text-center mt-2 px-4 max-w-sm">
                                    Your registration is <strong className="font-bold">pending admin approval</strong>. Your pass will be ready to view or download once approved.
                                </p>
                            </div>
                        )}
                        {lookupResult.status === 'rejected' && (
                            <div className="flex flex-col items-center justify-center py-6">
                                <XCircle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold text-red-800">Registration Rejected</h3>
                                <p className="text-sm text-red-700 text-center mt-2 px-4 max-w-sm">
                                    Unfortunately, your registration for this event was not approved.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
