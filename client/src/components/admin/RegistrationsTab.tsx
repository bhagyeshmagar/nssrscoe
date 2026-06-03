import { useState, useEffect } from 'react';
import { registrationsAPI } from '../../services/api';
import type { EventRegistration } from '../../services/api';

export const RegistrationsTab = ({ events }: { events: any[] }) => {
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEventId) {
            fetchRegistrations(Number(selectedEventId));
        } else {
            setRegistrations([]);
        }
    }, [selectedEventId]);

    const fetchRegistrations = async (eventId: number) => {
        setLoading(true);
        try {
            const response = await registrationsAPI.getByEventId(eventId);
            setRegistrations(response.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Registrations</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event to view registrations:</label>
                <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="w-full md:w-1/2 border rounded px-3 py-2"
                >
                    <option value="">-- Select an Event --</option>
                    {events.map((e: any) => (
                        <option key={e.id} value={e.id}>
                            {e.title} ({new Date(e.date).toLocaleDateString()}) - {e.type}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">
                            Total Registrations: {registrations.length}
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading registrations...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Visitor ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dept/Year</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Registered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(reg => (
                                        <tr key={reg.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-nss-blue">{reg.visitorPassId}</td>
                                            <td className="px-4 py-3 font-medium">{reg.name}</td>
                                            <td className="px-4 py-3">{reg.email}</td>
                                            <td className="px-4 py-3">{reg.phone}</td>
                                            <td className="px-4 py-3">{reg.department} ({reg.year})</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No registrations found for this event.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
