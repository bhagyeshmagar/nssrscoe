export interface Achievement {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    date: string;
    academicYearId?: number | null;
    academicYearLabel?: string | null;
    createdAt: string;
    updatedAt?: string;
    updatedById?: number | null;
    deletedAt?: string | null;
    deletedById?: number | null;
}
