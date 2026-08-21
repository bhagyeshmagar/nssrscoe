import { meetingsAPI } from '../../../services/api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const handleExportAttendanceXLSX = async (meetingId: number) => {
    try {
        const res = await meetingsAPI.exportAttendance(meetingId);
        const exportData = res.data.data;

        const wsData = [
            [`Meeting: ${exportData.meetingTitle}`],
            [`Type: ${exportData.meetingType.replace('_', ' ').toUpperCase()}`],
            [`Date: ${new Date(exportData.scheduledDate).toLocaleString()}`],
            [`Location: ${exportData.location}`],
            [`Status: ${exportData.status}`],
            [],
            ['Sr. No.', 'Name', 'Department', 'Volunteer Type', 'Attendance', 'Notes'],
            ...exportData.rows.map((r: any) => [
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
        throw err;
    }
};
