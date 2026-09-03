import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, BookOpen } from 'lucide-react';
import { uploadAPI } from '@/services/api';
import { usePublicAchievements } from '@/hooks/useAchievements';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { formatDate } from '@/utils/dateFormatter';
import type { Achievement } from '@/types/achievement';

const AchievementCard = ({ a }: { a: Achievement }) => (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-gray-200 overflow-hidden">
        {/* Large image */}
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
            <img
                src={uploadAPI.getFullUrl(a.imageUrl)}
                alt={a.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
        </div>
        <CardContent className="flex flex-col flex-1 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {a.academicYearLabel && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        <BookOpen className="w-3 h-3" /> {a.academicYearLabel}
                    </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(a.date)}
                </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">{a.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{a.description}</p>
        </CardContent>
    </Card>
);

const Achievements = () => {
    const [ayFilter, setAyFilter] = useState('all');
    const [sort, setSort] = useState('newest');

    const { data: achievements = [], isLoading } = usePublicAchievements({ academicYearId: ayFilter });
    const { data: academicYears } = useAcademicYears();

    const sorted = [...achievements].sort((a, b) => {
        if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const hasFilters = ayFilter !== 'all' || sort !== 'newest';

    const clearFilters = () => { setAyFilter('all'); setSort('newest'); };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        Our <span className="text-nss-blue">Achievements</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-500">
                        Celebrating the milestones, awards, and recognitions earned by NSS RSCOE across the years.
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-10 shadow-sm border-0 bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[180px]">
                                <Select value={ayFilter} onValueChange={setAyFilter}>
                                    <SelectTrigger className="h-11 border-gray-300">
                                        <SelectValue placeholder="All Academic Years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Academic Years</SelectItem>
                                        {(academicYears as any[])?.map((ay: any) => (
                                            <SelectItem key={ay.id} value={String(ay.id)}>{ay.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <Select value={sort} onValueChange={setSort}>
                                    <SelectTrigger className="h-11 border-gray-300">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {hasFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Achievements Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {hasFilters ? 'Try adjusting the filters.' : 'No achievements published yet.'}
                        </p>
                        {hasFilters && (
                            <Button variant="outline" className="mt-6" onClick={clearFilters}>Clear Filters</Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {sorted.map(a => <AchievementCard key={a.id} a={a} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Achievements;
