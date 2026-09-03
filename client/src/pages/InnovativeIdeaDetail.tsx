import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { uploadAPI } from '@/services/api';
import type { InnovativeIdea } from '@/types/innovativeIdea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, BookOpen, GraduationCap, FileText } from 'lucide-react';

import { formatDate } from '@/utils/dateFormatter';
export const usePublicIdea = (id: number) => {
    return useQuery({
        queryKey: ['publicIdea', id],
        queryFn: async () => {
            const res = await api.get<InnovativeIdea>(`/innovative-ideas/public/${id}`);
            return res.data.data;
        },
        enabled: !!id
    });
};

const InnovativeIdeaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const ideaId = parseInt(id || '0', 10);

    const { data: idea, isLoading, isError } = usePublicIdea(ideaId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
            </div>
        );
    }

    if (isError || !idea) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Idea Not Found</h2>
                <p className="text-gray-600 mb-6">This innovative idea could not be found or is not approved yet.</p>
                <Button onClick={() => navigate('/innovative-ideas')} variant="default" className="bg-nss-blue">
                    Back to Ideas
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 md:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Button 
                    variant="ghost" 
                    className="mb-6 -ml-4 text-gray-600 hover:text-nss-blue hover:bg-blue-50"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-nss-blue">
                                {idea.category}
                            </span>
                            <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 rounded border border-gray-200 shadow-sm flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(idea.createdAt)}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
                            {idea.title}
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded-full"><User className="w-4 h-4 text-nss-blue" /></div>
                                <div>
                                    <span className="block font-semibold text-gray-900">{idea.volunteerName}</span>
                                    <span className="text-xs">Volunteer</span>
                                </div>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2"></div>
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    <span>{idea.department}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-400" />
                                    <span>{idea.collegeYearAtEnrollment} ({idea.academicYearLabel})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        <section>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Brief Description</h2>
                            <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                                {idea.description}
                            </p>
                        </section>

                        {idea.article && (
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Detailed Concept</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.article}</p>
                            </section>
                        )}

                        {idea.methodology && (
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Methodology</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.methodology}</p>
                            </section>
                        )}

                        {idea.benefits && (
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Expected Benefits</h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.benefits}</p>
                            </section>
                        )}

                        {idea.supportingDocumentUrl && (
                            <section className="pt-4">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-nss-blue mb-1">Supporting Document</h3>
                                        <p className="text-sm text-blue-700/80">View the attached file for more details.</p>
                                    </div>
                                    <Button asChild variant="outline" className="bg-white hover:bg-blue-50 border-blue-200 text-nss-blue">
                                        <a href={uploadAPI.getFullUrl(idea.supportingDocumentUrl)} target="_blank" rel="noreferrer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View Document
                                        </a>
                                    </Button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InnovativeIdeaDetail;
