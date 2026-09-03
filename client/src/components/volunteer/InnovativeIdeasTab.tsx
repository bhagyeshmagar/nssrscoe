import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, CheckCircle2, XCircle, FileText, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { InnovativeIdeaFormModal } from './InnovativeIdeaFormModal';
import type { InnovativeIdea } from '@/types/innovativeIdea';
import { useVolunteerInnovativeIdeas, useRequestDeleteIdea } from '@/hooks/useInnovativeIdeas';

export const InnovativeIdeasTab = () => {
    const { data: ideas = [], isLoading: loading } = useVolunteerInnovativeIdeas();
    const requestDeleteIdea = useRequestDeleteIdea();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<InnovativeIdea | null>(null);

    const handleEdit = (idea: InnovativeIdea) => {
        if (idea.deleteRequested) {
            toast.error('Cannot edit while deletion is pending.');
            return;
        }
        setEditingIdea(idea);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = async (id: number) => {
        if (!confirm('Are you sure you want to request deletion for this idea?')) return;
        try {
            await requestDeleteIdea.mutateAsync(id);
            toast.success('Deletion requested successfully');
        } catch (error) {
            console.error('Delete request failed:', error);
            toast.error('Failed to request deletion');
        }
    };

    const getStatusIcon = (status: string, deleteRequested: boolean, pendingUpdateData: string | null) => {
        if (deleteRequested) return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (pendingUpdateData) return <AlertCircle className="w-5 h-5 text-orange-500" />;
        
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getStatusText = (status: string, deleteRequested: boolean, pendingUpdateData: string | null) => {
        if (deleteRequested) return 'Deletion Pending';
        if (pendingUpdateData) return 'Update Pending';
        
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Innovative Ideas</h2>
                    <p className="text-sm text-gray-500 mt-1">Submit and manage your ideas for social welfare</p>
                </div>
                <Button onClick={() => { setEditingIdea(null); setIsFormOpen(true); }} className="bg-nss-blue hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Idea
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nss-blue"></div></div>
            ) : ideas.length === 0 ? (
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Ideas Submitted Yet</h3>
                        <p className="text-gray-500 text-center max-w-sm mb-6">
                            Have an innovative idea for community development? Share it with us!
                        </p>
                        <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                            Submit Your First Idea
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ideas.map((idea) => (
                        <Card key={idea.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {idea.category}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                        {getStatusIcon(idea.status, idea.deleteRequested, idea.pendingUpdateData)}
                                        <span className="text-xs font-medium text-gray-700">
                                            {getStatusText(idea.status, idea.deleteRequested, idea.pendingUpdateData)}
                                        </span>
                                    </div>
                                </div>
                                <CardTitle className="text-lg leading-tight text-gray-900 line-clamp-2">{idea.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                                    {idea.description}
                                </p>
                                
                                {idea.rejectionReason && idea.status === 'rejected' && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md mb-4">
                                        <p className="text-xs text-red-800">
                                            <span className="font-semibold">Reason:</span> {idea.rejectionReason}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={() => handleEdit(idea)}
                                        disabled={idea.deleteRequested}
                                    >
                                        <Edit className="w-4 h-4 mr-1.5" />
                                        {idea.status === 'approved' ? 'Update' : 'Edit'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteRequest(idea.id)}
                                        disabled={idea.deleteRequested}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <InnovativeIdeaFormModal 
                isOpen={isFormOpen} 
                onClose={() => { setIsFormOpen(false); setEditingIdea(null); }} 
                onSuccess={() => {}}
                initialData={editingIdea}
            />
        </div>
    );
};
