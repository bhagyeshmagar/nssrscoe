import type { Meeting } from '../../../services/api';
import { FileSpreadsheet } from 'lucide-react';

interface Props {
    meetings: Meeting[];
    isSuperadmin?: boolean;
    actionId: number | null;
    exportingId: number | null;
    handleAction: (id: number, action: 'start' | 'end' | 'reopen') => void;
    handleExportAttendance: (meeting: Meeting) => void;
    setSelectedMeetingForAttendance: (data: { id: number, status: string, meetingType: string }) => void;
    setAttendanceModalOpen: (open: boolean) => void;
    handleEdit: (meeting: Meeting) => void;
    handleDelete: (id: number) => void;
}

export const MeetingTable = ({
    meetings, isSuperadmin, actionId, exportingId,
    handleAction, handleExportAttendance, setSelectedMeetingForAttendance, setAttendanceModalOpen,
    handleEdit, handleDelete
}: Props) => {

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
    );
};
