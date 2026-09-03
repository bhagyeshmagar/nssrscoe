import { useState, useEffect } from 'react';
import { coreTeamDashboardAPI } from '../../services/api';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CoreTeamTab = () => {
    const [loading, setLoading] = useState(false);
    const [volunteers, setVolunteers] = useState<unknown[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await coreTeamDashboardAPI.getDashboard();
            setVolunteers(res.data.data.volunteers);
        } catch (err: unknown) {
            console.error(err);
            if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                setError('Access denied. You are not assigned to the core team for the current academic year.');
            } else {
                setError('Failed to load team data.');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">My Team Volunteers</h2>
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nss-blue"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-3 border-b">Name</th>
                                <th className="px-4 py-3 border-b">Email</th>
                                <th className="px-4 py-3 border-b">Status</th>
                                <th className="px-4 py-3 border-b">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(volunteers as { id: number; name: string; email: string; status: string; profile?: { phoneNo?: string } }[]).map(v => (
                                <tr key={v.id} className="border-b">
                                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                                    <td className="px-4 py-3">{v.email}</td>
                                    <td className="px-4 py-3">{v.status}</td>
                                    <td className="px-4 py-3">{v.profile?.phoneNo || '-'}</td>
                                </tr>
                            ))}
                            {volunteers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No volunteers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
