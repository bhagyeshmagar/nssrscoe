import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { AcademicYear, EventData } from '../../services/api';

export const ActivityCalendarTab = ({ events, years, currentAY }: { events: EventData[]; years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const navigate = useNavigate();
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? (years[0]?.id || 0));

    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const calendarEvents = useMemo(() => {
        return events
            .filter(e => e.academicYearId === selectedAyId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events, selectedAyId]);

    const buildExportRows = (forCsv: boolean) => {
        const headers = ['Month', 'Date', 'Activity Name', 'Type'];
        const rows = calendarEvents.map(e => {
            const d = new Date(e.date);
            const month = d.toLocaleString('en-US', { month: 'long' });
            // Prefixing with a single quote neutralizes CSV injection risks for spreadsheet apps
            const safeTitle = (forCsv && /^[=+\-@]/.test(e.title)) ? `'${e.title}` : e.title;
            return [month, d.toLocaleDateString(), safeTitle, e.type];
        });
        return [headers, ...rows];
    };

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.aoa_to_sheet(buildExportRows(true));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Calendar');
        XLSX.writeFile(workbook, `activity_calendar_ay_${selectedAyId}.csv`);
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.aoa_to_sheet(buildExportRows(false));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Calendar');
        XLSX.writeFile(workbook, `activity_calendar_ay_${selectedAyId}.xlsx`);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Activity Calendar</h2>
                <div className="flex items-center gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={handleExportCSV} disabled={calendarEvents.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Export CSV
                        </button>
                        <button onClick={handleExportExcel} disabled={calendarEvents.length === 0} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Month</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Activity</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {calendarEvents.map(e => {
                            const d = new Date(e.date);
                            const month = d.toLocaleString('en-US', { month: 'long' });
                            return (
                                <tr key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                    <td className="px-4 py-3">{month}</td>
                                    <td className="px-4 py-3">{d.toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 capitalize">{e.type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link to={`/events/${e.id}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline mr-3 font-medium">View Event</Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {calendarEvents.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No events found for this academic year to show on the calendar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
