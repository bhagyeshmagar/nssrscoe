import { useState, useEffect } from 'react';
import type { InnovativeIdea } from '@/types/innovativeIdea';
import { useAdminInnovativeIdeas, useAdminDeleteIdea, useAdminRestoreIdea } from '../../hooks/useInnovativeIdeas';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Eye, Trash2, RotateCcw } from 'lucide-react';
import { ReviewInnovativeIdeaModal } from './ReviewInnovativeIdeaModal';

import { formatDate } from '@/utils/dateFormatter';
export const InnovativeIdeasTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIdea, setSelectedIdea] = useState<InnovativeIdea | null>(null);

    const { data: ideas = [], isLoading: loading, refetch } = useAdminInnovativeIdeas({
        search: debouncedSearch,
        status: statusFilter
    });
    const deleteMutation = useAdminDeleteIdea();
    const restoreMutation = useAdminRestoreIdea();
    const queryClient = useQueryClient();

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const getStatusBadge = (status: string, deleteRequested: boolean, pendingUpdateData: string | null, deletedAt: string | null | undefined) => {
        if (deletedAt) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                <Trash2 className="w-3 h-3" /> Deleted
            </span>;
        }
        if (deleteRequested) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3" /> Deletion Requested
            </span>;
        }
        if (pendingUpdateData) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <AlertCircle className="w-3 h-3" /> Update Requested
            </span>;
        }
        
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3" /> Rejected
                </span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Manage Innovative Ideas</h2>
                    <p className="text-sm text-gray-500 mt-1">Review, approve, and manage volunteer ideas</p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <Input
                            placeholder="Search ideas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs bg-white"
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending New</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Title & Category</th>
                                    <th className="px-6 py-3 font-medium">Volunteer Info</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && ideas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex justify-center mb-2">
                                                <RefreshCw className="w-6 h-6 animate-spin text-nss-blue" />
                                            </div>
                                            Loading ideas...
                                        </td>
                                    </tr>
                                ) : ideas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center mb-3">
                                                <FileText className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No innovative ideas found.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    ideas.map((idea) => (
                                        <tr key={idea.id} className={`border-b transition-colors ${idea.deletedAt ? 'bg-slate-50/50 opacity-75 grayscale border-slate-100' : 'bg-white border-gray-50 hover:bg-blue-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 line-clamp-1">{idea.title}</div>
                                                <div className="text-xs text-gray-500 mt-1">{idea.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800">{idea.volunteerName}</div>
                                                <div className="text-xs text-gray-500 mt-1">{idea.department} • {idea.collegeYearAtEnrollment} • {idea.academicYearLabel}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(idea.status, idea.deleteRequested, idea.pendingUpdateData, idea.deletedAt)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                {formatDate(idea.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!idea.deletedAt ? (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => setSelectedIdea(idea)}
                                                                className="gap-1.5"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                Review
                                                            </Button>
                                                            {!idea.deleteRequested && idea.status === 'rejected' && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive"
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to permanently delete this idea?')) {
                                                                            deleteMutation.mutate(idea.id);
                                                                        }
                                                                    }}
                                                                    disabled={deleteMutation.isPending}
                                                                    className="gap-1.5"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (window.confirm('Restore this idea?')) {
                                                                    restoreMutation.mutate(idea.id);
                                                                }
                                                            }}
                                                            disabled={restoreMutation.isPending}
                                                            className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            Restore
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ReviewInnovativeIdeaModal 
                isOpen={!!selectedIdea} 
                onClose={() => setSelectedIdea(null)} 
                idea={selectedIdea} 
                onSuccess={() => {
                    setSelectedIdea(null);
                    queryClient.invalidateQueries({ queryKey: ['adminInnovativeIdeas'] });
                }} 
            />
        </div>
    );
};
