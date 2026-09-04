import { useState, useEffect, useCallback } from 'react';
import { coreTeamAPI, volunteersAPI, uploadAPI } from '../../services/api';
import type { CoreTeamRole, CoreTeamAssignment, VolunteerWithProfile, AssignRoleData } from '../../services/api';
import { useFlash, useAYSelector } from './Shared';
import { ExportDataModal } from '../common/ExportDataModal';
import ImageCropperModal from '../common/ImageCropperModal';
import { Download, Trash2 } from 'lucide-react';
import { useAcademicYears } from '../../hooks/useAcademicYears';

export const CoreTeamTab = (_props: { isSuperadmin: boolean }) => {
    const { data: years = [] } = useAcademicYears();
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, null);
    
    const [assignments, setAssignments] = useState<CoreTeamAssignment[]>([]);
    const [roles, setRoles] = useState<CoreTeamRole[]>([]);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [form, setForm] = useState<Omit<AssignRoleData, 'coreTeamRoleId'> & { coreTeamRoleId: number | string }>({ coreTeamRoleId: 0, volunteerId: 0, displayName: '', displayPhotoUrl: '', department: '', customRoleName: '', customCategory: '', displayOrder: 0 });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);
    
    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
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
        } catch (e: any) { 
            console.error(e); 
            flash('err', e.response?.data?.message || 'Failed to load core team data.');
        }
    }, [selectedAyId, flash]);

    useEffect(() => { load(); }, [load]);
    
    const selectedRole = roles.find(r => r.id === form.coreTeamRoleId);
    const isInstitution = selectedRole?.roleType === 'institution' || (typeof form.coreTeamRoleId === 'string' && (form.coreTeamRoleId.includes('Institute Officers') || form.coreTeamRoleId.includes('NSS Program Officer')));

    const PREDEFINED_CODES = ['principal', 'nss_program_officer', 'boys_representative', 'girls_representative', 'department_coordinator'];
    const isCustomRole = selectedRole && !PREDEFINED_CODES.includes(selectedRole.code);

    const handleDeleteRole = async () => {
        if (!selectedRole || !confirm(`Are you sure you want to permanently delete the role "${selectedRole.name}"? This cannot be undone.`)) return;
        setIsSubmitting(true);
        try {
            await coreTeamAPI.deleteRole(selectedRole.id);
            flash('ok', 'Role deleted successfully.');
            setForm({ ...form, coreTeamRoleId: 0 });
            load();
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Failed to delete role.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssign = async () => {
        if (!isInstitution && !form.volunteerId) {
            flash('err', 'Please select a volunteer.');
            return;
        }
        try {
            setIsSubmitting(true);
            const payload: any = { coreTeamRoleId: form.coreTeamRoleId, displayOrder: form.displayOrder };
            
            if (typeof form.coreTeamRoleId === 'string' && form.coreTeamRoleId.startsWith('custom-')) {
                payload.coreTeamRoleId = -1;
                payload.customRoleName = form.customRoleName;
                payload.customCategory = form.coreTeamRoleId.replace('custom-', '');
            }

            if (isInstitution) { 
                payload.displayName = form.displayName; 
                if (selectedFile) {
                    const uploadRes = await uploadAPI.uploadFile(selectedFile);
                    payload.displayPhotoUrl = uploadRes.url;
                }
            } else { 
                payload.volunteerId = form.volunteerId; 
            }

            if (editingId) {
                await coreTeamAPI.updateAssignment(selectedAyId, editingId, payload);
                flash('ok', 'Assignment updated.'); 
            } else {
                await coreTeamAPI.assign(selectedAyId, payload);
                flash('ok', 'Role assigned.'); 
            }
            setShowForm(false); 
            setEditingId(null);
            setSelectedFile(null);
            load();
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Operation failed.'); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (id: number) => {
        if (!confirm('Remove?')) return;
        setActionId(id);
        try { 
            await coreTeamAPI.removeAssignment(selectedAyId, id); 
            flash('ok', 'Removed.'); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setActionId(null);
        }
    };

    const handleEdit = (a: CoreTeamAssignment) => {
        setEditingId(a.id);
        setForm({
            coreTeamRoleId: a.role.id,
            volunteerId: a.volunteer?.id || 0,
            displayName: a.displayName || '',
            displayPhotoUrl: a.displayPhotoUrl || '',
            department: a.department || '',
            customRoleName: '',
            customCategory: '',
            displayOrder: a.displayOrder || 0,
        });
        setSelectedFile(null);
        setShowForm(true);
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
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ coreTeamRoleId: 0, volunteerId: 0, displayName: '', displayPhotoUrl: '', department: '', customRoleName: '', customCategory: '', displayOrder: 0 }); setSelectedFile(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Assign Role</button>}
                </div>
            </div>
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}
            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-700 mb-4">{editingId ? 'Edit Assignment' : 'Assign Role'}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Role</label>
                            <select value={form.coreTeamRoleId} onChange={e => { const val = e.target.value; setForm({ ...form, coreTeamRoleId: isNaN(Number(val)) ? val : Number(val) }); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" disabled={!!editingId}>
                                <option value={0}>Select...</option>
                                {['Institute Officers', 'NSS Program Officer', 'NSS Representatives', 'Department Coordinators', 'Portfolio Leads'].map(category => {
                                    const categoryRoles = roles.filter(r => r.category === category);
                                    return (
                                        <optgroup key={category} label={category}>
                                            {categoryRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            <option value={`custom-${category}`}>Other (Custom {category})</option>
                                        </optgroup>
                                    );
                                })}
                            </select>
                            {isCustomRole && (
                                <button onClick={handleDeleteRole} className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center">
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete this Custom Role
                                </button>
                            )}
                        </div>
                        {typeof form.coreTeamRoleId === 'string' && form.coreTeamRoleId.startsWith('custom-') && (
                            <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Custom Role Name</label>
                                <input value={form.customRoleName || ''} onChange={e => setForm({ ...form, customRoleName: e.target.value })} placeholder={`E.g., Custom ${form.coreTeamRoleId.replace('custom-', '')}`} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        )}
                        {isInstitution && (
                            <>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Display Name</label>
                                    <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Prof. Dr. Name" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Priority / Order</label>
                                    <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" title="Lower number appears first" /></div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCropImageSrc(reader.result as string);
                                                setCropModalOpen(true);
                                            };
                                            reader.readAsDataURL(file);
                                            e.target.value = '';
                                        }
                                    }} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
                                    {selectedFile && (
                                        <div className="flex items-center gap-3 bg-green-50 p-2 rounded border border-green-200">
                                            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-12 w-12 object-cover rounded-full border border-gray-300" />
                                            <span className="text-sm text-green-700 font-medium">✓ Photo ready for upload</span>
                                            <button onClick={() => setSelectedFile(null)} className="ml-auto text-xs text-red-600 hover:text-red-800 bg-white px-2 py-1 rounded border">Remove</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {selectedRole && selectedRole.roleType !== 'institution' && (
                            <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Volunteer</label>
                                <select value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value={0}>Select...</option>{vols.map(v => <option key={v.id} value={v.id}>{v.name} - {v.department}</option>)}
                                </select></div>
                        )}
                        {typeof form.coreTeamRoleId === 'string' && form.coreTeamRoleId.startsWith('custom-') && !form.coreTeamRoleId.includes('Institute Officers') && !form.coreTeamRoleId.includes('NSS Program Officer') && (
                            <>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Volunteer</label>
                                    <select value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value={0}>Select...</option>{vols.map(v => <option key={v.id} value={v.id}>{v.name} - {v.department}</option>)}
                                    </select></div>
                                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Priority / Order</label>
                                    <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" title="Lower number appears first" /></div>
                            </>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAssign} disabled={isSubmitting} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                            {isSubmitting ? (editingId ? 'Updating...' : 'Assigning...') : (editingId ? 'Update' : 'Assign')}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} disabled={isSubmitting} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b"><tr>{['Role', 'Name', 'Type', 'Dept', 'Priority', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}</tr></thead>
                    <tbody className="divide-y">
                        {assignments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No assignments yet.</td></tr>}
                        {assignments.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{a.role.name}</td>
                                <td className="px-4 py-3">{a.volunteer?.name ?? a.displayName ?? '-'}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full ${a.role.type === 'institution' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.role.type}</span></td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{a.department ?? a.volunteer?.department ?? '-'}</td>
                                <td className="px-4 py-3 font-medium">{a.displayOrder ?? 0}</td>
                                <td className="px-4 py-3">
                                    {selectedAY && !selectedAY.isLocked && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(a)} disabled={actionId === a.id} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">Edit</button>
                                            <button onClick={() => handleRemove(a.id)} disabled={actionId === a.id} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50">Remove</button>
                                        </div>
                                    )}
                                </td>
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

            <ImageCropperModal
                isOpen={cropModalOpen}
                imageSrc={cropImageSrc}
                aspectRatio={undefined} // Free ratio crop
                onClose={() => setCropModalOpen(false)}
                onCropComplete={(croppedFile) => {
                    setSelectedFile(croppedFile);
                    setCropModalOpen(false);
                }}
            />
        </div>
    );
};
