import { useState } from 'react';
import { uploadAPI } from '../../services/api';
import type { AcademicYear } from '../../services/api';
import { AYStatusBadge, useFlash, PasswordPromptModal, ConfirmModal } from './Shared';
import { 
    useAcademicYears, useCreateAY, useActivateAY, 
    useLockAY, useUnlockAY, useArchiveAY, 
    useUnarchiveAY, useDeleteAY, useUpdateAY 
} from '../../hooks/useAcademicYears';

interface AcademicYearReportsProps {
    ay: AcademicYear;
    busy: number | null;
    handleUploadReport: (ayId: number, type: 'regularActivityReportUrl' | 'specialCampReportUrl', file: File) => Promise<void>;
}

const AcademicYearReports = ({ ay, busy, handleUploadReport }: AcademicYearReportsProps) => {
    const handleFileChange = (type: 'regularActivityReportUrl' | 'specialCampReportUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleUploadReport(ay.id, type, e.target.files[0]);
        }
        e.target.value = '';
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity Reports</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Regular Activity Report</span>
                        {ay.regularActivityReportUrl && (
                            <a href={uploadAPI.getFullUrl(ay.regularActivityReportUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                                <span>📄</span> View Document
                            </a>
                        )}
                    </div>
                    {ay.regularActivityReportUrl ? (
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="text-green-500 bg-green-100 rounded-full w-4 h-4 inline-flex items-center justify-center">✓</span> Uploaded</span>
                            <label className={`text-xs text-gray-600 hover:text-gray-900 border bg-white px-2 py-1 rounded shadow-sm transition ${busy === ay.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                Replace
                                <input disabled={busy === ay.id} type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange('regularActivityReportUrl')} className="hidden" />
                            </label>
                        </div>
                    ) : (
                        <input disabled={busy === ay.id} type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange('regularActivityReportUrl')} className="text-xs text-gray-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer" />
                    )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Special Camp Report</span>
                        {ay.specialCampReportUrl && (
                            <a href={uploadAPI.getFullUrl(ay.specialCampReportUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                                <span>📄</span> View Document
                            </a>
                        )}
                    </div>
                    {ay.specialCampReportUrl ? (
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="text-green-500 bg-green-100 rounded-full w-4 h-4 inline-flex items-center justify-center">✓</span> Uploaded</span>
                            <label className={`text-xs text-gray-600 hover:text-gray-900 border bg-white px-2 py-1 rounded shadow-sm transition ${busy === ay.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                Replace
                                <input disabled={busy === ay.id} type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange('specialCampReportUrl')} className="hidden" />
                            </label>
                        </div>
                    ) : (
                        <input disabled={busy === ay.id} type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange('specialCampReportUrl')} className="text-xs text-gray-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer" />
                    )}
                </div>
            </div>
        </div>
    );
};

export const AcademicYearsTab = ({ isSuperadmin }: { isSuperadmin: boolean }) => {
    const { data: years = [], isLoading } = useAcademicYears();
    const createAY = useCreateAY();
    const activateAY = useActivateAY();
    const lockAY = useLockAY();
    const unlockAY = useUnlockAY();
    const archiveAY = useArchiveAY();
    const unarchiveAY = useUnarchiveAY();
    const deleteAY = useDeleteAY();
    const updateAY = useUpdateAY();

    const [form, setForm] = useState({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
    const [showForm, setShowForm] = useState(false);
    const { msg, flash } = useFlash();
    const [busy, setBusy] = useState<number | null>(null);
    const [unlockAyState, setUnlockAyState] = useState<AcademicYear | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ ayId: number, action: 'lock'|'archive'|'unarchive'|'delete', title: string, message: string } | null>(null);

    const handleCreate = async () => {
        if (!form.label || !form.startDate || !form.endDate || form.volunteerCap === '') {
            flash('err', 'All fields are required.');
            return;
        }
        if (new Date(form.startDate) >= new Date(form.endDate)) {
            flash('err', 'Start date must be before end date.');
            return;
        }
        const cap = Number(form.volunteerCap);
        if (cap <= 0) {
            flash('err', 'Volunteer cap must be a positive number.');
            return;
        }

        try {
            await createAY.mutateAsync({ ...form, volunteerCap: cap });
            setShowForm(false); 
            setForm({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error creating AY.'); 
        }
    };
    
    const handleUploadReport = async (ayId: number, type: 'regularActivityReportUrl' | 'specialCampReportUrl', file: File) => {
        setBusy(ayId);
        try {
            const { url } = await uploadAPI.uploadFile(file);
            await updateAY.mutateAsync({ id: ayId, data: { [type]: url } });
            flash('ok', 'Report uploaded successfully.');
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Upload failed.'); 
        } finally {
            setBusy(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64 text-gray-500 font-medium animate-pulse">Loading academic years...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Academic Years</h2>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ New AY</button>
            </div>
            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Create Academic Year</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label htmlFor="form-label" className="block text-sm text-gray-600 mb-1">Label (e.g. 2025-26) *</label>
                            <input id="form-label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="2025-26" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label htmlFor="form-cap" className="block text-sm text-gray-600 mb-1">Volunteer Cap *</label>
                            <input id="form-cap" min="1" type="number" value={form.volunteerCap} onChange={e => setForm({ ...form, volunteerCap: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label htmlFor="form-start" className="block text-sm text-gray-600 mb-1">Start Date *</label>
                            <input id="form-start" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label htmlFor="form-end" className="block text-sm text-gray-600 mb-1">End Date *</label>
                            <input id="form-end" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex gap-3">
                        <button disabled={createAY.isPending} onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">Create</button>
                        <button disabled={createAY.isPending} onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
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
                                <p className="text-sm text-gray-500">{ay.startDate.split('T')[0]} → {ay.endDate.split('T')[0]} · Cap: {ay.volunteerCap}</p>
                            </div>
                            <div className="flex gap-2">
                                {!ay.isCurrent && !ay.isLocked && !ay.isArchived && (
                                    <button disabled={activateAY.isPending} onClick={() => activateAY.mutate(ay.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">Activate</button>
                                )}
                                {ay.isCurrent && !ay.isLocked && (
                                    <button disabled={lockAY.isPending} onClick={() => setConfirmAction({ ayId: ay.id, action: 'lock', title: 'Lock Academic Year', message: `Lock AY ${ay.label}? This can only be reversed by a superadmin.` })} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">🔒 Lock</button>
                                )}
                                {ay.isLocked && !ay.isArchived && (
                                    <button disabled={archiveAY.isPending} onClick={() => setConfirmAction({ ayId: ay.id, action: 'archive', title: 'Archive Academic Year', message: `Archive AY ${ay.label}?` })} className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50">Archive</button>
                                )}
                                {isSuperadmin && ay.isLocked && !ay.isArchived && (
                                    <button disabled={unlockAY.isPending} onClick={() => setUnlockAyState(ay)} className="text-xs border border-red-500 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">🔓 Unlock</button>
                                )}
                                {isSuperadmin && ay.isArchived && (
                                    <button disabled={unarchiveAY.isPending} onClick={() => setConfirmAction({ ayId: ay.id, action: 'unarchive', title: 'Unarchive Academic Year', message: `Unarchive AY ${ay.label}?` })} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50">Unarchive</button>
                                )}
                                {!ay.isCurrent && !ay.isLocked && !ay.isArchived && (
                                    <button disabled={deleteAY.isPending} onClick={() => setConfirmAction({ ayId: ay.id, action: 'delete', title: 'Delete Academic Year', message: `Delete AY ${ay.label}? This is permanent and might fail if there are linked records.` })} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">Delete</button>
                                )}
                            </div>
                        </div>

                        <AcademicYearReports ay={ay} busy={busy} handleUploadReport={handleUploadReport} />
                    </div>
                ))}
            </div>

            <PasswordPromptModal 
                isOpen={!!unlockAyState} 
                targetLabel={`AY ${unlockAyState?.label || ''}`}
                onClose={() => setUnlockAyState(null)} 
                onSubmit={async (pwd) => {
                    if (!unlockAyState) return false;
                    try {
                        await unlockAY.mutateAsync({ id: unlockAyState.id, password: pwd });
                        setUnlockAyState(null);
                        return true;
                    } catch (e: any) {
                        return false;
                    }
                }} 
            />
            <ConfirmModal
                isOpen={!!confirmAction}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                confirmText={confirmAction?.action === 'delete' ? 'Delete' : 'Confirm'}
                onClose={() => setConfirmAction(null)}
                onConfirm={async () => {
                    if (!confirmAction) return;
                    const { ayId, action } = confirmAction;
                    if (action === 'lock') await lockAY.mutateAsync(ayId);
                    else if (action === 'archive') await archiveAY.mutateAsync(ayId);
                    else if (action === 'unarchive') await unarchiveAY.mutateAsync(ayId);
                    else if (action === 'delete') await deleteAY.mutateAsync(ayId);
                    setConfirmAction(null);
                }}
            />
        </div>
    );
};
