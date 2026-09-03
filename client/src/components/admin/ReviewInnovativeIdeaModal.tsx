import { useState, useEffect } from 'react';
import { uploadAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, XCircle, AlertTriangle, Calendar, User, BookOpen, GraduationCap } from 'lucide-react';

import type { InnovativeIdea } from '@/types/innovativeIdea';
import { getErrorMessage } from '@/utils/errors';
import { useApproveIdea, useRejectIdea } from '@/hooks/useInnovativeIdeas';

import { formatDate } from '@/utils/dateFormatter';
interface ReviewInnovativeIdeaModalProps {
    isOpen: boolean;
    onClose: () => void;
    idea: InnovativeIdea | null;
    onSuccess: () => void;
}

export const ReviewInnovativeIdeaModal = ({ isOpen, onClose, idea, onSuccess }: ReviewInnovativeIdeaModalProps) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const approveMutation = useApproveIdea();
    const rejectMutation = useRejectIdea();

    useEffect(() => {
        if (!isOpen) {
            setRejectionReason('');
        }
    }, [isOpen]);

    if (!idea) return null;

    let parsedUpdateData = null;
    if (idea.pendingUpdateData) {
        try {
            parsedUpdateData = JSON.parse(idea.pendingUpdateData);
        } catch (e) {
            console.error('Failed to parse pendingUpdateData JSON:', e);
        }
    }

    const handleApprove = (approveType: 'idea' | 'update' | 'delete') => {
        if (approveType === 'delete') {
            if (!window.confirm('Are you sure you want to approve this deletion request? This will permanently remove the idea.')) return;
        }
        
        approveMutation.mutate(
            { id: idea.id, approveType },
            {
                onSuccess: () => {
                    toast.success(`Successfully approved ${approveType}`);
                    onSuccess();
                },
                onError: (error) => {
                    console.error('Approve failed:', error);
                    toast.error(getErrorMessage(error) ?? 'Failed to approve');
                }
            }
        );
    };

    const handleReject = (rejectType: 'idea' | 'update' | 'delete') => {
        if (rejectType === 'idea' && !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejecting the idea');
            return;
        }

        rejectMutation.mutate(
            { id: idea.id, rejectType, reason: rejectType === 'idea' ? rejectionReason : undefined },
            {
                onSuccess: () => {
                    toast.success(`Successfully rejected ${rejectType}`);
                    onSuccess();
                },
                onError: (error) => {
                    console.error('Reject failed:', error);
                    toast.error(getErrorMessage(error) ?? 'Failed to reject');
                }
            }
        );
    };

    const submitting = approveMutation.isPending || rejectMutation.isPending;

    // Helper to render changes if there is a pending update
    const renderDiff = (label: string, oldVal: string, newVal: string) => {
        if (oldVal === newVal) return null;
        return (
            <div className="mb-4 bg-white p-3 rounded border border-gray-100 shadow-sm">
                <p className="font-medium text-sm text-gray-700 mb-2">{label}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-2 rounded text-sm text-red-900 border border-red-100">
                        <span className="block text-xs font-semibold text-red-700 mb-1">Current</span>
                        {oldVal || <span className="italic text-gray-500">None</span>}
                    </div>
                    <div className="bg-green-50 p-2 rounded text-sm text-green-900 border border-green-100">
                        <span className="block text-xs font-semibold text-green-700 mb-1">Proposed</span>
                        {newVal || <span className="italic text-gray-500">None</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {idea.deleteRequested ? 'Review Deletion Request' : idea.pendingUpdateData ? 'Review Update Request' : 'Review Innovative Idea'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Volunteer Info Card */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Volunteer Information</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-gray-500">Name</p><p className="font-medium text-gray-900">{idea.volunteerName}</p></div>
                            <div><p className="text-gray-500">Academic Year</p><p className="font-medium text-gray-900">{idea.academicYearLabel}</p></div>
                            <div><p className="text-gray-500">Department</p><p className="font-medium text-gray-900">{idea.department}</p></div>
                            <div><p className="text-gray-500">Year</p><p className="font-medium text-gray-900">{idea.collegeYearAtEnrollment}</p></div>
                        </div>
                    </div>

                    {/* Pending Delete Request View */}
                    {idea.deleteRequested ? (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-red-900">Deletion Requested</h3>
                                    <p className="text-red-700 text-sm mt-1">The volunteer has requested to delete this idea. Deleting it will permanently remove it from the public records.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => handleReject('delete')} disabled={submitting}>Reject Deletion</Button>
                                <Button variant="destructive" onClick={() => handleApprove('delete')} disabled={submitting}>Approve Deletion</Button>
                            </div>
                        </div>
                    ) : idea.pendingUpdateData && parsedUpdateData ? (
                        /* Pending Update View */
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Proposed Updates
                            </h3>
                            {renderDiff('Title', idea.title, parsedUpdateData.title)}
                            {renderDiff('Category', idea.category, parsedUpdateData.category)}
                            {renderDiff('Description', idea.description, parsedUpdateData.description)}
                            {renderDiff('Article', idea.article || '', parsedUpdateData.article || '')}
                            {renderDiff('Methodology', idea.methodology || '', parsedUpdateData.methodology || '')}
                            {renderDiff('Benefits', idea.benefits || '', parsedUpdateData.benefits || '')}
                            
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => handleReject('update')} disabled={submitting}>Reject Changes</Button>
                                <Button onClick={() => handleApprove('update')} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">Approve Changes</Button>
                            </div>
                        </div>
                    ) : idea.pendingUpdateData ? (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Proposed Updates
                            </h3>
                            <div className="text-red-600 text-sm">Unable to display proposed changes — the update data is malformed. You can still reject this update below.</div>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => handleReject('update')} disabled={submitting}>Reject Malformed Update</Button>
                            </div>
                        </div>
                    ) : (
                        /* Standard Idea Review View */
                        <div className="space-y-6">
                            <div className="border-b border-gray-100 pb-4">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-nss-blue">
                                        {idea.category}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-200 shadow-sm flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(idea.createdAt)}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-4">
                                    {idea.title}
                                </h2>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
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

                            <div className="space-y-6">
                                <section>
                                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Brief Description</h2>
                                    <p className="text-gray-800 text-base leading-relaxed">
                                        {idea.description}
                                    </p>
                                </section>

                                {idea.article && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Detailed Concept</h2>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.article}</p>
                                    </section>
                                )}

                                {idea.methodology && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Methodology</h2>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.methodology}</p>
                                    </section>
                                )}

                                {idea.benefits && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Expected Benefits</h2>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.benefits}</p>
                                    </section>
                                )}

                                {idea.supportingDocumentUrl && (
                                    <section className="pt-2">
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
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

                            {idea.status === 'pending' && (
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="space-y-3 mb-6">
                                        <Label htmlFor="rejectReason">Rejection Reason (Optional, required if rejecting)</Label>
                                        <Textarea
                                            id="rejectReason"
                                            placeholder="Explain why this idea cannot be approved..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleReject('idea')} 
                                            disabled={submitting || !rejectionReason.trim()}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Idea
                                        </Button>
                                        <Button 
                                            onClick={() => handleApprove('idea')} 
                                            disabled={submitting}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve & Publish
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
