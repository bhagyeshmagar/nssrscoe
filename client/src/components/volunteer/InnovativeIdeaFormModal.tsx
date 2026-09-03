import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, FileUp } from 'lucide-react';

import { getErrorMessage } from '@/utils/errors';
import { INNOVATIVE_IDEA_CATEGORIES } from '@/constants/innovativeIdeaCategories';
import type { InnovativeIdea } from '@/types/innovativeIdea';
import { useSubmitIdea, useUpdateIdea } from '@/hooks/useInnovativeIdeas';

interface InnovativeIdeaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InnovativeIdea | null;
}

export const InnovativeIdeaFormModal = ({ isOpen, onClose, onSuccess, initialData }: InnovativeIdeaFormModalProps) => {
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const submitIdea = useSubmitIdea();
    const updateIdea = useUpdateIdea();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        article: '',
        methodology: '',
        benefits: '',
        supportingDocumentUrl: ''
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || '',
                article: initialData.article || '',
                methodology: initialData.methodology || '',
                benefits: initialData.benefits || '',
                supportingDocumentUrl: initialData.supportingDocumentUrl || ''
            });
        } else if (isOpen) {
            setFormData({
                title: '',
                description: '',
                category: '',
                article: '',
                methodology: '',
                benefits: '',
                supportingDocumentUrl: ''
            });
        }
        setSelectedFile(null);
    }, [isOpen, initialData]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File must be under 10MB');
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        e.target.value = '';
    };

    const removeFile = () => {
        if (selectedFile) {
            setSelectedFile(null);
        } else if (formData.supportingDocumentUrl) {
            setFormData(prev => ({ ...prev, supportingDocumentUrl: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }

        try {
            setSubmitting(true);
            let finalUrl = formData.supportingDocumentUrl;

            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);
                const res = await api.post('/upload/single', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalUrl = res.data.data.url;
            }

            const submitData = { ...formData, supportingDocumentUrl: finalUrl };
            
            if (initialData) {
                await updateIdea.mutateAsync({ id: initialData.id, data: submitData });
                toast.success(initialData.status === 'approved' ? 'Update requested successfully' : 'Idea updated successfully');
            } else {
                await submitIdea.mutateAsync(submitData);
                toast.success('Idea submitted successfully');
            }
            
            onSuccess();
            onClose();
        } catch (error: unknown) {
            console.error('Submit error:', error);
            toast.error(getErrorMessage(error) ?? 'Failed to submit idea');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? (initialData.status === 'approved' ? 'Request Update to Idea' : 'Edit Idea') : 'Submit Innovative Idea'}</DialogTitle>
                </DialogHeader>
                
                {initialData?.status === 'approved' && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm mb-4">
                        <strong>Note:</strong> Since this idea is already approved and public, any changes you make will be submitted as an <em>Update Request</em> and must be reviewed by an admin before taking effect.
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">Title</Label>
                            <Input 
                                id="title"
                                placeholder="E.g., Tech for Seniors" 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="category" className="after:content-['*'] after:ml-0.5 after:text-red-500">Category</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(val) => setFormData({...formData, category: val})}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {INNOVATIVE_IDEA_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">Short Description</Label>
                            <Textarea 
                                id="description"
                                placeholder="Briefly describe your idea..." 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                required
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="article">Detailed Article / Concept (Optional)</Label>
                            <Textarea 
                                id="article"
                                placeholder="Elaborate on the background and vision..." 
                                value={formData.article} 
                                onChange={(e) => setFormData({...formData, article: e.target.value})}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="methodology">Methodology (Optional)</Label>
                            <Textarea 
                                id="methodology"
                                placeholder="How will this be implemented?" 
                                value={formData.methodology} 
                                onChange={(e) => setFormData({...formData, methodology: e.target.value})}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="benefits">Benefits / Impact (Optional)</Label>
                            <Textarea 
                                id="benefits"
                                placeholder="Who benefits and how?" 
                                value={formData.benefits} 
                                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Supporting Document (Optional)</Label>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <Label 
                                        htmlFor="file-upload" 
                                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                    >
                                        <FileUp className="w-4 h-4 mr-2" /> Upload Document
                                    </Label>
                                    <Input 
                                        id="file-upload" 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        disabled={submitting}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                                    />
                                    {(formData.supportingDocumentUrl || selectedFile) && (
                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
                                            <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                                {selectedFile ? selectedFile.name : formData.supportingDocumentUrl?.split('/').pop()}
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={removeFile}
                                                disabled={submitting}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Accepted: PDF, Word, Excel, PPT, TXT, CSV (Max 10MB)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-nss-blue hover:bg-blue-700">
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? (initialData.status === 'approved' ? 'Submit Update Request' : 'Save Changes') : 'Submit Idea'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
