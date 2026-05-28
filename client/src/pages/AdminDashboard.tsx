import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    eventsAPI, galleryAPI, membersAPI, settingsAPI, uploadAPI,
    eventImagesAPI, volunteersAPI, registrationsAPI,
    academicYearsAPI, coreTeamAPI, specialCampsAPI, attendanceAPI
} from '../services/api';
import type {
    EventData, GalleryData, MemberData, SiteSettings, EventImage,
    AcademicYear, AYStats, VolunteerWithProfile, CoreTeamRole,
    CoreTeamAssignment, SpecialCamp,
    Department, CreateVolunteerData, EventRegistration,
} from '../services/api';

type TabType =
    | 'overview' | 'academic-years' | 'volunteers' | 'core-team'
    | 'attendance' | 'special-camps' | 'archive'
    | 'events' | 'registrations' | 'gallery' | 'members' | 'settings';

const TAB_GROUPS = [
    {
        label: 'AY Platform', tabs: [
            { id: 'overview', label: 'Overview', icon: '#' },
            { id: 'academic-years', label: 'Academic Years', icon: 'AY' },
            { id: 'volunteers', label: 'Volunteers', icon: 'V' },
            { id: 'core-team', label: 'Core Team', icon: 'CT' },
            { id: 'attendance', label: 'Attendance', icon: 'A' },
            { id: 'special-camps', label: 'Special Camps', icon: 'SC' },
            { id: 'archive', label: 'Archive', icon: 'Z' },
        ]
    },
    {
        label: 'Site Management', tabs: [
            { id: 'events', label: 'Events', icon: 'E' },
            { id: 'registrations', label: 'Registrations', icon: 'R' },
            { id: 'gallery', label: 'Gallery', icon: 'G' },
            { id: 'members', label: 'Members', icon: 'M' },
            { id: 'settings', label: 'Settings', icon: 'S' },
        ]
    },
];

const DEPT_LIST: Department[] = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
];

//Status badge

const AYStatusBadge = ({ ay }: { ay: AcademicYear }) => {
    if (ay.isArchived) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600 font-medium">Archived</span>;
    if (ay.isLocked) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">🔒 Locked</span>;
    if (ay.isCurrent) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Active</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">Draft</span>;
};

