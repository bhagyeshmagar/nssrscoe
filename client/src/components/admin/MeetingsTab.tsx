import { useState, useEffect } from 'react';
import type { AcademicYear, Meeting, SpecialCamp } from '../../services/api';
import { meetingsAPI, specialCampsAPI, decodeToken } from '../../services/api';
import { useAYSelector } from './Shared';
import { ExportDataModal } from '../common/ExportDataModal';
import { MeetingAttendanceModal } from './MeetingAttendanceModal';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const MeetingsTab = ({ years, currentAY }: { years: AcademicYear[], currentAY: AcademicYear | null }) => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;
    const { selectedAyId, setSelectedAyId } = useAYSelector(years, currentAY);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [selectedMeetingForAttendance, setSelectedMeetingForAttendance] = useState<{ id: number, status: string, meetingType: string } | null>(null);
    const [exportingId, setExportingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);

    // Special camps for the current AY (used in camp picker)
    const [specialCamps, setSpecialCamps] = useState<SpecialCamp[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meetingType: 'regular' as 'regular' | 'core_team' | 'special_camp',
        scheduledDate: '',
        location: '',
        sendEmail: false,
        specialCampId: undefined as number | undefined,
    });

    const loadMeetings = async () => {
        if (!selectedAyId) return;
        setLoading(true);
        try {
            const res = await meetingsAPI.getByAY(selectedAyId);
            setMeetings(res.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load meetings');
        }
        setLoading(false);
    };

    const loadSpecialCamps = async () => {
        if (!selectedAyId) return;
        try {
            const res = await specialCampsAPI.getByAY(selectedAyId);
            setSpecialCamps(res.data.data || []);
        } catch (err) {
            console.error('Failed to load special camps', err);
            toast.error('Failed to load special camps');
        }
    };

    useEffect(() => {
        loadMeetings();
        loadSpecialCamps();
    }, [selectedAyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.meetingType === 'special_camp' && !formData.specialCampId) {
            toast.error('Please select a Special Camp for this meeting.');
            return;
        }
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                specialCampId: formData.meetingType === 'special_camp' ? formData.specialCampId : undefined,
            };
            if (editingMeeting) {
                await meetingsAPI.update(editingMeeting.id, payload);
            } else {
                await meetingsAPI.create(selectedAyId, payload);
            }
            setShowForm(false);
            setEditingMeeting(null);
            loadMeetings();
            toast.success(editingMeeting ? 'Meeting updated' : 'Meeting created');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (meeting: Meeting) => {
        setFormData({
            title: meeting.title,
            description: meeting.description || '',
            meetingType: meeting.meetingType,
            scheduledDate: new Date(meeting.scheduledDate).toISOString().slice(0, 16),
            location: meeting.location,
            sendEmail: false,
            specialCampId: meeting.specialCampId ?? undefined,
        });
        setEditingMeeting(meeting);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;
        try {
            setActionId(id);
            await meetingsAPI.delete(id);
            toast.success('Meeting deleted');
            loadMeetings();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete meeting');
        } finally {
            setActionId(null);
        }
    };

    const handleAction = async (id: number, action: 'start' | 'end' | 'reopen') => {
        try {
            setActionId(id);
            if (action === 'start') await meetingsAPI.start(id);
            if (action === 'end') await meetingsAPI.end(id);
            if (action === 'reopen') await meetingsAPI.reopen(id);
            toast.success(`Meeting ${action}ed successfully`);
            loadMeetings();
        } catch (err) {
            console.error(err);
            toast.error(`Failed to ${action} meeting`);
        } finally {
            setActionId(null);
        }
    };

    const handleExportAttendance = async (meeting: Meeting) => {
        setExportingId(meeting.id);
        try {
            const res = await meetingsAPI.exportAttendance(meeting.id);
            const exportData = res.data.data;

            const wsData = [
                [`Meeting: ${exportData.meetingTitle}`],
                [`Type: ${exportData.meetingType.replace('_', ' ').toUpperCase()}`],
                [`Date: ${new Date(exportData.scheduledDate).toLocaleString()}`],
                [`Location: ${exportData.location}`],
                [`Status: ${exportData.status}`],
                [],
                ['Sr. No.', 'Name', 'Department', 'Volunteer Type', 'Attendance', 'Notes'],
                ...exportData.rows.map(r => [
                    r.srNo,
                    r.name,
                    r.department,
                    r.volunteerType.charAt(0).toUpperCase() + r.volunteerType.slice(1),
                    r.attendance.replace('_', ' ').toUpperCase(),
                    r.notes,
                ]),
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Style: make header row bold by setting column widths
            ws['!cols'] = [
                { wch: 8 }, { wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
            const safeTitle = exportData.meetingTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
            XLSX.writeFile(wb, `Attendance_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success('Attendance exported successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export attendance');
        } finally {
            setExportingId(null);
        }
    };

    const getMeetingTypeLabel = (type: string) => {
        if (type === 'regular') return 'Regular';
        if (type === 'core_team') return 'Core Team';
        if (type === 'special_camp') return 'Special Camp';
        return type;
    };

    const getMeetingTypeBadgeClass = (type: string) => {
        if (type === 'regular') return 'bg-blue-100 text-blue-800';
        if (type === 'core_team') return 'bg-purple-100 text-purple-800';
        if (type === 'special_camp') return 'bg-amber-100 text-amber-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Meetings</h2>
                    <select
                        value={selectedAyId || ''}
                        onChange={(e) => setSelectedAyId(Number(e.target.value))}
                        className="border rounded px-3 py-1.5 text-sm"
                    >
                        <option value={0} disabled>Select AY</option>
                        {years.map(y => (
                            <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Current)' : ''}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowExportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center">
                        <Download className="w-4 h-4 mr-1" /> Export
                    </button>
                    <button
                        onClick={() => {
                            setEditingMeeting(null);
                            setFormData({ title: '', description: '', meetingType: 'regular', scheduledDate: '', location: '', sendEmail: false, specialCampId: undefined });
                            setShowForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium"
                    >
                        + Schedule Meeting
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold mb-4">{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={formData.meetingType}
                                onChange={e => setFormData({ ...formData, meetingType: e.target.value as 'regular' | 'core_team' | 'special_camp', specialCampId: undefined })}
                                className="w-full border rounded px-3 py-2 text-sm"
                            >
                                <option value="regular">Regular Meeting</option>
                                <option value="core_team">Core Team Meeting</option>
                                <option value="special_camp">Special Camp Meeting</option>
                            </select>
                        </div>

                        {/* Camp picker — shown only when special_camp is selected */}
                        {formData.meetingType === 'special_camp' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Special Camp <span className="text-red-500">*</span>
                                </label>
                                {specialCamps.length === 0 ? (
                                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                        No special camps found for this Academic Year. Please create one first.
                                    </p>
                                ) : (
                                    <select
                                        required
                                        value={formData.specialCampId ?? ''}
                                        onChange={e => setFormData({ ...formData, specialCampId: Number(e.target.value) })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="" disabled>Select a camp...</option>
                                        {specialCamps.map(camp => (
                                            <option key={camp.id} value={camp.id}>
                                                {camp.name} — {camp.location}{camp.isFinalized ? ' ✓ Finalized' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Only volunteers enrolled in this camp will receive notifications and be listed in attendance.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                            <input type="datetime-local" required value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
                        </div>
                        {!editingMeeting && (
                            <div className="md:col-span-2 flex items-center gap-2 mt-2">
                                <input type="checkbox" id="sendEmail" checked={formData.sendEmail} onChange={e => setFormData({ ...formData, sendEmail: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                <label htmlFor="sendEmail" className="text-sm text-gray-700">Send email notification to invited volunteers</label>
                            </div>
                        )}
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Meeting'}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading meetings...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-3 border-b">Title</th>
                                <th className="px-4 py-3 border-b">Type</th>
                                <th className="px-4 py-3 border-b">Date</th>
                                <th className="px-4 py-3 border-b">Location</th>
                                <th className="px-4 py-3 border-b">Status</th>
                                <th className="px-4 py-3 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No meetings found for this academic year.</td>
                                </tr>
                            ) : (
                                meetings.map(meeting => (
                                    <tr key={meeting.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{meeting.title}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMeetingTypeBadgeClass(meeting.meetingType)}`}>
                                                {getMeetingTypeLabel(meeting.meetingType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{new Date(meeting.scheduledDate).toLocaleString()}</td>
                                        <td className="px-4 py-3">{meeting.location}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${meeting.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : meeting.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                {meeting.status === 'scheduled' && (
                                                    <button onClick={() => handleAction(meeting.id, 'start')} disabled={actionId === meeting.id} className="text-green-600 hover:underline disabled:opacity-50">Start</button>
                                                )}
                                                {meeting.status === 'active' && (
                                                    <button onClick={() => handleAction(meeting.id, 'end')} disabled={actionId === meeting.id} className="text-red-600 hover:underline disabled:opacity-50">End</button>
                                                )}
                                                {meeting.status === 'ended' && isSuperadmin && (
                                                    <button onClick={() => handleAction(meeting.id, 'reopen')} disabled={actionId === meeting.id} className="text-yellow-600 hover:underline disabled:opacity-50">Reopen</button>
                                                )}
                                                {/* Per-meeting attendance export — shown for ended meetings */}
                                                {meeting.status === 'ended' && (
                                                    <button
                                                        onClick={() => handleExportAttendance(meeting)}
                                                        disabled={exportingId === meeting.id}
                                                        className="flex items-center gap-1 text-emerald-600 hover:underline text-xs disabled:opacity-50"
                                                        title="Export attendance as Excel"
                                                    >
                                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                                        {exportingId === meeting.id ? 'Exporting...' : 'Export'}
                                                    </button>
                                                )}
                                                <button onClick={() => {
                                                    setSelectedMeetingForAttendance({ id: meeting.id, status: meeting.status, meetingType: meeting.meetingType });
                                                    setAttendanceModalOpen(true);
                                                }} className="text-blue-600 hover:underline font-semibold">Attendance</button>
                                                {(meeting.status !== 'ended' || isSuperadmin) && (
                                                    <button onClick={() => handleEdit(meeting)} disabled={actionId === meeting.id} className="text-blue-600 hover:underline disabled:opacity-50">Edit</button>
                                                )}
                                                {isSuperadmin && (
                                                    <button onClick={() => handleDelete(meeting.id)} disabled={actionId === meeting.id} className="text-red-600 hover:underline disabled:opacity-50">Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <ExportDataModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={meetings}
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'meetingType', label: 'Type' },
                    { key: 'description', label: 'Description' },
                    { key: 'scheduledDate', label: 'Scheduled Date' },
                    { key: 'location', label: 'Location' },
                    { key: 'status', label: 'Status' }
                ]}
                filename="Meetings_Export"
            />
            {selectedMeetingForAttendance && (
                <MeetingAttendanceModal
                    isOpen={attendanceModalOpen}
                    onClose={() => setAttendanceModalOpen(false)}
                    meetingId={selectedMeetingForAttendance.id}
                    meetingStatus={selectedMeetingForAttendance.status}
                    meetingType={selectedMeetingForAttendance.meetingType}
                />
            )}
        </div>
    );
};
