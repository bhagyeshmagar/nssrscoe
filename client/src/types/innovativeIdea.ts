export interface InnovativeIdea {
    id: number;
    title: string;
    description: string;
    category: string;
    article: string | null;
    methodology: string | null;
    benefits: string | null;
    supportingDocumentUrl: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason: string | null;
    deleteRequested: boolean;
    pendingUpdateData: string | null;
    createdAt: string;
    updatedAt: string;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
    volunteerName: string;
    academicYearLabel: string;
    department: string;
    collegeYearAtEnrollment: string;
}
