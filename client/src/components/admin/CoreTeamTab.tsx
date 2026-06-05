import { useState, useEffect, useCallback } from 'react';
import { coreTeamAPI, volunteersAPI, uploadAPI } from '../../services/api';
import type { AcademicYear, CoreTeamRole, CoreTeamAssignment, VolunteerWithProfile } from '../../services/api';
import { useFlash } from './Shared';
import { ExportDataModal } from '../common/ExportDataModal';
import { Download } from 'lucide-react';

export const CoreTeamTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? 0);
    const [assignments, setAssignments] = useState<CoreTeamAssignment[]>([]);
    const [roles, setRoles] = useState<CoreTeamRole[]>([]);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [form, setForm] = useState({ coreTeamRoleId: 0, volunteerId: 0, displayName: '', department: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { msg, flash } = useFlash();

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [aRes, rRes, vRes] = await Promise.all([
                coreTeamAPI.getByAY(selectedAyId), 
                coreTeamAPI.getRoles(), 
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            setAssignments(aRes.data.data);
            setRoles(rRes.data.data);
            setVols(vRes.data.data?.data || []);
        } catch { }
    }, [selectedAyId]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const selectedAY = years.find(y => y.id === selectedAyId);
    const selectedRole = roles.find(r => r.id === form.coreTeamRoleId);
    const isInstitution = selectedRole?.roleType === 'institution';

    const handleAssign = async () => {
        try {
            setUploading(true);
            const payload: any = { coreTeamRoleId: form.coreTeamRoleId };
            if (isInstitution) { 
                payload.displayName = form.displayName; 
                if (selectedFile) {
                    const uploadRes = await uploadAPI.uploadFile(selectedFile);
                    payload.displayPhotoUrl = uploadRes.url;
                }
            } else { 
                payload.volunteerId = form.volunteerId; 
            }
            await coreTeamAPI.assign(selectedAyId, payload);
            setShowForm(false); 
            setSelectedFile(null);
            flash('ok', 'Role assigned.'); 
            load();
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Assignment failed.'); 
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async (id: number) => {
        if (!confirm('Remove?')) return;
        try { 
            await coreTeamAPI.removeAssignment(selectedAyId, id); 
            flash('ok', 'Removed.'); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Core Team</h2>
                <div className="flex gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
                    <button onClick={() => setShowExportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center">
                        <Download className="w-4 h-4 mr-1" /> Export
                    </button>
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ Assign Role</button>}
                </div>
            </div>
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}
            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Assign Role</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Role</label>
                            <select value={form.coreTeamRoleId} onChange={e => setForm({ ...form, coreTeamRoleId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                <option value={0}>Select...</option>
                                {['Institute Officers', 'NSS Representatives', 'Department Coordinators', 'Portfolio Leads'].map(category => {
                                    const categoryRoles = roles.filter(r => (r as any).category === category);
                                    if (categoryRoles.length === 0) return null;
                                    return (
                                        <optgroup key={category} label={category}>
                                            {categoryRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </optgroup>
                                    );
                                })}
                            </select></div>
                        {selectedRole && isInstitution && (
                            <>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Display Name</label>
                                    <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Prof. Dr. Name" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                            </>
                        )}
                        {selectedRole && !isInstitution && (
                            <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Volunteer</label>
                                <select value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value={0}>Select...</option>{vols.map(v => <option key={v.id} value={v.id}>{v.name} - {v.department}</option>)}
                                </select></div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAssign} disabled={uploading} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                            {uploading ? 'Assigning...' : 'Assign'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b"><tr>{['Role', 'Name', 'Type', 'Dept', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}</tr></thead>
                    <tbody className="divide-y">
                        {assignments.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No assignments yet.</td></tr>}
                        {assignments.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{a.role.name}</td>
                                <td className="px-4 py-3">{a.volunteer?.name ?? a.displayName ?? '-'}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full ${a.role.type === 'institution' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.role.type}</span></td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{a.department ?? a.volunteer?.department ?? '-'}</td>
                                <td className="px-4 py-3">{selectedAY && !selectedAY.isLocked && <button onClick={() => handleRemove(a.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Remove</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <ExportDataModal 
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={assignments.map(a => ({
                    roleName: a.role.name,
                    displayName: a.volunteer?.name ?? a.displayName ?? '-',
                    roleType: a.role.type,
                    department: a.department ?? a.volunteer?.department ?? '-',
                }))}
                columns={[
                    { key: 'roleName', label: 'Role' },
                    { key: 'displayName', label: 'Name' },
                    { key: 'roleType', label: 'Type' },
                    { key: 'department', label: 'Department' }
                ]}
                filename={`CoreTeam_Export_AY_${selectedAY?.label || 'All'}`}
            />
        </div>
    );
};
