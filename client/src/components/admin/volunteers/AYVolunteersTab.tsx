import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { volunteersAPI, attendanceAPI } from '../../../services/api';
import type { VolunteerWithProfile, VolunteerAttendanceRecord, CreateVolunteerData } from '../../../services/api';
import { useFlash, useAYSelector } from '../Shared';
import { ExportDataModal } from '../../common/ExportDataModal';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { VolunteerStats } from './VolunteerStats';
import { VolunteerForm } from './VolunteerForm';
import { VolunteerFilters } from './VolunteerFilters';
import { VolunteerTable } from './VolunteerTable';
import { VolunteerProfileModal } from './VolunteerProfileModal';

import { useAcademicYears, useAcademicYearStats } from '../../../hooks/useAcademicYears';
import { 
    useVolunteersByAY, 
    useCreateVolunteer, 
    useDeleteVolunteer, 
    useChangeVolunteerStatus,
    useToggleVolunteerActive,
    volunteerKeys
} from '../../../hooks/useVolunteers';

export const AYVolunteersTab = ({ isSuperadmin }: { isSuperadmin?: boolean }) => {
    const queryClient = useQueryClient();
    const { data: years = [] } = useAcademicYears();
    // We don't have currentAY directly without another query, but useAYSelector will just pick the first year if no currentAY is provided, or we can use useCurrentAcademicYear.
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, null);
    
    const [filter, setFilter] = useState({ dept: '', status: '' as '' | 'regular' | 'backup', search: '', sortBy: 'name' as 'name' | 'department' });
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [viewProfileId, setViewProfileId] = useState<number | null>(null);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
    const [exportData, setExportData] = useState<VolunteerWithProfile[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const generatePassword = () => Math.random().toString(36).slice(-8);
    const { msg, flash } = useFlash();
    const [actionId, setActionId] = useState<number | null>(null);
    const [attendance, setAttendance] = useState<VolunteerAttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    // Queries
    const { data: stats } = useAcademicYearStats(selectedAyId);
    const { data: volunteersData } = useVolunteersByAY(selectedAyId, { 
        ...(filter.dept && { department: filter.dept }), 
        ...(filter.status && { status: filter.status }), 
        ...(filter.search && { search: filter.search }),
        ...(filter.sortBy === 'department' && { sortBy: 'department' }),
        page,
        limit: 20
    });

    const vols = volunteersData?.data || [];
    const totalPages = volunteersData?.meta?.totalPages || 1;

    // Mutations
    const createVolunteer = useCreateVolunteer(selectedAyId);
    const deleteVolunteer = useDeleteVolunteer(selectedAyId);
    const changeVolunteerStatus = useChangeVolunteerStatus(selectedAyId);
    const toggleVolunteerActive = useToggleVolunteerActive(selectedAyId);

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

    const handleCreate = async (data: CreateVolunteerData) => {
        try { 
            await createVolunteer.mutateAsync(data); 
            setShowForm(false); 
        } catch (e: any) { 
            // Error handled by mutation
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId || !deletePassword) {
            toast.error('Superadmin password is required for hard delete.');
            return;
        }
        setActionId(deleteConfirmId);
        try { 
            await deleteVolunteer.mutateAsync({ id: deleteConfirmId, password: deletePassword }); 
            setDeleteConfirmId(null);
            setDeletePassword('');
        } catch (e: any) { 
            // Error handled by mutation
        } finally {
            setActionId(null);
        }
    };

    const handleStatusChange = async (id: number, s: 'regular' | 'backup') => {
        if (!window.confirm(`Are you sure about making this volunteer ${s}?`)) return;
        setActionId(id);
        try { 
            await changeVolunteerStatus.mutateAsync({ id, status: s }); 
        } catch (e: any) { 
            // Error handled by mutation
        } finally {
            setActionId(null);
        }
    };

    const handleApproveExperience = async (id: number) => {
        setActionId(id);
        try {
            await volunteersAPI.approveExperience(selectedAyId!, id);
            toast.success('Experience text approved and is now public.');
            queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
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
                allVols = allVols.concat(firstRes.data.data?.data ?? []);
                exportTotalPages = firstRes.data.data?.meta?.totalPages ?? 1;
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
                    allVols = allVols.concat(res.data.data?.data ?? []);
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
                    {selectedAY && !selectedAY.isLocked && <button onClick={() => setShowForm(!showForm)} disabled={createVolunteer.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">+ Add</button>}
                </div>
            </div>

            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] AY {selectedAY.label} is locked - read-only.</div>}

            <VolunteerStats stats={stats || null} selectedAY={selectedAY} />

            {msg && <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}

            {showForm && (
                <VolunteerForm
                    isSubmitting={createVolunteer.isPending}
                    defaultValues={{ password: generatePassword() }}
                    onSubmit={handleCreate}
                    onCancel={() => setShowForm(false)}
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
                handleToggleActive={async (id: number) => {
                    setActionId(id);
                    try {
                        await toggleVolunteerActive.mutateAsync(id);
                    } catch (e: any) { 
                        console.error('Failed to toggle active state', e);
                    } finally { 
                        setActionId(null); 
                    }
                }}
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
                        <h3 className="text-xl font-bold text-red-600 mb-4">Hard Delete Volunteer</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            This action will <strong className="text-gray-800">permanently delete</strong> the volunteer from the database, including all their profile data and associated records. This cannot be undone.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Superadmin Password</label>
                            <input 
                                type="password" 
                                value={deletePassword} 
                                onChange={e => setDeletePassword(e.target.value)}
                                placeholder="Enter your superadmin password"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setDeleteConfirmId(null); setDeletePassword(''); }} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button onClick={executeDelete} disabled={actionId === deleteConfirmId || !deletePassword} className="px-4 py-2 font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {actionId === deleteConfirmId ? 'Deleting...' : 'Hard Delete'}
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
                                vol={vols.find((v: any) => v.id === viewProfileId)} 
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
