import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeToken } from '../services/api';

import { ProfileTab } from '../components/volunteer/ProfileTab';
import { PasswordTab } from '../components/volunteer/PasswordTab';
import { VolunteersListTab } from '../components/volunteer/VolunteersListTab';

type TabType = 'profile' | 'volunteers';

const VolunteerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [userName] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                return decoded.email || decoded.username || '';
            }
        }
        return '';
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-nss-blue">Volunteer Dashboard</h1>
                            <p className="text-gray-500">Welcome, {userName}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 px-6 py-4 text-center font-medium transition ${activeTab === 'profile'
                                ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📋 My Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('volunteers')}
                            className={`flex-1 px-6 py-4 text-center font-medium transition ${activeTab === 'volunteers'
                                ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            👥 Fellow Volunteers
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'profile' ? (
                    <>
                        <ProfileTab setMessage={setMessage} />
                        <PasswordTab setMessage={setMessage} />
                    </>
                ) : (
                    <VolunteersListTab />
                )}
            </div>
        </div>
    );
};

export default VolunteerDashboard;
