import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicYearsAPI, eventsAPI } from '../services/api';
import type { AcademicYear, EventData } from '../services/api';

const Calendar = () => {
    const navigate = useNavigate();
    const [currentAY, setCurrentAY] = useState<AcademicYear | null>(null);
    const [activities, setActivities] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const ayRes = await academicYearsAPI.getCurrent();
                const ayData = ayRes.data as unknown as { data?: AcademicYear } | AcademicYear;
                const current = ('data' in ayData && ayData.data) ? ayData.data : ayData as AcademicYear;
                
                if (current && current.id) {
                    setCurrentAY(current);
                    const actRes = await eventsAPI.getAll();
                    const allEvents = (actRes.data.data as EventData[]) || [];
                    const acts = allEvents
                        .filter(e => e.academicYearId === current.id)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setActivities(acts);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        load();
    }, []);

    const getTypeColor = (type?: string) => {
        if (!type) return 'bg-gray-100 text-gray-800';
        const t = type.toLowerCase();
        if (t.includes('field')) return 'bg-green-100 text-green-800';
        if (t.includes('health')) return 'bg-blue-100 text-blue-800';
        if (t.includes('campus')) return 'bg-gray-100 text-gray-800';
        if (t.includes('national')) return 'bg-orange-100 text-orange-800';
        if (t.includes('upcoming')) return 'bg-purple-100 text-purple-800';
        if (t.includes('past')) return 'bg-red-100 text-red-800';
        return 'bg-purple-100 text-purple-800';
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">
                Activity Calendar {currentAY ? currentAY.label : ''}
            </h1>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-nss-blue text-white">
                            <tr>
                                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Tentative Date</th>
                                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activities.map(act => (
                                <tr key={act.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/events/${act.id}`)}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{new Date(act.date).toLocaleString('default', { month: 'long' })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(act.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{act.title}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(act.type)}`}>
                                            {act.type || 'General Event'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No activities scheduled yet for this academic year.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
            <p className="mt-4 text-sm text-gray-500 italic text-center">* Dates are tentative and subject to change as per university guidelines.</p>
        </div>
    );
};

export default Calendar;
