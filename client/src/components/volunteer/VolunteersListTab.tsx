import { useState, useEffect } from 'react';
import { volunteersAPI, uploadAPI } from '../../services/api';
import type { VolunteerData } from '../../services/api';

export const VolunteersListTab = () => {
    const [allVolunteers, setAllVolunteers] = useState<VolunteerData[]>([]);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);

    useEffect(() => {
        fetchAllVolunteers();
    }, []);

    const fetchAllVolunteers = async () => {
        setLoadingVolunteers(true);
        try {
            const response = await volunteersAPI.getAllPublic();
            const volunteersArr = (response.data as any)?.data ?? response.data;
            setAllVolunteers(Array.isArray(volunteersArr) ? volunteersArr : []);
        } catch (error) {
            console.error('Error fetching volunteers:', error);
        } finally {
            setLoadingVolunteers(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Fellow Volunteers</h2>

            {loadingVolunteers ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nss-blue"></div>
                </div>
            ) : allVolunteers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active volunteers found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allVolunteers.map((volunteer: any) => (
                        <div key={volunteer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-3">
                                {volunteer.profilePhotoUrl ? (
                                    <img src={uploadAPI.getFullUrl(volunteer.profilePhotoUrl)} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-12 h-12 bg-nss-blue rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm">
                                        {volunteer.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{volunteer.name}</h3>
                                    <p className="text-sm text-gray-500">{volunteer.department}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
