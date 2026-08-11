import { useState, useEffect, useCallback } from 'react';
import { registrationsAPI } from '../../services/api';
import type { EventRegistration } from '../../services/api';
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'approved') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Approved
        </span>
    );
    if (status === 'rejected') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
        </span>
    );
};

export const RegistrationsTab = ({ events }: { events: Array<any> }) => {
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchRegistrations = useCallback(async (eventId: number) => {
        setLoading(true);
        try {
            const response = await registrationsAPI.getByEventId(eventId);
            setRegistrations((response.data as any).data || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchRegistrations(Number(selectedEventId));
        } else {
            setRegistrations([]);
        }
    }, [selectedEventId, fetchRegistrations]);

    const handleApprove = async (id: number) => {
        setActionLoading(id);
        try {
            await registrationsAPI.approve(id);
            setRegistrations(prev =>
                prev.map(r => r.id === id ? { ...r, status: 'approved' } : r)
            );
            showToast('success', 'Registration approved! Pass email sent to the volunteer.');
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Failed to approve registration.');
        }
        setActionLoading(null);
    };

    const handleReject = async (id: number) => {
        if (!window.confirm('Are you sure you want to reject this registration?')) return;
        setActionLoading(id);
        try {
            await registrationsAPI.reject(id);
            setRegistrations(prev =>
                prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r)
            );
            showToast('success', 'Registration rejected.');
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Failed to reject registration.');
        }
        setActionLoading(null);
    };

    const filtered = registrations.filter(r =>
        filterStatus === 'all' ? true : r.status === filterStatus
    );

    const counts = {
        all: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rejected: registrations.filter(r => r.status === 'rejected').length,
    };

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium text-sm transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Registrations</h2>
            </div>

            {/* Event Selector */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event to view registrations:</label>
                <select
                    value={selectedEventId}
                    onChange={e => { setSelectedEventId(e.target.value); setFilterStatus('all'); }}
                    className="w-full md:w-1/2 border rounded px-3 py-2"
                >
                    <option value="">-- Select an Event --</option>
                    {events.map((e: any) => (
                        <option key={e.id} value={e.id}>
                            {e.title} ({new Date(e.date).toLocaleDateString()}) – {e.type}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Stats Row */}
                    <div className="px-6 py-4 border-b bg-gray-50 flex flex-wrap gap-3 items-center">
                        {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                                    filterStatus === s
                                        ? s === 'pending'   ? 'bg-yellow-500 text-white border-yellow-500'
                                        : s === 'approved'  ? 'bg-green-600 text-white border-green-600'
                                        : s === 'rejected'  ? 'bg-red-600 text-white border-red-600'
                                        :                     'bg-gray-700 text-white border-gray-700'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                <span className="ml-1.5 opacity-80">({counts[s]})</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading registrations...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Pass ID</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Dept / Year</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(reg => (
                                        <tr key={reg.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-nss-blue text-xs">{reg.visitorPassId || '—'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{reg.name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <a href={`mailto:${reg.email}`} className="flex items-center gap-1 hover:text-nss-blue">
                                                    <Mail className="w-3 h-3" />{reg.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3">{reg.phone}</td>
                                            <td className="px-4 py-3">{reg.department} ({reg.year})</td>
                                            <td className="px-4 py-3"><StatusBadge status={reg.status || 'pending'} /></td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {reg.status === 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(reg.id)}
                                                            disabled={actionLoading === reg.id}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            {actionLoading === reg.id ? '...' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(reg.id)}
                                                            disabled={actionLoading === reg.id}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {reg.status === 'approved' && (
                                                    <span className="text-xs text-gray-400 italic">Pass sent ✓</span>
                                                )}
                                                {reg.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleApprove(reg.id)}
                                                        disabled={actionLoading === reg.id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Re-approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                                {registrations.length === 0
                                                    ? 'No registrations found for this event.'
                                                    : `No ${filterStatus} registrations.`}
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
