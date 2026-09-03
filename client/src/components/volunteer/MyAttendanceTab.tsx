import { useState, useEffect } from 'react';
import type { MyAttendanceItem } from '../../services/api';
import { volunteerProfileAPI } from '../../services/api';
import toast from 'react-hot-toast';

import { formatDate } from '@/utils/dateFormatter';
export const MyAttendanceTab = () => {
    const [attendanceList, setAttendanceList] = useState<MyAttendanceItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const res = await volunteerProfileAPI.getMyAttendance();
                const data = res.data.data;
                setAttendanceList(data || []);
            } catch (err: unknown) {
                console.error('MyAttendance error:', (err as { response?: { data?: unknown } }).response?.data || err);
                toast.error('Failed to load attendance');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    const totalEvents = attendanceList.filter(a => a.type === 'event').length;
    const totalMeetings = attendanceList.filter(a => a.type === 'meeting').length;
    const totalPresent = attendanceList.filter(a => a.status === 'present').length;

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading attendance...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-nss-blue mb-4">My Attendance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Events Attended</p>
                        <p className="text-2xl font-bold text-nss-blue">{totalEvents}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-xl">🎉</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Meetings Attended</p>
                        <p className="text-2xl font-bold text-nss-blue">{totalMeetings}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-xl">🤝</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Total Present</p>
                        <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-xl">✅</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Title</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Location</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                        {attendanceList.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No attendance records found.
                                </td>
                            </tr>
                        ) : (
                            attendanceList.map((item, index) => (
                                <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">{formatDate(item.date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{item.title}</td>
                                    <td className="px-6 py-4">{item.location || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'present' ? 'bg-green-100 text-green-700' : item.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
