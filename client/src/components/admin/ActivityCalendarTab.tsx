import { useState, useEffect, useCallback } from 'react';
import { activityCalendarAPI } from '../../services/api';
import type { AcademicYear, ActivityCalendarItem } from '../../services/api';

export const ActivityCalendarTab = ({ years, currentAY }: { years: AcademicYear[]; currentAY: AcademicYear | null }) => {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? (years[0]?.id || 0));
    const [activities, setActivities] = useState<ActivityCalendarItem[]>([]);
    const [form, setForm] = useState({ month: 'June', tentativeDate: '', activity: '', type: 'Field Work' });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!selectedAyId) return;
        try {
            const res = await activityCalendarAPI.getByAcademicYear(selectedAyId);
            const acts = (res.data as any)?.data ?? res.data;
            setActivities(Array.isArray(acts) ? acts : []);
        } catch { setActivities([]); }
    }, [selectedAyId]);

    useEffect(() => { load(); }, [load]);
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const handleSave = async () => {
        try {
            if (editingId) {
                await activityCalendarAPI.update(editingId, form);
            } else {
                await activityCalendarAPI.create(selectedAyId, form);
            }
            setShowForm(false); setEditingId(null);
            setForm({ month: 'June', tentativeDate: '', activity: '', type: 'Field Work' });
            load();
        } catch (e: any) { alert(e.response?.data?.message || 'Error saving activity'); }
    };

    const handleEdit = (act: ActivityCalendarItem) => {
        setForm({ month: act.month, tentativeDate: act.tentativeDate, activity: act.activity, type: act.type });
        setEditingId(act.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this activity?')) return;
        try {
            await activityCalendarAPI.delete(id);
            load();
        } catch (e: any) { alert('Error deleting activity'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Activity Calendar</h2>
                <div className="flex items-center gap-3">
                    <select value={selectedAyId} onChange={e => setSelectedAyId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {years.map(y => <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Active)' : y.isLocked ? '[Locked]' : ''}</option>)}
                    </select>
                    <button onClick={() => { setForm({ month: 'June', tentativeDate: '', activity: '', type: 'Field Work' }); setEditingId(null); setShowForm(!showForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ Add Activity</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-700 mb-4">{editingId ? 'Edit Activity' : 'New Activity'}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm text-gray-600 mb-1">Month</label>
                            <input value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} placeholder="June" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1">Tentative Date / Week</label>
                            <input value={form.tentativeDate} onChange={e => setForm({ ...form, tentativeDate: e.target.value })} placeholder="5th June" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Activity Name</label>
                            <input value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} placeholder="World Environment Day" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="Field Work">Field Work</option>
                                <option value="Health">Health</option>
                                <option value="Campus">Campus</option>
                                <option value="National">National</option>
                                <option value="Awareness">Awareness</option>
                            </select></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Save</button>
                        <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Month</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Tentative Date</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Activity</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {activities.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{a.month}</td>
                                <td className="px-4 py-3">{a.tentativeDate}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{a.activity}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{a.type}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {activities.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No activities found for this academic year.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