const CapBar = ({ regular, cap }: { regular: number; cap: number }) => {
    const pct = Math.min(100, Math.round((regular / cap) * 100));
    const colour = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-yellow-500' : 'bg-emerald-500';
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Regular Volunteers</span>
                <span className={pct >= 100 ? 'text-red-600 font-bold' : ''}>{regular} / {cap}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// Academic Years Tab 

const AcademicYearsTab = ({ years, onRefresh }: { years: AcademicYear[]; onRefresh: () => void }) => {
    const [form, setForm] = useState({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
    const [showForm, setShowForm] = useState(false);
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState<number | null>(null);
    const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const handleCreate = async () => {
        try {
            await academicYearsAPI.create({ ...form, volunteerCap: Number(form.volunteerCap) });
            setShowForm(false); setForm({ label: '', startDate: '', endDate: '', volunteerCap: '100' });
            onRefresh(); flash('Academic year created.');
        } catch (e: any) { flash(e.response?.data?.message ?? 'Error.'); }
    };
    const act = async (fn: () => Promise<any>, id: number) => {
        setBusy(id); try { await fn(); onRefresh(); } catch (e: any) { flash(e.response?.data?.message ?? 'Error.'); } setBusy(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Academic Years</h2>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ New AY</button>
            </div>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg}</div>}
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
                                    <button disabled={busy === ay.id} onClick={() => { if (confirm(`Lock AY ${ay.label}? This is irreversible.`)) act(() => academicYearsAPI.lock(ay.id), ay.id); }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">🔒 Lock</button>
                                )}
                                {ay.isLocked && !ay.isArchived && (
                                    <button disabled={busy === ay.id} onClick={() => { if (confirm(`Archive AY ${ay.label}?`)) act(() => academicYearsAPI.archive(ay.id), ay.id); }} className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50">Archive</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// // AY Volunteers Tab ////////////////////////////////////////////////////////

const AYVolunteersTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
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
    useEffect(() => { if (currentAY && !selectedAyId) setSelectedAyId(currentAY.id); }, [currentAY]);

    const selectedAY = years.find(y => y.id === selectedAyId);

    const handleCreate = async () => {
        try { await volunteersAPI.create(selectedAyId, form); setShowForm(false); setForm({ name: '', email: '', password: '', department: 'Computer Engineering' as Department }); flash('ok', 'Volunteer added.'); load(); }
        catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };
    const handleDelete = async (id: number) => {
        if (!confirm('Delete?')) return;
        try { await volunteersAPI.delete(selectedAyId, id); flash('ok', 'Deleted.'); load(); } catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };
    const handleStatusChange = async (id: number, s: 'regular' | 'backup') => {
        try { await volunteersAPI.changeStatus(selectedAyId, id, s); load(); } catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
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

// // Core Team Tab ////////////////////////////////////////////////////////////

const CoreTeamTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? 0);
    const [assignments, setAssignments] = useState<CoreTeamAssignment[]>([]);
    const [roles, setRoles] = useState<CoreTeamRole[]>([]);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ coreTeamRoleId: 0, volunteerId: 0, displayName: '', department: '' });
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [aRes, rRes, vRes] = await Promise.all([coreTeamAPI.getByAY(selectedAyId), coreTeamAPI.getRoles(), volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })]);
            setAssignments((aRes.data as any)?.data ?? aRes.data); setRoles((rRes.data as any)?.data ?? rRes.data); setVols((vRes.data as any)?.data ?? vRes.data);
        } catch { }
    }, [selectedAyId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (currentAY && !selectedAyId) setSelectedAyId(currentAY.id); }, [currentAY]);

    const selectedAY = years.find(y => y.id === selectedAyId);
    const selectedRole = roles.find(r => r.id === form.coreTeamRoleId);
    const isInstitution = selectedRole?.roleType === 'institution';
    const isDeptCoord = selectedRole?.code === 'department_coordinator';

    const handleAssign = async () => {
        try {
            const payload: any = { coreTeamRoleId: form.coreTeamRoleId };
            if (isInstitution) { payload.displayName = form.displayName; } else { payload.volunteerId = form.volunteerId; if (isDeptCoord) payload.department = form.department; }
            await coreTeamAPI.assign(selectedAyId, payload);
            setShowForm(false); flash('ok', 'Role assigned.'); load();
        } catch (e: any) { flash('err', e.response?.data?.message ?? 'Assignment failed.'); }
    };
    const handleRemove = async (id: number) => {
        if (!confirm('Remove?')) return;
        try { await coreTeamAPI.removeAssignment(selectedAyId, id); flash('ok', 'Removed.'); load(); } catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Core Team</h2>
                <div className="flex gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
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
                                <option value={0}>Select a role...</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name} {r.roleType === 'institution' ? '(Institution)' : ''}</option>)}
                            </select></div>
                        {selectedRole && isInstitution && (
                            <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Display Name</label>
                                <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Prof. Dr. Name" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        )}
                        {selectedRole && !isInstitution && (
                            <div className={isDeptCoord ? '' : 'col-span-2'}><label className="block text-sm text-gray-600 mb-1">Volunteer</label>
                                <select value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value={0}>Select...</option>{vols.map(v => <option key={v.id} value={v.id}>{v.name} - {v.department}</option>)}
                                </select></div>
                        )}
                        {isDeptCoord && (
                            <div><label className="block text-sm text-gray-600 mb-1">Department to Coordinate</label>
                                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select dept...</option>{DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                                </select></div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAssign} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Assign</button>
                        <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow overflow-hidden">
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
        </div>
    );
};

// // Attendance Tab ////////////////////////////////////////////////////////////

const AttendanceTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? 0);
    const [eventsList, setEventsList] = useState<any[]>([]);
    const [volunteersList, setVolunteersList] = useState<VolunteerWithProfile[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
    const [msg, setMsg] = useState('');
    const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
    
    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [eRes, vRes] = await Promise.all([
                eventsAPI.getAll(),
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            const selectedAY = years.find(y => y.id === selectedAyId);
            if (selectedAY) {
                const ayStart = new Date(selectedAY.startDate);
                const ayEnd = new Date(selectedAY.endDate);
                const filteredEvents = (eRes.data as any[]).filter(ev => {
                    const evDate = new Date(ev.date);
                    return evDate >= ayStart && evDate <= ayEnd;
                });
                setEventsList(filteredEvents);
            } else {
                setEventsList(eRes.data);
            }
            setVolunteersList((vRes.data as any)?.data ?? vRes.data);
        } catch { }
    }, [selectedAyId, years]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (currentAY && !selectedAyId) setSelectedAyId(currentAY.id); }, [currentAY]);
    
    const selectedAY = years.find(y => y.id === selectedAyId);

    const handleManage = async (event: any) => {
        try {
            const res = await attendanceAPI.getEventAttendance(selectedAyId, event.id);
            const data = (res.data as any).data || res.data;
            const records = data?.records || [];
            const map: Record<number, boolean> = {};
            volunteersList.forEach(v => map[v.id] = false); // Default absent
            records.forEach((r: any) => {
                if (r.status === 'present') map[r.volunteerId] = true;
            });
            setAttendanceMap(map);
            setSelectedEvent(event);
        } catch (e: any) {
            flash(e.response?.data?.message ?? 'Failed to load attendance.');
        }
    };

    const handleSave = async () => {
        if (!selectedEvent) return;
        const records = volunteersList.map(v => ({
            volunteerId: v.id,
            status: attendanceMap[v.id] ? 'present' : 'absent' as 'present'|'absent'
        }));
        try {
            await attendanceAPI.saveEventAttendance(selectedAyId, selectedEvent.id, records);
            flash('Attendance saved successfully.');
            setSelectedEvent(null);
        } catch (e: any) {
            flash(e.response?.data?.message ?? 'Failed to save attendance.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Attendance</h2>
                <div className="flex gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : ''}</option>)}
                    </select>
                </div>
            </div>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg}</div>}
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}
            
            {!selectedEvent ? (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['Date', 'Event Title', 'Location', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {eventsList.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">No events found for this Academic Year.</td></tr>}
                            {eventsList.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-700">{new Date(e.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-medium">{e.title}</td>
                                    <td className="px-4 py-3 text-gray-500">{e.location}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleManage(e)} className="text-xs px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium">
                                            Manage Attendance
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Attendance for: {selectedEvent.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.location}</p>
                        </div>
                        <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm">Close</button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left w-16">Present</th>
                                    <th className="px-4 py-3 text-left">Volunteer Name</th>
                                    <th className="px-4 py-3 text-left">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {volunteersList.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => !selectedAY?.isLocked && setAttendanceMap(p => ({ ...p, [v.id]: !p[v.id] }))}>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!attendanceMap[v.id]} 
                                                onChange={e => setAttendanceMap(p => ({ ...p, [v.id]: e.target.checked }))}
                                                disabled={!!selectedAY?.isLocked}
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{v.department}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {!selectedAY?.isLocked && (
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setSelectedEvent(null)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Save Attendance</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// // Special Camps Tab /////////////////////////////////////////////////////////

const SpecialCampsTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? 0);
    const [camps, setCamps] = useState<SpecialCamp[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', location: '', startDate: '', endDate: '', description: '' });
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

    // Manage Participants State
    const [manageCampId, setManageCampId] = useState<number | null>(null);
    const [campDetails, setCampDetails] = useState<any | null>(null);
    const [ayVols, setAyVols] = useState<VolunteerWithProfile[]>([]);
    const [selectedVolIds, setSelectedVolIds] = useState<Set<number>>(new Set());
    const [savingParticipants, setSavingParticipants] = useState(false);

    // Unlock State
    const [unlockCampId, setUnlockCampId] = useState<number | null>(null);
    const [unlockPassword, setUnlockPassword] = useState('');

    const load = useCallback(async () => { if (!selectedAyId) return; try { const r = await specialCampsAPI.getByAY(selectedAyId); setCamps((r.data as any)?.data ?? r.data); } catch { } }, [selectedAyId]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (currentAY && !selectedAyId) setSelectedAyId(currentAY.id); }, [currentAY]);
    const selectedAY = years.find(y => y.id === selectedAyId);

    const handleCreate = async () => {
        try { await specialCampsAPI.create(selectedAyId, form); setShowForm(false); setForm({ name: '', location: '', startDate: '', endDate: '', description: '' }); flash('ok', 'Camp created.'); load(); }
        catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };

    const openManage = async (campId: number) => {
        try {
            const [cRes, vRes] = await Promise.all([
                specialCampsAPI.getById(campId),
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            const cData = (cRes.data as any)?.data ?? cRes.data;
            const vData = (vRes.data as any)?.data ?? vRes.data;
            setCampDetails(cData);
            setAyVols(vData);
            setSelectedVolIds(new Set(cData.participants.map((p: any) => p.volunteerId)));
            setManageCampId(campId);
        } catch (e: any) {
            flash('err', 'Failed to load camp details.');
        }
    };

    const handleSaveParticipants = async () => {
        if (!manageCampId) return;
        setSavingParticipants(true);
        try {
            await specialCampsAPI.setParticipantsBulk(manageCampId, Array.from(selectedVolIds));
            flash('ok', 'Participants updated.');
            setManageCampId(null);
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Failed to update participants.');
        } finally {
            setSavingParticipants(false);
        }
    };
    const handleFinalize = async (id: number) => {
        if (!confirm('Finalize camp? This will permanently freeze participant data.')) return;
        try { await specialCampsAPI.finalize(id); flash('ok', 'Finalized.'); load(); } catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };
    const handleDelete = async (id: number) => {
        if (!confirm('Delete?')) return;
        try { await specialCampsAPI.delete(id); flash('ok', 'Deleted.'); load(); } catch (e: any) { flash('err', e.response?.data?.message ?? 'Error.'); }
    };
    const handleUnlock = async () => {
        if (!unlockCampId) return;
        try {
            await specialCampsAPI.unlock(unlockCampId, unlockPassword);
            flash('ok', 'Camp unlocked successfully.');
            setUnlockCampId(null);
            setUnlockPassword('');
            load();
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Invalid password or failed to unlock.');
        }
    };
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Special Camps</h2>
                <div className="flex gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : ''}</option>)}
                    </select>
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ New Camp</button>}
                </div>
            </div>
            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}
            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {[{ k: 'name', l: 'Camp Name' }, { k: 'location', l: 'Location' }].map(f => <div key={f.k}><label className="block text-sm text-gray-600 mb-1">{f.l}</label><input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>)}
                        {[{ k: 'startDate', l: 'Start' }, { k: 'endDate', l: 'End' }].map(f => <div key={f.k}><label className="block text-sm text-gray-600 mb-1">{f.l}</label><input type="date" value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>)}
                        <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
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
                                    <button onClick={() => openManage(c.id)} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Manage</button>
                                    {!c.isFinalized ? (
                                        <>
                                            <button onClick={() => handleFinalize(c.id)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Finalize</button>
                                            <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Delete</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setUnlockCampId(c.id)} className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Unlock</button>
                                    )}
                                </div>
                            )}
                        </div>
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
                                    <h4 className="font-semibold mb-2">Finalized Participants ({campDetails.participants.length})</h4>
                                    <ul className="divide-y border rounded-lg">
                                        {campDetails.participants.map((p: any) => (
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
                                        <h4 className="font-semibold">Select Volunteers</h4>
                                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {selectedVolIds.size} Selected
                                        </span>
                                    </div>
                                    <div className="border rounded-lg max-h-96 overflow-y-auto">
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
                                                    <th className="px-4 py-2 text-left">Name</th>
                                                    <th className="px-4 py-2 text-left">Department</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {ayVols.length === 0 && (
                                                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">No regular active volunteers found.</td></tr>
                                                )}
                                                {ayVols.map(v => (
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

            {/* Unlock Camp Modal */}
            {unlockCampId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Unlock Camp</h3>
                        <p className="text-sm text-gray-600 mb-4">Enter your admin password to unlock this camp for editing.</p>
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setUnlockCampId(null); setUnlockPassword(''); }} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleUnlock} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">Unlock</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// // Archive Tab ///////////////////////////////////////////////////////////////

const ArchiveTab = ({ years }: { years: AcademicYear[] }) => {
    const archived = years.filter(y => y.isArchived);
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Archive</h2>
            {archived.length === 0 && <p className="text-gray-500 text-sm bg-white rounded-xl shadow p-6">No archived academic years yet.</p>}
            <div className="space-y-4">
                {archived.map(ay => (
                    <div key={ay.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-gray-300">
                        <div className="flex items-center gap-3 mb-1"><span className="text-lg font-bold text-gray-600">{ay.label}</span><AYStatusBadge ay={ay} /></div>
                        <p className="text-sm text-gray-500">{ay.startDate} → {ay.endDate}</p>
                        <p className="text-xs text-gray-400 mt-1">All data preserved and read-only</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// // Main AdminDashboard //////////////////////////////////////////////////////

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);

    const [years, setYears] = useState<AcademicYear[]>([]);
    const [currentAY, setCurrentAY] = useState<AcademicYear | null>(null);

    const [events, setEvents] = useState<any[]>([]);
    const [gallery, setGallery] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [showGalleryForm, setShowGalleryForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('userRole'); navigate('/login'); };

    const loadYears = useCallback(async () => {
        try {
            const [allRes, currRes] = await Promise.all([
                academicYearsAPI.getAll(),
                academicYearsAPI.getCurrent().catch(() => ({ data: { data: null } })),
            ]);
            const yearsArr = (allRes.data as any)?.data ?? allRes.data;
            const currentAyObj = (currRes.data as any)?.data ?? null;
            setYears(Array.isArray(yearsArr) ? yearsArr : []);
            setCurrentAY(currentAyObj);
        } catch { setYears([]); }
    }, []);

    useEffect(() => { loadYears(); }, [loadYears]);

    const fetchSiteData = useCallback(async () => {
        const siteTabs = ['overview', 'events', 'gallery', 'members', 'settings'];
        if (!siteTabs.includes(activeTab)) return;
        setLoading(true);
        try {
            switch (activeTab) {
                case 'overview': { const [eR, gR, mR] = await Promise.all([eventsAPI.getAll(), galleryAPI.getAll(), membersAPI.getAll()]); setEvents(eR.data); setGallery(gR.data); setMembers(mR.data); break; }
                case 'events': { const r = await eventsAPI.getAll(); setEvents(r.data); break; }
                case 'gallery': { const r = await galleryAPI.getAll(); setGallery(r.data); break; }
                case 'members': { const r = await membersAPI.getAll(); setMembers(r.data); break; }
                case 'settings': { const r = await settingsAPI.get(); setSettings(r.data); break; }
            }
        } catch (e) { console.error('fetchSiteData:', e); }
        setLoading(false);
    }, [activeTab]);

    useEffect(() => { fetchSiteData(); }, [fetchSiteData]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-nss-blue text-white px-6 py-4 flex justify-between items-center shadow-md flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">NSS Admin</h1>
                    {currentAY && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                            <span className="font-medium">AY {currentAY.label}</span>
                            <AYStatusBadge ay={currentAY} />
                        </div>
                    )}
                </div>
                <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Logout</button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-56 bg-white shadow-md flex-shrink-0 overflow-y-auto">
                    <nav className="py-3">
                        {TAB_GROUPS.map(group => (
                            <div key={group.label} className="mb-2">
                                <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                                {group.tabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 flex-shrink-0">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <OverviewTab events={events} gallery={gallery} members={members} />}
                            {activeTab === 'academic-years' && <AcademicYearsTab years={years} onRefresh={loadYears} />}
                            {activeTab === 'volunteers' && <AYVolunteersTab years={years} currentAY={currentAY} />}
                            {activeTab === 'core-team' && <CoreTeamTab years={years} currentAY={currentAY} />}
                            {activeTab === 'attendance' && <AttendanceTab years={years} currentAY={currentAY} />}
                            {activeTab === 'special-camps' && <SpecialCampsTab years={years} currentAY={currentAY} />}
                            {activeTab === 'archive' && <ArchiveTab years={years} />}
                            {activeTab === 'events' && <EventsTab events={events} onRefresh={fetchSiteData} showForm={showEventForm} setShowForm={setShowEventForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'registrations' && <RegistrationsTab events={events} />}
                            {activeTab === 'gallery' && <GalleryTab gallery={gallery} onRefresh={fetchSiteData} showForm={showGalleryForm} setShowForm={setShowGalleryForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'members' && <MembersTab members={members} onRefresh={fetchSiteData} showForm={showMemberForm} setShowForm={setShowMemberForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'settings' && <SettingsTab settings={settings} onRefresh={fetchSiteData} />}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// // Overview Tab Component ////////////////////////////////////////////////////
const OverviewTab = ({ events, gallery, members }: { events: any[], gallery: any[], members: any[] }) => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Events" count={events.length} color="blue" />
            <StatCard title="Gallery Items" count={gallery.length} color="green" />
            <StatCard title="Team Members" count={members.length} color="purple" />
            <StatCard title="Upcoming Events" count={events.filter(e => e.type === 'upcoming').length} color="orange" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
                {events.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="py-2 border-b last:border-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                ))}
                {events.length === 0 && <p className="text-gray-500">No events yet</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <p className="text-gray-600">- Go to <strong>Events</strong> tab to manage events</p>
                    <p className="text-gray-600">- Go to <strong>Registrations</strong> to view event volunteers</p>
                    <p className="text-gray-600">- Go to <strong>Gallery</strong> tab to add photos</p>
                    <p className="text-gray-600">- Go to <strong>Members</strong> tab to update team</p>
                    <p className="text-gray-600">- Go to <strong>Settings</strong> to customize homepage</p>
                </div>
            </div>
        </div>
    </div>
);

const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => {
    const colors: Record<string, string> = {
        blue: 'border-blue-500 text-blue-600',
        green: 'border-green-500 text-green-600',
        purple: 'border-purple-500 text-purple-600',
        orange: 'border-orange-500 text-orange-600',
    };
    return (
        <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colors[color]}`}>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${colors[color].split(' ')[1]}`}>{count}</p>
        </div>
    );
};

// // Events Tab Component //////////////////////////////////////////////////////
const EventsTab = ({ events, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<EventData>({
        id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [masterIndex, setMasterIndex] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [existingImages, setExistingImages] = useState<EventImage[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                id: editingItem.id,
                title: editingItem.title,
                description: editingItem.description,
                date: editingItem.date?.split('T')[0] || '',
                location: editingItem.location,
                type: editingItem.type || 'upcoming',
                volunteersCount: editingItem.volunteersCount || 0
            });
            fetchEventImages(editingItem.id);
            setShowForm(true);
        }
    }, [editingItem]);

    const fetchEventImages = async (eventId: number) => {
        try {
            const response = await eventImagesAPI.getByEvent(eventId);
            setExistingImages(response.data);
        } catch (error) {
            console.error('Error fetching event images:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (masterIndex === index) {
            setMasterIndex(0);
        } else if (masterIndex > index) {
            setMasterIndex(masterIndex - 1);
        }
    };

    const removeExistingImage = async (imageId: number) => {
        if (confirm('Delete this image?')) {
            try {
                await eventImagesAPI.delete(imageId);
                setExistingImages(prev => prev.filter(img => img.id !== imageId));
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
    };

    const setExistingMaster = async (imageId: number) => {
        if (editingItem) {
            try {
                await eventImagesAPI.setMaster(editingItem.id, imageId);
                setExistingImages(prev => prev.map(img => ({ ...img, isMaster: img.id === imageId })));
            } catch (error) {
                console.error('Error setting master:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let eventId = editingItem?.id;

            if (editingItem) {
                await eventsAPI.update(editingItem.id, formData);
            } else {
                const response = await eventsAPI.create(formData);
                eventId = response.data.id;
            }

            if (selectedFiles.length > 0 && eventId) {
                const uploadedImages = await Promise.all(
                    selectedFiles.map(async (file, index) => {
                        const result = await uploadAPI.uploadFile(file);
                        return {
                            url: result.url,
                            isMaster: index === masterIndex && existingImages.every(img => !img.isMaster),
                            caption: ''
                        };
                    })
                );
                await eventImagesAPI.add(eventId, uploadedImages);
            }

            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await eventsAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0 });
        setSelectedFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setMasterIndex(0);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Events</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Event
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Event' : 'Add New Event'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Location" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="border rounded px-3 py-2" />
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'upcoming' | 'past' })} className="border rounded px-3 py-2">
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Count</label>
                                <input
                                    type="number"
                                    placeholder="Number of volunteers"
                                    min="0"
                                    value={formData.volunteersCount || ''}
                                    onChange={e => setFormData({ ...formData, volunteersCount: parseInt(e.target.value) || 0 })}
                                    className="border rounded px-3 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Images (Multiple)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="border rounded px-3 py-2 w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">First image will be the banner. Click star to set master.</p>
                            </div>
                        </div>

                        {existingImages.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                                <div className="flex flex-wrap gap-2">
                                    {existingImages.map((img) => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={uploadAPI.getFullUrl(img.url)}
                                                alt="Event"
                                                className={`h-24 w-24 object-cover rounded border-2 ${img.isMaster ? 'border-yellow-500' : 'border-gray-200'}`}
                                            />
                                            {img.isMaster && (
                                                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => setExistingMaster(img.id)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                                <button type="button" onClick={() => removeExistingImage(img.id)} className="bg-red-500 text-white p-1 rounded text-xs">✖</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {imagePreviews.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">New Images to Upload:</p>
                                <div className="flex flex-wrap gap-2">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className={`h-24 w-24 object-cover rounded border-2 ${masterIndex === index && existingImages.every(img => !img.isMaster) ? 'border-yellow-500' : 'border-gray-200'}`}
                                            />
                                            {masterIndex === index && existingImages.every(img => !img.isMaster) && (
                                                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => setMasterIndex(index)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                                <button type="button" onClick={() => removeSelectedFile(index)} className="bg-red-500 text-white p-1 rounded text-xs">✖</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="border rounded px-3 py-2 w-full" rows={3} />

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Volunteers</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: any) => (
                            <tr key={event.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3">{event.title}</td>
                                <td className="px-4 py-3">{new Date(event.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{event.location}</td>
                                <td className="px-4 py-3">{event.volunteersCount || 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${event.type === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {event.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setEditingItem(event)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No events found. Click "Add Event" to create one.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// // Registrations Tab Component ///////////////////////////////////////////////
const RegistrationsTab = ({ events }: { events: any[] }) => {
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEventId) {
            fetchRegistrations(Number(selectedEventId));
        } else {
            setRegistrations([]);
        }
    }, [selectedEventId]);

    const fetchRegistrations = async (eventId: number) => {
        setLoading(true);
        try {
            const response = await registrationsAPI.getByEventId(eventId);
            setRegistrations(response.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Registrations</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event to view registrations:</label>
                <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="w-full md:w-1/2 border rounded px-3 py-2"
                >
                    <option value="">-- Select an Event --</option>
                    {events.map((e: any) => (
                        <option key={e.id} value={e.id}>
                            {e.title} ({new Date(e.date).toLocaleDateString()}) - {e.type}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">
                            Total Registrations: {registrations.length}
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading registrations...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Visitor ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dept/Year</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Registered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(reg => (
                                        <tr key={reg.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-nss-blue">{reg.visitorPassId}</td>
                                            <td className="px-4 py-3 font-medium">{reg.name}</td>
                                            <td className="px-4 py-3">{reg.email}</td>
                                            <td className="px-4 py-3">{reg.phone}</td>
                                            <td className="px-4 py-3">{reg.department} ({reg.year})</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No registrations found for this event.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// // Gallery Tab Component /////////////////////////////////////////////////////
const GalleryTab = ({ gallery, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<GalleryData>({ title: '', url: '', type: 'image' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
    const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');

    useEffect(() => {
        if (editingItem) {
            setFormData({ title: editingItem.title, url: editingItem.url, type: editingItem.type });
            setFilePreview(uploadAPI.getFullUrl(editingItem.url));
            setUploadMediaType(editingItem.type);
            setShowForm(true);
        }
    }, [editingItem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let url = formData.url;

            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                url = uploadResult.url;
            }

            if (!url) {
                alert('Please select a file to upload');
                setUploading(false);
                return;
            }

            const galleryData = { ...formData, url, type: uploadMediaType };

            if (editingItem) {
                await galleryAPI.update(editingItem.id, galleryData);
            } else {
                await galleryAPI.create(galleryData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving gallery item:', error);
            alert('Error saving gallery item');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await galleryAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ title: '', url: '', type: 'image' });
        setSelectedFile(null);
        setFilePreview('');
    };

    const openUploadForm = (type: 'image' | 'video') => {
        resetForm();
        setUploadMediaType(type);
        setFormData({ ...formData, type });
        setShowForm(true);
    };

    const images = gallery.filter((item: any) => item.type !== 'video');
    const videos = gallery.filter((item: any) => item.type === 'video');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Gallery</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => openUploadForm('image')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
                    >
                        📷 Add Image
                    </button>
                    <button
                        onClick={() => openUploadForm('video')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"
                    >
                        🎥 Add Video
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-l-nss-blue">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {uploadMediaType === 'video' ? '🎥' : '📷'}
                        {editingItem ? `Edit ${uploadMediaType === 'video' ? 'Video' : 'Image'}` : `Add New ${uploadMediaType === 'video' ? 'Video' : 'Image'}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                            <input
                                type="text"
                                placeholder={`Enter ${uploadMediaType} title`}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload {uploadMediaType === 'video' ? 'Video' : 'Image'} *
                            </label>
                            <input
                                type="file"
                                accept={uploadMediaType === 'video' ? 'video/*' : 'image/*'}
                                onChange={handleFileChange}
                                className="border rounded px-3 py-2 w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {uploadMediaType === 'video'
                                    ? 'Supported: MP4, WebM, MOV (max 100MB). Videos will be shown on public Videos page.'
                                    : 'Supported: JPG, PNG, GIF, WebP (max 10MB)'
                                }
                            </p>
                        </div>

                        {filePreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                                {uploadMediaType === 'video' ? (
                                    <video src={filePreview} controls className="h-40 w-auto rounded border" />
                                ) : (
                                    <img src={filePreview} alt="Preview" className="h-40 w-auto object-cover rounded border" />
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveMediaTab('images')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'images'
                            ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📷 Images <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">{images.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveMediaTab('videos')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'videos'
                            ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🎥 Videos <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">{videos.length}</span>
                    </button>
                </div>
            </div>

            {activeMediaTab === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((item: any) => (
                        <div key={item.id} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img src={uploadAPI.getFullUrl(item.url)} alt={item.title || 'Gallery'} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
                            </div>
                            {item.title && <p className="text-sm text-gray-600 mt-1 truncate">{item.title}</p>}
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">📷</span>
                            No images uploaded yet. Click "Add Image" to get started.
                        </div>
                    )}
                </div>
            )}

            {activeMediaTab === 'videos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((item: any) => (
                        <div key={item.id} className="relative group bg-black rounded-lg overflow-hidden">
                            <video
                                src={uploadAPI.getFullUrl(item.url)}
                                className="w-full aspect-video object-cover"
                                controls
                            />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
                            </div>
                            {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                                    <p className="text-white font-medium truncate">{item.title}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {videos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">🎥</span>
                            No videos uploaded yet. Click "Add Video" to get started.
                            <p className="text-sm mt-1">Uploaded videos will appear on the public Videos page.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// // Members Tab Component /////////////////////////////////////////////////////
const MembersTab = ({ members, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<MemberData>({ name: '', role: '', photoUrl: '', year: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    useEffect(() => {
        if (editingItem) {
            setFormData({ name: editingItem.name, role: editingItem.role, photoUrl: editingItem.photoUrl || '', year: editingItem.year || '' });
            setPhotoPreview(editingItem.photoUrl ? uploadAPI.getFullUrl(editingItem.photoUrl) : '');
            setShowForm(true);
        }
    }, [editingItem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let photoUrl = formData.photoUrl;

            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                photoUrl = uploadResult.url;
            }

            const memberData = { ...formData, photoUrl };

            if (editingItem) {
                await membersAPI.update(editingItem.id, memberData);
            } else {
                await membersAPI.create(memberData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving member:', error);
            alert('Error saving member');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this member?')) {
            await membersAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', role: '', photoUrl: '', year: '' });
        setSelectedFile(null);
        setPhotoPreview('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Team Members</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Member
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Member' : 'Add New Member'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Role (e.g., Program Officer)" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Year (e.g., 2024-25)" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="border rounded px-3 py-2" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="border rounded px-3 py-2 w-full"
                                />
                            </div>
                        </div>

                        {photoPreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Photo Preview:</p>
                                <img src={photoPreview} alt="Preview" className="h-24 w-24 object-cover rounded-full border" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {members.map((member: any) => (
                    <div key={member.id} className="bg-white p-6 rounded-lg shadow text-center relative group">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                            {member.photoUrl ? (
                                <img src={uploadAPI.getFullUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">🎥</div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-nss-blue font-medium">{member.role}</p>
                        {member.year && <p className="text-gray-500 text-sm">{member.year}</p>}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                            <button onClick={() => setEditingItem(member)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                            <button onClick={() => handleDelete(member.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No team members. Click "Add Member" to get started.
                    </div>
                )}
            </div>
        </div>
    );
};


// Settings Tab Component
const SettingsTab = ({ settings, onRefresh }: { settings: SiteSettings | null, onRefresh: () => void }) => {
    const [formData, setFormData] = useState<SiteSettings>({
        heroTitle: '',
        heroSubtitle: '',
        heroCta: '',
        statEventsCount: '',
        statEventsLabel: '',
        statVolunteersCount: '',
        statVolunteersLabel: '',
        statImpactCount: '',
        statImpactLabel: '',
        aboutMission: '',
        aboutHistory: '',
        homeSliderImages: '[]',
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: '',
    });
    const [saving, setSaving] = useState(false);

    // State for managing home slider images
    const [sliderImages, setSliderImages] = useState<{ url: string, description: string }[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                ...settings,
                homeSliderImages: settings.homeSliderImages || '[]'
            });
            try {
                if (settings.homeSliderImages) {
                    setSliderImages(JSON.parse(settings.homeSliderImages));
                }
            } catch (e) {
                console.error('Failed to parse homeSliderImages', e);
            }
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                homeSliderImages: JSON.stringify(sliderImages)
            };
            await settingsAPI.update(dataToSave);
            alert('Settings saved successfully!');
            onRefresh();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
        setSaving(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" value={formData.heroTitle} onChange={e => setFormData({ ...formData, heroTitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="NOT ME, BUT YOU" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input type="text" value={formData.heroSubtitle} onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="National Service Scheme - JSPM RSCOE" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                            <input type="text" value={formData.heroCta} onChange={e => setFormData({ ...formData, heroCta: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Join Us / Register" />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Statistics Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 1 - Events</label>
                            <input type="text" value={formData.statEventsCount} onChange={e => setFormData({ ...formData, statEventsCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="50+" />
                            <input type="text" value={formData.statEventsLabel} onChange={e => setFormData({ ...formData, statEventsLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Events Conducted" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 2 - Volunteers</label>
                            <input type="text" value={formData.statVolunteersCount} onChange={e => setFormData({ ...formData, statVolunteersCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="200+" />
                            <input type="text" value={formData.statVolunteersLabel} onChange={e => setFormData({ ...formData, statVolunteersLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Volunteers" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 3 - Impact</label>
                            <input type="text" value={formData.statImpactCount} onChange={e => setFormData({ ...formData, statImpactCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="1000+" />
                            <input type="text" value={formData.statImpactLabel} onChange={e => setFormData({ ...formData, statImpactLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Lives Impacted" />
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">About Content</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                            <textarea value={formData.aboutMission} onChange={e => setFormData({ ...formData, aboutMission: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="NSS aims to provide hands on experience..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our History</label>
                            <textarea value={formData.aboutHistory} onChange={e => setFormData({ ...formData, aboutHistory: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Established in..." />
                        </div>
                    </div>
                </div>

                {/* Social Links Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                            <input type="url" value={formData.socialInstagram || ''} onChange={e => setFormData({ ...formData, socialInstagram: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://instagram.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                            <input type="url" value={formData.socialFacebook || ''} onChange={e => setFormData({ ...formData, socialFacebook: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://facebook.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                            <input type="url" value={formData.socialTwitter || ''} onChange={e => setFormData({ ...formData, socialTwitter: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://twitter.com/nss_jspm_rscoe" />
                        </div>
                    </div>
                </div>

                {/* Home Slider Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-nss-blue">Home Slider Images</h3>
                        <span className="text-sm text-gray-500">{sliderImages.length} / 6 Images</span>
                    </div>

                    <div className="space-y-4">
                        {sliderImages.map((img, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded bg-gray-50">
                                <div className="w-full md:w-1/3">
                                    <img src={uploadAPI.getFullUrl(img.url)} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Brief Description</label>
                                    <textarea
                                        value={img.description}
                                        onChange={e => {
                                            const newImages = [...sliderImages];
                                            newImages[index].description = e.target.value;
                                            setSliderImages(newImages);
                                        }}
                                        className="w-full border rounded px-3 py-2"
                                        rows={3}
                                        placeholder="Enter brief description for this slide..."
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newImages = sliderImages.filter((_, i) => i !== index);
                                                setSliderImages(newImages);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sliderImages.length < 6 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <label className="cursor-pointer">
                                    <span className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition inline-block">
                                        {uploadingImage ? 'Uploading...' : '+ Add Slider Image'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingImage}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingImage(true);
                                                try {
                                                    const result = await uploadAPI.uploadFile(file);
                                                    setSliderImages([...sliderImages, { url: result.url, description: '' }]);
                                                } catch (err) {
                                                    console.error('Error uploading slider image', err);
                                                    alert('Error uploading image');
                                                }
                                                setUploadingImage(false);
                                                e.target.value = ''; // Reset input
                                            }
                                        }}
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Recommended size: 1920x1080px. You can add {6 - sliderImages.length} more images.</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-nss-blue text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </form>
        </div>
    );
};

export default AdminDashboard;
