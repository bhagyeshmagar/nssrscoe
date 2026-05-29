import { useState, useEffect, useCallback } from 'react';
import { volunteersAPI, academicYearsAPI, uploadAPI } from '../../services/api';
import type { AcademicYear, AYStats, VolunteerWithProfile, CreateVolunteerData, Department } from '../../services/api';
import { CapBar } from './Shared';
import { DEPT_LIST } from './Shared';

export const AYVolunteersTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? 0);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [stats, setStats] = useState<AYStats | null>(null);
    const [filter, setFilter] = useState({ dept: '', status: '' as '' | 'regular' | 'backup', search: '' });
    const [showForm, setShowForm] = useState(false);
    const [viewProfileId, setViewProfileId] = useState<number | null>(null);
    const [form, setForm] = useState<CreateVolunteerData>({ name: '', email: '', password: '', department: 'Computer Engineering' as Department });
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [vRes, sRes] = await Promise.all([
                volunteersAPI.getByAY(selectedAyId, { ...(filter.dept && { department: filter.dept }), ...(filter.status && { status: filter.status }), ...(filter.search && { search: filter.search }) }),
                academicYearsAPI.getStats(selectedAyId),
            ]);
            setVols((vRes.data as any)?.data ?? vRes.data); setStats((sRes.data as any)?.data ?? sRes.data);
        } catch { }
    }, [selectedAyId, filter]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const selectedAY = years.find(y => y.id === selectedAyId);

    const handleCreate = async () => {
        try { 
            await volunteersAPI.create(selectedAyId, form); 
            setShowForm(false); 
            setForm({ name: '', email: '', password: '', department: 'Computer Engineering' as Department }); 
            flash('ok', 'Volunteer added.'); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete?')) return;
        try { 
            await volunteersAPI.delete(selectedAyId, id); 
            flash('ok', 'Deleted.'); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        }
    };

    const handleStatusChange = async (id: number, s: 'regular' | 'backup') => {
        try { 
            await volunteersAPI.changeStatus(selectedAyId, id, s); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Volunteers</h2>
                <div className="flex items-center gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ Add</button>}
                </div>
            </div>

            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] AY {selectedAY.label} is locked - read-only.</div>}

            {stats && (
                <div className="bg-white rounded-xl p-4 shadow mb-4">
                    <div className="grid grid-cols-4 gap-4 mb-3">
                        {[{ v: stats.volunteers.regular, l: 'Regular', c: 'text-blue-600' }, { v: stats.volunteers.backup, l: 'Backup', c: 'text-orange-500' }, { v: stats.volunteers.total, l: 'Total', c: 'text-gray-700' }, { v: stats.volunteers.active, l: 'Active', c: 'text-emerald-600' }].map(i => (
                            <div key={i.l} className="text-center"><div className={`text-2xl font-bold ${i.c}`}>{i.v}</div><div className="text-xs text-gray-500">{i.l}</div></div>
                        ))}
                    </div>
                    <CapBar regular={stats.volunteers.regular} cap={selectedAY?.volunteerCap ?? 100} />
                </div>
            )}

            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}

            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-700 mb-4">New Volunteer</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {[{ k: 'name', l: 'Name', t: 'text' }, { k: 'email', l: 'Email', t: 'email' }, { k: 'password', l: 'Password', t: 'text' }].map(f => (
                            <div key={f.k}><label className="block text-sm text-gray-600 mb-1">{f.l}</label>
                                <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        ))}
                        <div><label className="block text-sm text-gray-600 mb-1">Department</label>
                            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value as Department })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                {DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                            </select></div>
                        <div><label className="block text-sm text-gray-600 mb-1">Status</label>
                            <select value={form.status ?? 'regular'} onChange={e => setForm({ ...form, status: e.target.value as 'regular' | 'backup' })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="regular">Regular</option><option value="backup">Backup</option>
                            </select></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Add</button>
                        <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex gap-3 mb-4 flex-wrap">
                <input placeholder="Search..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={filter.dept} onChange={e => setFilter({ ...filter, dept: e.target.value })} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Departments</option>{DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value as '' | 'regular' | 'backup' })} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Status</option><option value="regular">Regular</option><option value="backup">Backup</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>{['Name', 'Email', 'Department', 'Status', 'Active', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                        {vols.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No volunteers found.</td></tr>}
                        {vols.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                                <td className="px-4 py-3 text-gray-600">{v.email}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{v.department}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'regular' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{v.status}</span></td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        <button onClick={() => setViewProfileId(v.id)} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">View</button>
                                        {selectedAY && !selectedAY.isLocked && (
                                            <>
                                                <button onClick={() => handleStatusChange(v.id, v.status === 'regular' ? 'backup' : 'regular')} className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200">→ {v.status === 'regular' ? 'Backup' : 'Regular'}</button>
                                                <button onClick={() => handleDelete(v.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Del</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Profile Modal */}
            {viewProfileId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Volunteer Profile</h3>
                            <button onClick={() => setViewProfileId(null)} className="text-gray-400 hover:text-gray-600">✖</button>
                        </div>
                        <div className="p-6">
                            {(() => {
                                const vol = vols.find(v => v.id === viewProfileId);
                                if (!vol) return <p>Loading...</p>;
                                const p = vol.profile || {};
                                const renderField = (label: string, value: any) => (
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 font-medium">{label}</div>
                                        <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded mt-1">{value || '-'}</div>
                                    </div>
                                );
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-full flex items-center gap-4 mb-4">
                                            {p.profilePhotoUrl ? (
                                                <img src={uploadAPI.getFullUrl(p.profilePhotoUrl)} alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">No Photo</div>
                                            )}
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-800">{vol.name}</h4>
                                                <p className="text-sm text-gray-500">{vol.email}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block mt-1 ${vol.status === 'regular' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{vol.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        {renderField("Full Name (Profile)", p.fullName)}
                                        {renderField("PRN No", p.prnNo)}
                                        {renderField("Department", vol.department)}
                                        {renderField("College Year", p.collegeYearAtEnrollment)}
                                        {renderField("NSS Year", p.nssYear)}
                                        {renderField("CGPA", p.cgpa)}
                                        {renderField("Eligibility No", p.eligibilityNo)}
                                        {renderField("Religion", p.religion)}
                                        {renderField("Caste", p.caste)}
                                        {renderField("Caste Category", p.casteCategory)}
                                        {renderField("Phone Number", p.phoneNo)}

                                        <div className="col-span-full mt-2">
                                            <div className="text-xs text-gray-500 font-medium mb-1">Volunteering Experience</div>
                                            <div className="text-sm text-gray-800 bg-gray-50 px-4 py-3 rounded whitespace-pre-wrap">{p.experienceText || '-'}</div>
                                        </div>

                                        {p.marksheetUrl && (
                                            <div className="col-span-full mt-4">
                                                <a href={uploadAPI.getFullUrl(p.marksheetUrl)} target="_blank" rel="noreferrer" className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
                                                    📄 View Marksheet
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
