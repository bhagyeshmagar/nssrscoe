    import { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { Search, User, BookOpen, GraduationCap, Calendar, ArrowRight, X, FileText } from 'lucide-react';
    import { useAcademicYears } from '@/hooks/useAcademicYears';
    import { INNOVATIVE_IDEA_CATEGORIES } from '@/constants/innovativeIdeaCategories';
    import type { InnovativeIdea } from '@/types/innovativeIdea';
    import { usePublicInnovativeIdeas } from '@/hooks/useInnovativeIdeas';

import { formatDate } from '@/utils/dateFormatter';
    const IdeaCard = ({ idea }: { idea: InnovativeIdea }) => {
        return (
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-gray-200">
                <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-nss-blue">
                            {idea.category}
                        </span>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap bg-white px-2 py-1 rounded border border-gray-100 shadow-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(idea.createdAt)}
                        </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                        {idea.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-5">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                        {idea.description}
                    </p>
                </CardContent>
                
                <CardFooter className="bg-gray-50/80 border-t border-gray-100 p-4 flex flex-col gap-4">
                    <div className="w-full flex items-center justify-between text-xs text-gray-600 bg-white p-3 rounded border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-800">{idea.volunteerName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gray-400" /> {idea.department}</span>
                            <span className="hidden sm:flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-gray-400" /> {idea.collegeYearAtEnrollment} ({idea.academicYearLabel})</span>
                        </div>
                    </div>
                    
                    <Button 
                        asChild
                        variant="ghost" 
                        className="w-full text-nss-blue hover:bg-blue-50 hover:text-blue-700 font-medium"
                    >
                        <Link to={`/innovative-ideas/${idea.id}`}>
                            Read Full Idea <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    export const InnovativeIdeas = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const [categoryFilter, setCategoryFilter] = useState('all');
        const [ayFilter, setAyFilter] = useState('all');
        const [sort, setSort] = useState('newest');

        const { data: academicYears } = useAcademicYears();

        // Debounce search term purely by passing it to the hook via a delayed state or just letting React Query handle it.
        // For simplicity, we just pass searchTerm directly. If a debounce is strictly required for the API, 
        // you could maintain a separate debouncedSearchTerm state. But since React Query deduplicates, it's fine.
        const [debouncedSearch, setDebouncedSearch] = useState('');
        
        useEffect(() => {
            const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
            return () => clearTimeout(timer);
        }, [searchTerm]);

        const { data: ideas = [], isLoading: loading } = usePublicInnovativeIdeas({
            search: debouncedSearch,
            category: categoryFilter,
            academicYearId: ayFilter === 'all' ? undefined : Number(ayFilter),
            sort
        });

        const handleClearFilters = () => {
            setSearchTerm('');
            setCategoryFilter('all');
            setAyFilter('all');
            setSort('newest');
        };

        const hasActiveFilters = searchTerm !== '' || categoryFilter !== 'all' || ayFilter !== 'all' || sort !== 'newest';

        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                            Innovative <span className="text-nss-blue">Ideas</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-gray-500">
                            Discover creative solutions and community development initiatives proposed by our dedicated NSS volunteers.
                        </p>
                    </div>

                    {/* Filters Section */}
                    <Card className="mb-10 shadow-md border-0 bg-white overflow-visible">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        placeholder="Search ideas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-11 border-gray-300 focus:ring-nss-blue focus:border-nss-blue"
                                    />
                                </div>
                                
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-11 border-gray-300">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {INNOVATIVE_IDEA_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={ayFilter} onValueChange={setAyFilter}>
                                    <SelectTrigger className="h-11 border-gray-300">
                                        <SelectValue placeholder="All Academic Years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Academic Years</SelectItem>
                                        {academicYears?.map((ay: any) => (
                                            <SelectItem key={ay.id} value={ay.id.toString()}>{ay.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sort} onValueChange={setSort}>
                                    <SelectTrigger className="h-11 border-gray-300">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="a-z">Title (A-Z)</SelectItem>
                                        <SelectItem value="z-a">Title (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {hasActiveFilters && (
                                <div className="mt-4 flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-gray-500 hover:text-gray-700">
                                        <X className="w-4 h-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Section */}
                    {loading && ideas.length === 0 ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                        </div>
                    ) : ideas.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Ideas Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {hasActiveFilters 
                                    ? "We couldn't find any ideas matching your current filters. Try adjusting them or clear filters to see all ideas." 
                                    : "No innovative ideas have been published yet. Check back soon!"}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" className="mt-6" onClick={handleClearFilters}>
                                    Clear All Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {ideas.map(idea => (
                                <IdeaCard key={idea.id} idea={idea} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    export default InnovativeIdeas;
