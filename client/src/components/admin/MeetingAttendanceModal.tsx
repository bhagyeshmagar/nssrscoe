import { useState, useEffect } from 'react';
import type { MeetingAttendanceWithVolunteer, MeetingAttendanceStats } from '../../services/api';
import { meetingsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { decodeToken } from '../../services/api';
import toast from 'react-hot-toast';
import { X, Search } from 'lucide-react';

interface MeetingAttendanceModalProps {
    meetingId: number;
    meetingStatus: string;
    meetingType?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const MeetingAttendanceModal = ({ meetingId, meetingStatus, meetingType, isOpen, onClose }: MeetingAttendanceModalProps) => {
    const [attendanceList, setAttendanceList] = useState<MeetingAttendanceWithVolunteer[]>([]);
    const [stats, setStats] = useState<MeetingAttendanceStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [markingId, setMarkingId] = useState<number | null>(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState(''); // 'regular' | 'backup'
    const [sortBy, setSortBy] = useState<'name' | 'department'>('department');

    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;

    const canEdit = meetingStatus === 'active' || (meetingStatus === 'ended' && isSuperadmin);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await meetingsAPI.getAttendance(meetingId);
            const data = res.data.data;
            setAttendanceList(data.attendance || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
            toast.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && meetingId) {
            fetchAttendance();
        }
    }, [isOpen, meetingId]);

    const handleMark = async (volunteerId: number, status: 'present' | 'absent' | 'late') => {
        if (!canEdit) {
            toast.error('You do not have permission to edit this meeting.');
            return;
        }
        
        setMarkingId(volunteerId);
        try {
            await meetingsAPI.markAttendance(meetingId, volunteerId, { status });
            toast.success('Attendance marked');
            fetchAttendance(); // refresh to get new stats and state
        } catch (error) {
            console.error('Failed to mark attendance', error);
            toast.error('Failed to mark attendance');
        } finally {
            setMarkingId(null);
        }
    };

    const filteredList = attendanceList.filter(item => {
        const matchSearch = item.volunteer.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = deptFilter ? item.volunteer.department === deptFilter : true;
        const matchType = typeFilter ? item.volunteer.status === typeFilter : true;
        return matchSearch && matchDept && matchType;
    });

    const sortedList = [...filteredList].sort((a, b) => {
        if (sortBy === 'name') {
            return a.volunteer.name.localeCompare(b.volunteer.name);
        }
        return a.volunteer.department.localeCompare(b.volunteer.department) || a.volunteer.name.localeCompare(b.volunteer.name);
    });

    const departments = Array.from(new Set(attendanceList.map(item => item.volunteer.department)));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-nss-blue">Meeting Attendance</h2>
                            {meetingType && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    meetingType === 'regular' ? 'bg-blue-100 text-blue-700' :
                                    meetingType === 'core_team' ? 'bg-purple-100 text-purple-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {meetingType === 'regular' ? 'Regular' : meetingType === 'core_team' ? 'Core Team' : 'Special Camp'}
                                </span>
                            )}
                        </div>
                        {!canEdit && (
                            <p className="text-sm text-red-500 mt-1">
                                Read-only: Meeting is not active.
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 bg-white border-b grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 font-semibold text-lg">{stats?.totalPresent || 0}</div>
                        <div className="text-gray-600">Total Present</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-semibold text-lg">{stats?.regularPresent || 0}</div>
                        <div className="text-gray-600">Regular Present</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-yellow-600 font-semibold text-lg">{stats?.backupPresent || 0}</div>
                        <div className="text-gray-600">Backup Present</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-red-600 font-semibold text-lg">{stats?.totalAbsent || 0}</div>
                        <div className="text-gray-600">Total Absent</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-orange-600 font-semibold text-lg">{stats?.totalLate || 0}</div>
                        <div className="text-gray-600">Total Late</div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex flex-wrap gap-4 border-b">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search volunteer..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-nss-blue"
                        />
                    </div>
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >
                        <option value="">All Types</option>
                        <option value="regular">Regular</option>
                        <option value="backup">Backup</option>
                    </select>
                    <select 
                        value={sortBy} 
                        onChange={e => setSortBy(e.target.value as 'name' | 'department')}
                        className="border rounded-lg px-4 py-2 bg-white"
                    >
                        <option value="department">Sort by: Department</option>
                        <option value="name">Sort by: Name</option>
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-600">PRN No.</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Volunteer</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Type</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {sortedList.map(({ volunteer, attendance }) => (
                                    <tr key={volunteer.id} className="hover:bg-gray-50 transition">
                                        <td className="p-3 text-gray-500">{volunteer.prnNo || 'N/A'}</td>
                                        <td className="p-3 font-medium text-gray-800">{volunteer.name}</td>
                                        <td className="p-3 text-gray-600">{volunteer.department}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${volunteer.status === 'regular' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {volunteer.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {attendance ? (
                                                <span className={`px-2 py-1 rounded text-xs ${attendance.status === 'present' ? 'bg-green-100 text-green-700' : attendance.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                    {attendance.status}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Not marked</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={!canEdit || markingId === volunteer.id}
                                                    onClick={() => handleMark(volunteer.id, 'present')}
                                                    className={`px-3 py-1 text-xs rounded transition ${attendance?.status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100 text-gray-600'} ${(!canEdit || markingId === volunteer.id) && 'opacity-50 cursor-not-allowed'}`}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    disabled={!canEdit || markingId === volunteer.id}
                                                    onClick={() => handleMark(volunteer.id, 'absent')}
                                                    className={`px-3 py-1 text-xs rounded transition ${attendance?.status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100 text-gray-600'} ${(!canEdit || markingId === volunteer.id) && 'opacity-50 cursor-not-allowed'}`}
                                                >
                                                    A
                                                </button>
                                                <button
                                                    disabled={!canEdit || markingId === volunteer.id}
                                                    onClick={() => handleMark(volunteer.id, 'late')}
                                                    className={`px-3 py-1 text-xs rounded transition ${attendance?.status === 'late' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-orange-100 text-gray-600'} ${(!canEdit || markingId === volunteer.id) && 'opacity-50 cursor-not-allowed'}`}
                                                >
                                                    L
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            No volunteers found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
