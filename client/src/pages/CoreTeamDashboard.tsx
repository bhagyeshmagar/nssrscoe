import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { coreTeamDashboardAPI, decodeToken } from '../services/api';

const CoreTeamDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [volunteers, setVolunteers] = useState<unknown[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { token, clearAuth } = useAuthStore();
    const [userName] = useState(() => {
        if (token) {
            const decoded = decodeToken(token);
            return decoded?.username || 'Core Team Member';
        }
        return 'Core Team Member';
    });

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await coreTeamDashboardAPI.getDashboard();
            setVolunteers(res.data.data.volunteers);
        } catch (err: unknown) {
            console.error(err);
            const axiosErr = err as { response?: { status: number } };
            if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
                setError('Access denied. You are not assigned to the core team for the current academic year.');
            } else {
                setError('Failed to load dashboard data.');
            }
        }
        setLoading(false);
    };

     
    useEffect(() => {
         
        loadData();
    }, []);


    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/volunteer')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Go to Volunteer Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-nss-blue">Core Team Dashboard</h1>
                            <p className="text-gray-500">Welcome, {userName}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/volunteer')} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
                                My Volunteer Profile
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>



                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">My Team Volunteers</h2>
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoreTeamDashboard;
