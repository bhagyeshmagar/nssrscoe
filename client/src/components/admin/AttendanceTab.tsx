import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, eventsAPI, volunteersAPI } from '../../services/api';
import type { AcademicYear, VolunteerWithProfile } from '../../services/api';
import { useFlash, useAYSelector } from './Shared';
import { ExportDataModal } from '../common/ExportDataModal';
import { Download } from 'lucide-react';

export const AttendanceTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const { selectedAyId, setSelectedAyId, selectedAY } = useAYSelector(years, currentAY);
    const [eventsList, setEventsList] = useState<any[]>([]);
    const [volunteersList, setVolunteersList] = useState<VolunteerWithProfile[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
    const [showExportModal, setShowExportModal] = useState(false);
    const { msg, flash } = useFlash();

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const [eRes, vRes] = await Promise.all([
                eventsAPI.getAll(),
                volunteersAPI.getByAY(selectedAyId, { status: 'regular', isActive: true })
            ]);
            if (selectedAY) {
                const ayStart = new Date(selectedAY.startDate);
                const ayEnd = new Date(selectedAY.endDate);
                const filteredEvents = (eRes.data.data as any[]).filter(ev => {
                    const evDate = new Date(ev.date);
                    const belongsToAY = ev.academicYearId
                        ? ev.academicYearId === selectedAyId
                        : (evDate >= ayStart && evDate <= ayEnd);
                    return belongsToAY && (ev.type === 'past' || ev.type === 'today');
                });
                setEventsList(filteredEvents);
            } else {
                setEventsList((eRes.data.data as any[]).filter(ev => ev.type === 'past' || ev.type === 'today'));
            }
            setVolunteersList(vRes.data.data?.data || []);
        } catch { }
    }, [selectedAyId, years]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);



    const handleManage = async (event: any) => {
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
        }
    };

    const handleSave = async () => {
        if (!selectedEvent) return;
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
                    {selectedEvent && (
                        <button onClick={() => setShowExportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center">
                            <Download className="w-4 h-4 mr-1" /> Export
                        </button>
                    )}
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
            
            <ExportDataModal 
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={volunteersList.map(v => ({
                    volunteerName: v.name,
                    department: v.department,
                    status: attendanceMap[v.id] ? 'Present' : 'Absent',
                }))}
                columns={[
                    { key: 'volunteerName', label: 'Volunteer Name' },
                    { key: 'department', label: 'Department' },
                    { key: 'status', label: 'Attendance Status' }
                ]}
                filename={`Attendance_${selectedEvent?.title}_AY_${selectedAY?.label || 'All'}`}
            />
        </div>
    );
};
