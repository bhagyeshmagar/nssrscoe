import { useState, useEffect, useCallback } from 'react';
import { volunteersAPI, academicYearsAPI, attendanceAPI } from '../../../services/api';
import type { AcademicYear, AYStats, VolunteerWithProfile, CreateVolunteerData, Department, VolunteerAttendanceRecord } from '../../../services/api';
import { useFlash, useAYSelector } from '../Shared';
import { ExportDataModal } from '../../common/ExportDataModal';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { VolunteerStats } from './VolunteerStats';
import { VolunteerForm } from './VolunteerForm';
import { VolunteerFilters } from './VolunteerFilters';
import { VolunteerTable } from './VolunteerTable';
import { VolunteerProfileModal } from './VolunteerProfileModal';
export const AYVolunteersTab = ({ years, currentAY, isSuperadmin }: { years: AcademicYear[]; currentAY: AcademicYear | null; isSuperadmin?: boolean }) => {
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, currentAY);
    const [vols, setVols] = useState<VolunteerWithProfile[]>([]);
    const [stats, setStats] = useState<AYStats | null>(null);
    const [filter, setFilter] = useState({ dept: '', status: '' as '' | 'regular' | 'backup', search: '', sortBy: 'name' as 'name' | 'department' });
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [viewProfileId, setViewProfileId] = useState<number | null>(null);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
    const [exportData, setExportData] = useState<VolunteerWithProfile[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    
    const generatePassword = () => Math.random().toString(36).slice(-8);
    const [form, setForm] = useState<CreateVolunteerData>({ name: '', email: '', password: generatePassword(), department: 'Computer Engineering' as Department });
    const { msg, flash } = useFlash();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);
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
        } catch (e: any) {
            console.error(e);
            flash('err', e.response?.data?.message || 'Failed to load volunteers.');
        }
    }, [selectedAyId, filter, page, flash]);

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
    


    const handleCreate = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try { 
            await volunteersAPI.create(selectedAyId!, form); 
            setShowForm(false); 
            setForm({ name: '', email: '', password: generatePassword(), department: 'Computer Engineering' as Department }); 
            flash('ok', 'Volunteer added.'); 
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        setActionId(deleteConfirmId);
        try { 
            await volunteersAPI.delete(selectedAyId!, deleteConfirmId); 
            flash('ok', 'Volunteer marked as inactive (soft deleted).'); 
            setDeleteConfirmId(null);
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setActionId(null);
        }
    };

    const handleStatusChange = async (id: number, s: 'regular' | 'backup') => {
        if (!window.confirm(`Are you sure about making this volunteer ${s}?`)) return;
        setActionId(id);
        try { 
            await volunteersAPI.changeStatus(selectedAyId!, id, s); 
            toast.success(`Volunteer status updated to ${s}`);
            load(); 
        } catch (e: any) { 
            flash('err', e.response?.data?.message ?? 'Error.'); 
        } finally {
            setActionId(null);
        }
    };

    const handleApproveExperience = async (id: number) => {
        setActionId(id);
        try {
            await volunteersAPI.approveExperience(selectedAyId!, id);
            toast.success('Experience text approved and is now public.');
            load();
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Failed to approve experience.');
        } finally {
            setActionId(null);
        }
    };

    const handleExportClick = async () => {
        if (!selectedAyId) return;
        setExportStatus('loading');
        try {
            let allVols: VolunteerWithProfile[] = [];
            let currentExportPage = 1;
            let exportTotalPages = 1;

            const fetchPage = (p: number) => volunteersAPI.getByAY(selectedAyId, { 
                ...(filter.dept && { department: filter.dept }), 
                ...(filter.status && { status: filter.status }), 
                ...(filter.search && { search: filter.search }),
                ...(filter.sortBy === 'department' && { sortBy: 'department' }),
                page: p,
                limit: 1000
            });

            const firstRes = await fetchPage(currentExportPage);
            if (firstRes.data) {
                allVols = allVols.concat(firstRes.data.data?.data || []);
                exportTotalPages = firstRes.data.meta?.totalPages || 1;
            }

            if (exportTotalPages > 10 && !window.confirm(`This will export ${exportTotalPages} pages of data. Are you sure?`)) {
                setExportStatus('idle');
                return;
            }

            const MAX_PAGES = 100;
            while (currentExportPage < exportTotalPages && currentExportPage < MAX_PAGES) {
                currentExportPage++;
                const res = await fetchPage(currentExportPage);
                if (res.data) {
                    allVols = allVols.concat(res.data.data?.data || []);
                }
            }

            if (exportTotalPages > MAX_PAGES) {
                flash('err', `Export truncated to first ${MAX_PAGES * 1000} records.`);
            }

            setExportData(allVols);
            setExportStatus('ready');
        } catch (e: any) {
            console.error(e);
            flash('err', 'Failed to prepare export data.');
            setExportStatus('idle');
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
                    <button onClick={handleExportClick} disabled={exportStatus === 'loading'} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center disabled:opacity-50">
                        <Download className="w-4 h-4 mr-1" /> {exportStatus === 'loading' ? 'Preparing...' : 'Export'}
                    </button>
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => setShowForm(!showForm)} disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">+ Add</button>}
                </div>
            </div>

            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] AY {selectedAY.label} is locked - read-only.</div>}

            <VolunteerStats stats={stats} selectedAY={selectedAY} />

            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}

            {showForm && (
                <VolunteerForm 
                    form={form} 
                    setForm={setForm} 
                    isSubmitting={isSubmitting} 
                    handleCreate={handleCreate} 
                    setShowForm={setShowForm} 
                />
            )}

            <VolunteerFilters 
                searchInput={searchInput} 
                setSearchInput={setSearchInput} 
                filter={filter} 
                setFilter={setFilter} 
                setPage={setPage} 
            />

            <VolunteerTable 
                vols={vols} 
                actionId={actionId} 
                setViewProfileId={setViewProfileId} 
                handleStatusChange={handleStatusChange} 
                handleDelete={confirmDelete} 
                selectedAY={selectedAY} 
                page={page} 
                setPage={setPage} 
                totalPages={totalPages} 
                isSuperadmin={isSuperadmin}
            />

            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this volunteer? This action will mark them as inactive. 
                            As a superadmin, you can still view their attendance records but they will not be considered active.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button onClick={executeDelete} disabled={actionId === deleteConfirmId} className="px-4 py-2 font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {actionId === deleteConfirmId ? 'Deleting...' : 'Delete Volunteer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                isSuperadmin={isSuperadmin}
                                onApproveExperience={handleApproveExperience}
                                isApproving={actionId === viewProfileId}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ExportDataModal 
                isOpen={exportStatus === 'ready'}
                onClose={() => setExportStatus('idle')}
                data={exportData.map(v => ({
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
                    ...(isSuperadmin ? [
                        { key: 'religion', label: 'Religion' },
                        { key: 'caste', label: 'Caste' },
                        { key: 'casteCategory', label: 'Caste Category' }
                    ] : []),
                    { key: 'phoneNo', label: 'Phone Number' }
                ]}
                filename={`Volunteers_Export_AY_${selectedAY?.label || 'All'}`}
            />
        </div>
    );
};
