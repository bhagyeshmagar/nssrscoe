import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { volunteersAPI, uploadAPI } from '../services/api';
import type { ExperienceData } from '../services/api';

const Volunteering = () => {
    const [experiences, setExperiences] = useState<ExperienceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExps = async () => {
            try {
                const res = await volunteersAPI.getExperiences();
                const rawData = res.data as unknown as { data?: ExperienceData[] } | ExperienceData[];
                const data = ('data' in rawData && rawData.data) ? rawData.data : rawData as ExperienceData[];
                if (Array.isArray(data) && data.length > 0) {
                    setExperiences(data);
                } else {
                    setExperiences([]);
                }
            } catch (err) {
                console.error("Failed to fetch experiences:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExps();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-4 text-center">Volunteering Experiences</h1>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                Hear from our past and present volunteers about their journey of service, learning, and growth with NSS JSPM RSCOE.
            </p>

            {experiences.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-xl">No volunteering experiences shared yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {experiences.map((exp) => (
                        <div key={exp.id} className="bg-white p-8 rounded-xl shadow-lg relative pt-12 mt-6">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <img 
                                    src={exp.image.startsWith('http') ? exp.image : uploadAPI.getFullUrl(exp.image)} 
                                    alt={exp.name} 
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-gray-100" 
                                />
                            </div>
                            <div className="text-center mb-6">
                                <Quote className="w-8 h-8 text-nss-red mx-auto mb-4 opacity-50" />
                                <p className="text-gray-600 italic mb-6">"{exp.text}"</p>
                            </div>
                            <div className="text-center border-t pt-4">
                                <h4 className="font-bold text-lg text-nss-blue">{exp.name}</h4>
                                <span className="text-sm text-gray-500">{exp.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Volunteering;
