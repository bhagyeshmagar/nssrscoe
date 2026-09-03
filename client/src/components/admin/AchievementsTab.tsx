import { useState } from 'react';
import { uploadAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, Trophy, Calendar, BookOpen, RotateCcw } from 'lucide-react';
import { useAdminAchievements, useDeleteAchievement, useRestoreAchievement } from '@/hooks/useAchievements';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { formatDate } from '@/utils/dateFormatter';
import { AchievementFormModal } from './AchievementFormModal';
import { getErrorMessage } from '@/utils/errors';
import type { Achievement } from '@/types/achievement';

export const AchievementsTab = () => {
    const [ayFilter, setAyFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const { data: achievements = [], isLoading } = useAdminAchievements({ academicYearId: ayFilter });
    const { data: academicYears = [] } = useAcademicYears();
    const deleteMutation = useDeleteAchievement();
    const restoreMutation = useRestoreAchievement();

    const handleDelete = (id: number) => {
        if (!window.confirm('Permanently delete this achievement?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Achievement deleted'),
            onError: (err) => toast.error(getErrorMessage(err) ?? 'Delete failed'),
        });
    };

    const handleRestore = (id: number) => {
        if (!window.confirm('Restore this achievement?')) return;
        restoreMutation.mutate(id, {
            onSuccess: () => toast.success('Achievement restored'),
            onError: (err) => toast.error(getErrorMessage(err) ?? 'Restore failed'),
        });
    };

    const openCreate = () => { setSelectedAchievement(null); setModalOpen(true); };
    const openEdit = (a: Achievement) => { setSelectedAchievement(a); setModalOpen(true); };

    return (
        <div className="p-6 space-y-6">
            <Card className="shadow-sm border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Achievements
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Select value={ayFilter} onValueChange={setAyFilter}>
                            <SelectTrigger className="w-44 h-9">
                                <SelectValue placeholder="All Academic Years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Academic Years</SelectItem>
                                {(academicYears as any[]).map((ay: any) => (
                                    <SelectItem key={ay.id} value={String(ay.id)}>{ay.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={openCreate} size="sm" className="gap-1.5">
                            <Plus className="w-4 h-4" /> Add Achievement
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nss-blue" />
                        </div>
                    ) : achievements.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No achievements yet. Add one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {achievements.map((a) => (
                                <div key={a.id} className={`border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white relative ${a.deletedAt ? 'opacity-70 grayscale' : ''}`}>
                                    {a.deletedAt && (
                                        <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded z-10">
                                            Deleted
                                        </div>
                                    )}
                                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                                        <img
                                            src={uploadAPI.getFullUrl(a.imageUrl)}
                                            alt={a.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="font-bold text-gray-900 line-clamp-1">{a.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" /> {formatDate(a.date)}
                                            </span>
                                            {a.academicYearLabel && (
                                                <span className="flex items-center gap-1 text-xs bg-blue-50 text-nss-blue px-2 py-0.5 rounded-full">
                                                    <BookOpen className="w-3 h-3" /> {a.academicYearLabel}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            {!a.deletedAt ? (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="flex-1 gap-1">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)} disabled={deleteMutation.isPending} className="gap-1">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleRestore(a.id)} disabled={restoreMutation.isPending} className="w-full gap-1 border-gray-300 text-gray-700 hover:bg-gray-100">
                                                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AchievementFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => setModalOpen(false)}
                initialData={selectedAchievement}
                academicYears={(academicYears as any[]).map((ay: any) => ({ id: ay.id, label: ay.label }))}
            />
        </div>
    );
};
