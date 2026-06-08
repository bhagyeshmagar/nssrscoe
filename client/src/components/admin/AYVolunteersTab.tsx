import { useState, useEffect, useCallback } from 'react';
import { volunteersAPI, academicYearsAPI, uploadAPI, attendanceAPI } from '../../services/api';
import type { AcademicYear, AYStats, VolunteerWithProfile, CreateVolunteerData, Department, VolunteerAttendanceRecord } from '../../services/api';
import { CapBar, useFlash, useAYSelector, DEPT_LIST } from './Shared';
import { ExportDataModal } from '../common/ExportDataModal';
import { Download } from 'lucide-react';

export const AYVolunteersTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, currentAY);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [stats, setStats] = useState<AYStats | null>(null);
    const [filter, setFilter] = useState({ dept: '', status: '' as '' | 'regular' | 'backup', search: '', sortBy: 'name' as 'name' | 'department' });
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [viewProfileId, setViewProfileId] = useState<number | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [form, setForm] = useState<CreateVolunteerData>({ name: '', email: '', password: '12345678', department: 'Computer Engineering' as Department });
    const { msg, flash } = useFlash();
    const [attendance, setAttendance] = useState<VolunteerAttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [vRes, sRes] = await Promise.all([
                volunteersAPI.getByAY(selectedAyId, { 
                    ...(filter.dept && { department: filter.dept }), 
                    ...(filter.status && { status: filter.status }), 
                    ...(filter.search && { search: filter.search }),
                    ...(filter.sortBy === 'department' && { sortBy: 'department' }),
                    page,
                    limit: 20
                }),
                academicYearsAPI.getStats(selectedAyId),
            ]);
            setVols(vRes.data.data?.data || []);
            setTotalPages(vRes.data.meta?.totalPages || 1);
            setStats(sRes.data.data);
        } catch (e) { console.error(e); }
    }, [selectedAyId, filter, page]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            setFilter(f => f.search !== searchInput ? { ...f, search: searchInput } : f);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);
    
    useEffect(() => {
        if (viewProfileId && selectedAyId) {
            setLoadingAttendance(true);
            attendanceAPI.getVolunteer(selectedAyId, viewProfileId)
                .then(res => {
                    const data = res.data.data;
                    setAttendance(data || []);
                })
                .catch(() => {
                    setAttendance([]);
                })
                .finally(() => {
                    setLoadingAttendance(false);
                });
        } else {
            setAttendance([]);
        }
    }, [viewProfileId, selectedAyId]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const handleCreate = async () => {
        try { 
            await volunteersAPI.create(selectedAyId, form); 
            setShowForm(false); 
            setForm({ name: '', email: '', password: '12345678', department: 'Computer Engineering' as Department }); 
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
            await volunteersAPI.changeStatus(selectedAyId!, id, s); 
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
                    <select value={selectedAyId || ''} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
                    <button onClick={() => setShowExportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center">
                        <Download className="w-4 h-4 mr-1" /> Export
                    </button>
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
                <input type="text" placeholder="Search..." value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={filter.dept} onChange={e => { setFilter(f => ({ ...f, dept: e.target.value })); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Departments</option>
                    {DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value as any })); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Statuses</option>
                    <option value="regular">Regular</option>
                    <option value="backup">Backup</option>
                </select>
                <select value={filter.sortBy} onChange={e => { setFilter(f => ({ ...f, sortBy: e.target.value as any })); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="name">Sort by Name</option>
                    <option value="department">Sort by Department</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Name', 'Email', 'Department', 'Status', 'Attended', 'Active', 'Actions'].map(h => (
                                <th key={h} className={`px-4 py-3 text-gray-600 font-medium ${h === 'Attended' ? 'text-center' : 'text-left'}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {vols.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No volunteers found.</td></tr>}
                        {vols.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                                <td className="px-4 py-3 text-gray-600">{v.email}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{v.department}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'regular' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{v.status}</span></td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-700">{v.eventsAttendedCount ?? 0}</td>
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

            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50">Previous</button>
                    <span className="text-gray-600 text-sm font-medium">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50">Next</button>
                </div>
            )}

            {/* Profile Modal */}
            {viewProfileId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Volunteer Profile</h3>
                            <button onClick={() => setViewProfileId(null)} className="text-gray-400 hover:text-gray-600">✖</button>
                        </div>
                        <div className="p-6">
                            <VolunteerProfileModal 
                                vol={vols.find(v => v.id === viewProfileId)} 
                                attendance={attendance} 
                                loadingAttendance={loadingAttendance} 
                            />
                        </div>
                    </div>
                </div>
            )}

            <ExportDataModal 
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={vols.map(v => ({
                    id: v.id,
                    name: v.name,
                    email: v.email,
                    department: v.department,
                    status: v.status,
                    isActive: v.isActive,
                    eventsAttendedCount: v.eventsAttendedCount,
                    fullName: v.profile?.fullName,
                    prnNo: v.profile?.prnNo,
                    collegeYearAtEnrollment: v.profile?.collegeYearAtEnrollment,
                    nssYear: v.profile?.nssYear,
                    cgpa: v.profile?.cgpa,
                    eligibilityNo: v.profile?.eligibilityNo,
                    religion: v.profile?.religion,
                    caste: v.profile?.caste,
                    casteCategory: v.profile?.casteCategory,
                    phoneNo: v.profile?.phoneNo,
                }))}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'department', label: 'Department' },
                    { key: 'status', label: 'Status (Regular/Backup)' },
                    { key: 'isActive', label: 'Is Active' },
                    { key: 'eventsAttendedCount', label: 'Events Attended' },
                    { key: 'fullName', label: 'Full Name (Profile)' },
                    { key: 'prnNo', label: 'PRN No' },
                    { key: 'collegeYearAtEnrollment', label: 'College Year' },
                    { key: 'nssYear', label: 'NSS Year' },
                    { key: 'cgpa', label: 'CGPA' },
                    { key: 'eligibilityNo', label: 'Eligibility No' },
                    { key: 'religion', label: 'Religion' },
                    { key: 'caste', label: 'Caste' },
                    { key: 'casteCategory', label: 'Caste Category' },
                    { key: 'phoneNo', label: 'Phone Number' }
                ]}
                filename={`Volunteers_Export_AY_${selectedAY?.label || 'All'}`}
            />
        </div>
    );
};

const VolunteerProfileModal = ({ vol, attendance, loadingAttendance }: { vol: any, attendance: any[], loadingAttendance: boolean }) => {
    if (!vol) return <p>Loading...</p>;
    const p = vol.profile || {};
    const presentAttendance = attendance.filter(a => a.status === 'present');
    
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
                    <span className="inline-block mt-1 bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 border font-medium">
                        {vol.department}
                    </span>
                </div>
            </div>

            <div>
                <h5 className="font-bold text-gray-800 mb-3 border-b pb-1">Academic Details</h5>
                {renderField('Full Name', p.fullName)}
                {renderField('PRN Number', p.prnNo)}
                {renderField('College Year', p.collegeYearAtEnrollment)}
                {renderField('NSS Year', p.nssYear)}
            </div>
            <div>
                <h5 className="font-bold text-gray-800 mb-3 border-b pb-1">Personal Details</h5>
                {renderField('Phone Number', p.phoneNo)}
                {renderField('Email ID', p.emailId)}
                {renderField('Caste Category', p.casteCategory)}
                {renderField('Religion / Caste', `${p.religion || '-'} / ${p.caste || '-'}`)}
            </div>
            {p.experienceText && (
                <div className="col-span-full mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">Volunteer Experience</h5>
                    <p className="text-sm text-gray-700 italic">"{p.experienceText}"</p>
                </div>
            )}
            {p.marksheetUrl && (
                <div className="col-span-full">
                    <a href={uploadAPI.getFullUrl(p.marksheetUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                        📄 View Marksheet Document
                    </a>
                </div>
            )}

            {/* Attended Events Section */}
            <div className="col-span-full mt-6 border-t pt-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📅</span> Attended Events ({presentAttendance.length})
                </h5>
                {loadingAttendance ? (
                    <div className="text-sm text-gray-500 py-2">Loading attendance records...</div>
                ) : presentAttendance.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {presentAttendance.map((att: any, idx: number) => (
                            <div key={idx} className="bg-green-50/50 border border-green-100 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">{att.sessionTitle}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{new Date(att.date).toLocaleDateString()}</div>
                                </div>
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">Present</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 py-4 bg-gray-50 rounded-lg text-center border border-dashed">
                        No events attended yet for this academic year.
                    </div>
                )}
            </div>
        </div>
    );
};

