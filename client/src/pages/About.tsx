import { useState, useEffect } from 'react';
import { settingsAPI, uploadAPI } from '../services/api';
import type { SiteSettings } from '../services/api';

const About = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.get();
                setSettings(response.data.data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">About Us</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-nss-red">Our Mission</h2>
                    <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                        {settings?.aboutMission || "To understand the community in which we work. To understand ourselves in relation to their community. To identify the needs and problems of the community and involve them in problem-solving."}
                    </p>
                    <h2 className="text-2xl font-semibold mb-4 text-nss-red">Our Vision</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {settings?.aboutHistory || "To build the youth with the mind and spirit to serve the society and work for the social upliftment of the down-trodden masses of our nation as a movement."}
                    </p>
                </div>
                <div className="flex items-center justify-center">
                    {settings?.aboutTeamPhoto ? (
                        <img 
                            src={uploadAPI.getFullUrl(settings.aboutTeamPhoto)} 
                            alt="NSS Team" 
                            className="w-full rounded-lg shadow-xl object-cover"
                        />
                    ) : (
                        <div className="bg-gray-200 w-full h-64 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">NSS Team Photo Placeholder</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Leadership Messages */}
            {(settings?.aboutDirectorMessage || settings?.aboutPoMessage) && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {settings?.aboutDirectorMessage && (
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center gap-4 mb-4">
                                {settings?.aboutDirectorPhoto && (
                                    <img src={uploadAPI.getFullUrl(settings.aboutDirectorPhoto)} alt="Director" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-nss-blue">{settings?.aboutDirectorName || "Director"}</h3>
                                    <p className="text-sm text-gray-500">Director's Message</p>
                                </div>
                            </div>
                            <p className="text-gray-700 italic">"{settings.aboutDirectorMessage}"</p>
                        </div>
                    )}

                    {settings?.aboutPoMessage && (
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center gap-4 mb-4">
                                {settings?.aboutPoPhoto && (
                                    <img src={uploadAPI.getFullUrl(settings.aboutPoPhoto)} alt="NSS PO" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-nss-blue">{settings?.aboutPoName || "NSS PO"}</h3>
                                    <p className="text-sm text-gray-500">NSS Programme Officer</p>
                                </div>
                            </div>
                            <p className="text-gray-700 italic">"{settings.aboutPoMessage}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
export default About;
