import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceAPI, eventsAPI, volunteersAPI, emailLogsAPI } from '../../services/api';
import type { AcademicYear, VolunteerWithProfile, EventData } from '../../services/api';
import { useFlash, useAYSelector } from './Shared';
import { FileSpreadsheet, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAcademicYears } from '../../hooks/useAcademicYears';

import { formatDate } from '@/utils/dateFormatter';
export const AttendanceTab = () => {
    const { data: years = [] } = useAcademicYears();
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, null);
    const [eventsList, setEventsList] = useState<EventData[]>([]);
    const [volunteersList, setVolunteersList] = useState<VolunteerWithProfile[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
    const [exportingId, setExportingId] = useState<number | null>(null);
    const [sendingReportId, setSendingReportId] = useState<number | null>(null);
    const [managingId, setManagingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'department'>('department');
    const { msg, flash } = useFlash();

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const selectedAY = years.find((y: AcademicYear) => y.id === selectedAyId);

            const [eRes, vRes] = await Promise.all([
                eventsAPI.getAll(),
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            if (selectedAY) {
                const ayStart = new Date(selectedAY.startDate);
                const ayEnd = new Date(selectedAY.endDate);
                const filteredEvents = (eRes.data.data as EventData[]).filter(ev => {
                    const evDate = new Date(ev.date);
                    const belongsToAY = ev.academicYearId
                        ? ev.academicYearId === selectedAyId
                        : (evDate >= ayStart && evDate <= ayEnd);
                    return belongsToAY && (ev.type === 'past' || ev.type === 'today');
                });
                setEventsList(filteredEvents);
            } else {
                setEventsList((eRes.data.data as EventData[]).filter(ev => ev.type === 'past' || ev.type === 'today'));
            }
            setVolunteersList(vRes.data.data?.data || []);
        } catch (e: any) {
            console.error(e);
            flash('err', e.response?.data?.message || 'Failed to load attendance data.');
        }
    }, [selectedAyId, years]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && selectedAY) {
            setSelectedAyId(selectedAY.id);
        }
    }, [selectedAY, selectedAyId]);



    const handleManage = async (event: EventData) => {
        setManagingId(event.id);
        try {
            const res = await attendanceAPI.getEventAttendance(selectedAyId, event.id);
            const data = res.data.data;
            const records = data?.records || [];
            const map: Record<number, boolean> = {};
            volunteersList.forEach(v => map[v.id] = false); // Default absent
            records.forEach((r: any) => {
                if (r.status === 'present') map[r.volunteerId] = true;
            });
            setAttendanceMap(map);
            setSelectedEvent(event);
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Failed to load attendance.');
        } finally {
            setManagingId(null);
        }
    };

    const sortedVolunteers = useMemo(() => {
        return [...volunteersList].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
        });
    }, [volunteersList, sortBy]);

    const handleExportAttendance = async (event: EventData) => {
        setExportingId(event.id);
        try {
            // Fetch the attendance records for this event
            const attRes = await attendanceAPI.getEventAttendance(selectedAyId, event.id);
            const records: any[] = attRes.data.data?.records || [];

            // Build a map of volunteerId -> status
            const statusMap: Record<number, string> = {};
            records.forEach((r: any) => { statusMap[r.volunteerId] = r.status; });

            const wsData = [
                [`Event: ${event.title}`],
                [`Date: ${formatDate(event.date)}`],
                [`Location: ${event.location}`],
                [],
                ['Sr. No.', 'PRN No.', 'Name', 'Department', 'Attendance Status'],
                ...sortedVolunteers.map((v, i) => [
                    i + 1,
                    v.profile?.prnNo || 'N/A',
                    v.name,
                    v.department,
                    statusMap[v.id]
                        ? statusMap[v.id].charAt(0).toUpperCase() + statusMap[v.id].slice(1)
                        : 'Absent',
                ]),
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 35 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
            const safeTitle = event.title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
            XLSX.writeFile(wb, `Attendance_${safeTitle}_${new Date(event.date).toISOString().slice(0, 10)}.xlsx`);
            toast.success('Attendance exported!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export attendance');
        } finally {
            setExportingId(null);
        }
    };

    const handleEmailHodReport = async (event: EventData) => {
        if (!selectedAyId) return;
        setSendingReportId(event.id);
        try {
            const res = await emailLogsAPI.sendAttendanceReport(selectedAyId, event.id);
            const { sent, failed } = res.data.data as any;
            if (sent > 0) {
                toast.success(`✅ Reports emailed to ${sent} HOD${sent > 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}!`);
            } else if (failed > 0) {
                toast.error(`All ${failed} emails failed. Check email config.`);
            } else {
                toast(`No HOD contacts matched the departments in this attendance data. Add HOD contacts in the Email Service tab.`, { icon: '⚠️' });
            }
        } catch (e: any) {
            const msg = e.response?.data?.message;
            toast.error(msg ?? 'Failed to send HOD reports.');
        } finally {
            setSendingReportId(null);
        }
    };

    const handleSave = async () => {
        if (!selectedEvent || saving) return;
        setSaving(true);
        const records = volunteersList.map(v => ({
            volunteerId: v.id,
            status: attendanceMap[v.id] ? 'present' : 'absent' as 'present' | 'absent'
        }));
        try {
            await attendanceAPI.saveEventAttendance(selectedAyId, selectedEvent.id, records);
            flash('ok', 'Attendance saved successfully.');
            setSelectedEvent(null);
        } catch (e: any) {
            flash('err', e.response?.data?.message ?? 'Failed to save attendance.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Attendance</h2>
                <div className="flex gap-3">
                    <select value={selectedAyId || ''} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                </div>
            </div>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg.text}</div>}
            {selectedAY?.isLocked && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">[Locked] Locked - read-only.</div>}

            {!selectedEvent ? (
                <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
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
                                    <td className="px-4 py-3 font-mono text-gray-700">{formatDate(e.date)}</td>
                                    <td className="px-4 py-3 font-medium">{e.title}</td>
                                    <td className="px-4 py-3 text-gray-500">{e.location}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleManage(e)} 
                                                disabled={managingId === e.id || exportingId === e.id}
                                                className="text-xs px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium disabled:opacity-50"
                                            >
                                                {managingId === e.id ? 'Loading...' : 'Manage Attendance'}
                                            </button>
                                            <button
                                                onClick={() => handleExportAttendance(e)}
                                                disabled={exportingId === e.id}
                                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium disabled:opacity-50"
                                                title="Export attendance as Excel"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                {exportingId === e.id ? 'Exporting...' : 'Export'}
                                            </button>
                                            <button
                                                onClick={() => handleEmailHodReport(e)}
                                                disabled={sendingReportId === e.id}
                                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium disabled:opacity-50"
                                                title="Email attendance report to HODs"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                {sendingReportId === e.id ? 'Sending...' : 'Email HODs'}
                                            </button>
                                        </div>
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
                            <p className="text-sm text-gray-500 mt-1">{formatDate(selectedEvent.date)} • {selectedEvent.location}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium">Sort by:</label>
                                <select 
                                    value={sortBy} 
                                    onChange={e => setSortBy(e.target.value as 'name' | 'department')}
                                    className="border rounded px-2 py-1 text-sm bg-white"
                                >
                                    <option value="department">Department</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm">Close</button>
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left w-16">Present</th>
                                    <th className="px-4 py-3 text-left">PRN No.</th>
                                    <th className="px-4 py-3 text-left">Volunteer Name</th>
                                    <th className="px-4 py-3 text-left">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sortedVolunteers.map(v => (
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
                                        <td className="px-4 py-3 text-gray-600">{v.profile?.prnNo || 'N/A'}</td>
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
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
