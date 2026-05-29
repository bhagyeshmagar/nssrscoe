import { useState } from 'react';
import { academicYearsAPI, uploadAPI } from '../../services/api';
import type { AcademicYear } from '../../services/api';
import { AYStatusBadge, useFlash } from './Shared';

export const AcademicYearsTab = ({ years, onRefresh, isSuperadmin }: { years: AcademicYear[]; onRefresh: () => void; isSuperadmin: boolean }) => {
    const [form, setForm] = useState({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
    const [showForm, setShowForm] = useState(false);
    const { msg, flashString: flash } = useFlash();
    const [busy, setBusy] = useState<number | null>(null);

    const handleCreate = async () => {
        try {
            await academicYearsAPI.create({ ...form, volunteerCap: Number(form.volunteerCap) });
            setShowForm(false); setForm({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
            onRefresh(); flash('Academic year created.');
        } catch (e: any) { flash(e.response?.data?.message ?? 'Error.'); }
    };
    
    const act = async (fn: () => Promise<any>, id: number) => {
        setBusy(id); 
        try { 
            await fn(); 
            onRefresh(); 
        } catch (e: any) { 
            flash(e.response?.data?.message ?? 'Error.'); 
        } 
        setBusy(null);
    };

    const handleUploadReport = async (ayId: number, type: 'regularActivityReportUrl' | 'specialCampReportUrl', file: File) => {
        setBusy(ayId);
        try {
            const { url } = await uploadAPI.uploadFile(file);
            await academicYearsAPI.update(ayId, { [type]: url });
            onRefresh();
            flash('Report uploaded successfully.');
        } catch (e: any) { flash(e.response?.data?.message ?? 'Upload failed.'); }
        setBusy(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Academic Years</h2>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ New AY</button>
            </div>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg.text}</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Create Academic Year</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm text-gray-600 mb-1">Label (e.g. 2025-26)</label>
                            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="2025-26" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1">Volunteer Cap</label>
                            <input type="number" value={form.volunteerCap} onChange={e => setForm({ ...form, volunteerCap: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1">Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1">End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Create</button>
                        <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                {years.length === 0 && <p className="text-gray-500 text-sm">No academic years yet.</p>}
                {years.map(ay => (
                    <div key={ay.id} className={`bg-white rounded-xl shadow p-5 border-l-4 ${ay.isCurrent ? 'border-green-500' : ay.isLocked ? 'border-red-400' : ay.isArchived ? 'border-gray-300' : 'border-yellow-400'}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1"><span className="text-lg font-bold text-gray-800">{ay.label}</span><AYStatusBadge ay={ay} /></div>
                                <p className="text-sm text-gray-500">{ay.startDate} → {ay.endDate} · Cap: {ay.volunteerCap}</p>
                            </div>
                            <div className="flex gap-2">
                                {!ay.isCurrent && !ay.isLocked && !ay.isArchived && (
                                    <button disabled={busy === ay.id} onClick={() => act(() => academicYearsAPI.activate(ay.id), ay.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">Activate</button>
                                )}
                                {ay.isCurrent && !ay.isLocked && (
                                    <button disabled={busy === ay.id} onClick={() => { if (confirm(`Lock AY ${ay.label}? This can only be reversed by a superadmin.`)) act(() => academicYearsAPI.lock(ay.id), ay.id); }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">🔒 Lock</button>
                                )}
                                {ay.isLocked && !ay.isArchived && (
                                    <button disabled={busy === ay.id} onClick={() => { if (confirm(`Archive AY ${ay.label}?`)) act(() => academicYearsAPI.archive(ay.id), ay.id); }} className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50">Archive</button>
                                )}
                                {isSuperadmin && ay.isLocked && !ay.isArchived && (
                                    <button disabled={busy === ay.id} onClick={() => { const pwd = prompt(`Superadmin Password required to unlock AY ${ay.label}:`); if (pwd) act(() => academicYearsAPI.unlock(ay.id, pwd), ay.id); }} className="text-xs border border-red-500 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">🔓 Unlock</button>
                                )}
                            </div>
                        </div>

                        {/* Reports Section */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity Reports</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Regular Activity Report</span>
                                        {ay.regularActivityReportUrl && <a href={uploadAPI.getFullUrl(ay.regularActivityReportUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">📄 View</a>}
                                    </div>
                                    <input type="file" accept=".pdf,.docx,.doc" onChange={e => { if (e.target.files?.[0]) handleUploadReport(ay.id, 'regularActivityReportUrl', e.target.files[0]); }} className="text-xs text-gray-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Special Camp Report</span>
                                        {ay.specialCampReportUrl && <a href={uploadAPI.getFullUrl(ay.specialCampReportUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">📄 View</a>}
                                    </div>
                                    <input type="file" accept=".pdf,.docx,.doc" onChange={e => { if (e.target.files?.[0]) handleUploadReport(ay.id, 'specialCampReportUrl', e.target.files[0]); }} className="text-xs text-gray-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
