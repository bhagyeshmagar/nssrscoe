import { useState, useEffect, useCallback } from 'react';
import { specialCampsAPI, volunteersAPI, DEPARTMENTS, decodeToken } from '../../services/api';
import type { AcademicYear, SpecialCamp, VolunteerWithProfile } from '../../services/api';
import { useFlash, useAYSelector, PasswordPromptModal } from './Shared';
import { useAuthStore } from '../../stores/authStore';

type Participant = {
    id: number;
    volunteerId?: number;
    snapName?: string;
    currentName?: string;
    name?: string;
    snapDepartment?: string;
    currentDept?: string;
    department?: string;
    snapCollegeYearAtEnrollment?: string;
    collegeYear?: string;
    snapNssYear?: number;
    nssYear?: number;
};

type SpecialCampWithParticipants = SpecialCamp & {
    participants?: Participant[];
};

export const SpecialCampsTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, currentAY);
    const [camps, setCamps] = useState<SpecialCampWithParticipants[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', location: '', startDate: '', endDate: '', description: '', volunteerCap: 50 });
    const { msg, flash } = useFlash();

    // Manage Participants State
    const [manageCampId, setManageCampId] = useState<number | null>(null);
    const [campDetails, setCampDetails] = useState<SpecialCampWithParticipants | null>(null);
    const [ayVols, setAyVols] = useState<VolunteerWithProfile[]>([]);
    const [selectedVolIds, setSelectedVolIds] = useState<Set<number>>(new Set());
    const [savingParticipants, setSavingParticipants] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);

    // Unlock State
    const [unlockCamp, setUnlockCamp] = useState<SpecialCampWithParticipants | null>(null);

    const load = useCallback(async () => { 
        if (!selectedAyId) return; 
        try { 
            const r = await specialCampsAPI.getByAY(selectedAyId); 
            setCamps(r.data.data);
        } catch (err: unknown) { 
            const e = err as { response?: { data?: { message?: string } } }; 
            console.error(e);
            flash('err', e.response?.data?.message ?? 'Failed to load camps.'); 
        } 
    }, [selectedAyId, flash]);
    
    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId, setSelectedAyId]);
    
    const handleCreate = async () => {
        try { 
            await specialCampsAPI.create(selectedAyId, form); 
            setShowForm(false); 
            setForm({ name: '', location: '', startDate: '', endDate: '', description: '', volunteerCap: 50 }); 
            flash('ok', 'Camp created.'); 
            load(); 
        } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        }
    };

    const openManage = async (campId: number) => {
        try {
            const [cRes, vRes] = await Promise.all([
                specialCampsAPI.getById(campId),
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            const cData = cRes.data.data;
            const vData = vRes.data.data;
            setCampDetails(cData);
            setAyVols(vData?.data || []);
            setSelectedVolIds(new Set(cData.participants.map((p: Participant) => p.volunteerId).filter((id: number | undefined) => id !== undefined) as number[]));
            setManageCampId(campId);
        } catch (e: any) {
            flash('err', 'Failed to load camp details.');
        }
    };

    const handleSaveParticipants = async () => {
        if (!manageCampId || !campDetails) return;
        if (selectedVolIds.size !== campDetails.volunteerCap) {
            flash('err', `You must select exactly ${campDetails.volunteerCap} volunteers. You have selected ${selectedVolIds.size}.`);
            return;
        }
        setSavingParticipants(true);
        try {
            await specialCampsAPI.setParticipantsBulk(manageCampId, Array.from(selectedVolIds));
            flash('ok', 'Participants updated.');
            setManageCampId(null);
            load();
        } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } };
            flash('err', e.response?.data?.message ?? 'Failed to update participants.');
        } finally {
            setSavingParticipants(false);
        }
    };
    
    const handleFinalize = async (id: number) => {
        if (!confirm('Finalize camp? This will permanently freeze participant data.')) return;
        setActionId(id);
        try { 
            await specialCampsAPI.finalize(id); 
            flash('ok', 'Finalized.'); 
            load(); 
        } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setActionId(null);
        }
    };
    
    const handleDelete = async (id: number) => {
        if (!confirm('Delete? This action is permanent.')) return;
        setActionId(id);
        try { 
            await specialCampsAPI.delete(id); 
            flash('ok', 'Deleted.'); 
            load(); 
        } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } }; 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setActionId(null);
        }
    };
    
    const handleUnlock = async (pwd: string) => {
        if (!unlockCamp) return false;
        try {
            await specialCampsAPI.unlock(unlockCamp.id, pwd);
            flash('ok', 'Camp unlocked successfully.');
            setUnlockCamp(null);
            load();
            return true;
        } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } } };
            flash('err', e.response?.data?.message ?? 'Invalid password or failed to unlock.');
            return false;
        }
    };

    const [expandedCampId, setExpandedCampId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const sortParticipants = (participants: Participant[]) => {
        const getVal = (p: Participant, key: string) => {
            if (key === 'snapName') return p.snapName || p.currentName || p.name || '';
            if (key === 'snapDepartment') return p.snapDepartment || p.currentDept || p.department || '';
            if (key === 'snapCollegeYear') return p.snapCollegeYearAtEnrollment || p.collegeYear || '';
            if (key === 'snapNssYear') return p.snapNssYear || p.nssYear || 0;
            return '';
        };

        return [...participants].sort((a, b) => {
            const key = sortConfig?.key || 'snapDepartment';
            const dir = sortConfig?.direction === 'desc' ? -1 : 1;
            const aVal = getVal(a, key);
            const bVal = getVal(b, key);

            if (key === 'snapDepartment') {
                const aRank = DEPARTMENTS.indexOf(aVal as any) > -1 ? DEPARTMENTS.indexOf(aVal as any) : 999;
                const bRank = DEPARTMENTS.indexOf(bVal as any) > -1 ? DEPARTMENTS.indexOf(bVal as any) : 999;
                if (aRank !== bRank) return (aRank - bRank) * dir;
            }

            return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
        });
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleExpand = async (campId: number) => {
        if (expandedCampId === campId) {
            setExpandedCampId(null);
        } else {
            try {
                const res = await specialCampsAPI.getById(campId);
                const cData = res.data.data;
                setCamps(prev => prev.map(c => c.id === campId ? { ...c, participants: cData.participants, volunteerCap: cData.volunteerCap } : c));
                setExpandedCampId(campId);
            } catch (_e) {
                flash('err', 'Failed to load participants.');
            }
        }
    };
    
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Special Camps</h2>
                <div className="flex items-center gap-3">
                <select value={selectedAyId || ''} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                </select>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
                    + New Camp
                </button>
            </div>
            </div>
            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {[{ k: 'name', l: 'Camp Name' }, { k: 'location', l: 'Location' }].map(f => <div key={f.k}><label className="block text-sm text-gray-600 mb-1">{f.l}</label><input value={(form as Record<string, any>)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>)}
                        {[{ k: 'startDate', l: 'Start' }, { k: 'endDate', l: 'End' }].map(f => <div key={f.k}><label className="block text-sm text-gray-600 mb-1">{f.l}</label><input type="date" value={(form as Record<string, any>)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>)}
                        <div><label className="block text-sm text-gray-600 mb-1">Volunteer Cap</label><input type="number" min="1" value={form.volunteerCap} onChange={e => setForm({ ...form, volunteerCap: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex gap-3"><button onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Create</button><button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button></div>
                </div>
            )}
            <div className="space-y-4">
                {camps.length === 0 && <p className="text-gray-500 text-sm bg-white rounded-xl shadow p-6">No camps yet.</p>}
                {camps.map(c => (
                    <div key={c.id} className="bg-white rounded-xl shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1"><span className="font-bold text-gray-800">{c.name}</span>{c.isFinalized ? <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">Finalized</span> : <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Draft</span>}</div>
                                <p className="text-sm text-gray-500">{c.location} · {c.startDate} → {c.endDate}</p>
                            </div>
                            {selectedAY && !selectedAY.isLocked && (
                                <div className="flex gap-2">
                                    <button onClick={() => toggleExpand(c.id)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                        {expandedCampId === c.id ? 'Hide Participants' : 'View Participants'}
                                    </button>
                                    <button onClick={() => openManage(c.id)} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Manage</button>
                                    {!c.isFinalized ? (
                                        <>
                                            {isSuperadmin && <button onClick={() => handleFinalize(c.id)} disabled={actionId === c.id} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Finalize</button>}
                                            {isSuperadmin && <button onClick={() => handleDelete(c.id)} disabled={actionId === c.id} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50">Delete</button>}
                                        </>
                                    ) : (
                                        isSuperadmin && <button onClick={() => setUnlockCamp(c)} className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Unlock</button>
                                    )}
                                </div>
                            )}
                            {(!selectedAY || selectedAY.isLocked) && (
                                <button onClick={() => toggleExpand(c.id)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                    {expandedCampId === c.id ? 'Hide Participants' : 'View Participants'}
                                </button>
                            )}
                        </div>
                        {expandedCampId === c.id && c.participants && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="font-semibold text-gray-700 mb-3">Selected Volunteers ({c.participants.length} / {c.volunteerCap ?? 50})</h4>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapName')}>Name {sortConfig?.key === 'snapName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapDepartment')}>Department {sortConfig?.key === 'snapDepartment' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapCollegeYear')}>College Year {sortConfig?.key === 'snapCollegeYear' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapNssYear')}>NSS Year {sortConfig?.key === 'snapNssYear' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortParticipants(c.participants).map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2">{p.snapName || p.currentName}</td>
                                                    <td className="px-4 py-2">{p.snapDepartment || p.currentDept}</td>
                                                    <td className="px-4 py-2">{p.snapCollegeYearAtEnrollment || p.collegeYear || '-'}</td>
                                                    <td className="px-4 py-2">{p.snapNssYear || p.nssYear || '-'}</td>
                                                </tr>
                                            ))}
                                            {c.participants.length === 0 && (
                                                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No volunteers selected yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Manage Participants Modal */}
            {manageCampId && campDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800">Manage Participants: {campDetails.name}</h3>
                            <button onClick={() => setManageCampId(null)} className="text-gray-400 hover:text-gray-600">✖</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {campDetails.isFinalized ? (
                                <div>
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                        This camp is finalized. Participants cannot be edited.
                                    </div>
                                    <h4 className="font-semibold mb-2">Finalized Participants ({campDetails.participants?.length || 0})</h4>
                                    <ul className="divide-y border rounded-lg">
                                        {(campDetails.participants || []).map((p: Participant) => (
                                            <li key={p.id} className="p-3 text-sm flex justify-between">
                                                <span>{p.snapName}</span>
                                                <span className="text-gray-500">{p.snapDepartment}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold">Select Volunteers (Exactly {campDetails.volunteerCap ?? 50} Required)</h4>
                                        <span className={`text-sm px-2 py-1 rounded ${selectedVolIds.size === (campDetails.volunteerCap ?? 50) ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {selectedVolIds.size} / {campDetails.volunteerCap ?? 50} Selected
                                        </span>
                                    </div>
                                    <div className="border rounded-lg max-h-96 overflow-y-auto overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedVolIds.size === ayVols.length && ayVols.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedVolIds(new Set(ayVols.map(v => v.id)));
                                                                else setSelectedVolIds(new Set());
                                                            }}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapName')}>Name {sortConfig?.key === 'snapName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                    <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => requestSort('snapDepartment')}>Department {sortConfig?.key === 'snapDepartment' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {ayVols.length === 0 && (
                                                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">No regular active volunteers found.</td></tr>
                                                )}
                                                {sortParticipants(ayVols as unknown as Participant[]).map((v: any) => (
                                                    <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                                        const newSet = new Set(selectedVolIds);
                                                        if (newSet.has(v.id)) newSet.delete(v.id);
                                                        else newSet.add(v.id);
                                                        setSelectedVolIds(newSet);
                                                    }}>
                                                        <td className="px-4 py-2">
                                                            <input type="checkbox" checked={selectedVolIds.has(v.id)} readOnly />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium text-gray-800">{v.name}</td>
                                                        <td className="px-4 py-2 text-gray-600">{v.department}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setManageCampId(null)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100">Close</button>
                            {!campDetails.isFinalized && (
                                <button onClick={handleSaveParticipants} disabled={savingParticipants} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {savingParticipants ? 'Saving...' : 'Save Participants'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PasswordPromptModal 
                isOpen={!!unlockCamp} 
                targetLabel={unlockCamp?.name || ''}
                onClose={() => setUnlockCamp(null)} 
                onSubmit={handleUnlock}
            />
        </div>
    );
};
