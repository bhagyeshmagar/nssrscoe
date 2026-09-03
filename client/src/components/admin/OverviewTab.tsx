import { useMemo } from 'react';
import { StatCard } from './Shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useCurrentAcademicYear, useAcademicYearStats } from '../../hooks/useAcademicYears';
import { useEvents } from '../../hooks/useEvents';
import { useGallery } from '../../hooks/useGallery';
import { useMembers } from '../../hooks/useMembers';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { useAuthStore } from '../../stores/authStore';
import { decodeToken } from '../../services/api';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatDate } from '@/utils/dateFormatter';
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F43F5E'];

export const OverviewTab = () => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.role === 'superadmin' : false;
    
    const { data: currentAY } = useCurrentAcademicYear();
    const { data: stats, isLoading: statsLoading } = useAcademicYearStats(currentAY?.id || null);
    
    const { data: events = [] } = useEvents();
    const { data: gallery = [] } = useGallery();
    const { data: members = [] } = useMembers();
    const { data: pending = { totalPending: 0, events: [], sliderImages: [], innovativeIdeas: [], gallery: [] } } = usePendingApprovals({ enabled: isSuperadmin });

    const loading = statsLoading;

    const pieData = stats?.byDepartment.map(d => ({ name: d.department, value: d.total })) || [];

    const recentEvents = useMemo(() => {
        return [...events]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [events]);

    const eventsByMonth = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            const m = new Date(e.date).toLocaleString('default', { month: 'short' });
            counts[m] = (counts[m] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [events]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">Welcome back. Here is what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/admin/events" className="bg-nss-blue text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors shadow-sm text-sm font-medium">Create Event</Link>
                    <Link to="/admin/core-team" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">Manage Team</Link>
                </div>
            </div>

            {isSuperadmin && pending.totalPending > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
                        <div>
                            <h3 className="text-amber-800 font-semibold">Pending Approvals Required</h3>
                            <p className="text-amber-700 text-sm">
                                You have {pending.totalPending} items waiting for your approval
                                {pending.totalPending > 0 && ' ('}
                                {[
                                    pending.events?.length ? `${pending.events.length} Events` : null,
                                    pending.sliderImages?.length ? `${pending.sliderImages.length} Slider Images` : null,
                                    pending.innovativeIdeas?.length ? `${pending.innovativeIdeas.length} Innovative Ideas` : null,
                                    pending.gallery?.length ? `${pending.gallery.length} Gallery Items` : null
                                ].filter(Boolean).join(', ')}
                                {pending.totalPending > 0 && ')'}
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/approvals" className="flex items-center text-amber-800 font-medium hover:text-amber-900 bg-amber-100/50 px-4 py-2 rounded transition-colors">
                        Review Now <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>
            )}
            
            {isSuperadmin && pending.totalPending === 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md shadow-sm flex items-center text-emerald-700 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                    All caught up! No pending approvals at the moment.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Events" count={events.length} color="blue" />
                <StatCard title="Total Volunteers" count={stats?.volunteers?.total || 0} color="green" />
                <StatCard title="Gallery Items" count={gallery.length} color="purple" />
                <StatCard title="Team Members" count={members.length} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Volunteers by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-80">
                        {loading ? (
                            <div className="text-muted-foreground animate-pulse">Loading charts...</div>
                        ) : pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-muted-foreground">No volunteer data available</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800">Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2">
                            {recentEvents.map(event => (
                                <div key={event.id} className="relative pl-4 border-l-2 border-nss-blue/30 pb-2 last:pb-0">
                                    <div className="absolute w-2 h-2 bg-nss-blue rounded-full -left-[5px] top-1.5 ring-4 ring-white" />
                                    <p className="font-medium text-slate-800 truncate">{event.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                                        {event.approvalStatus === 'pending' && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                                        {event.approvalStatus === 'approved' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">Approved</span>}
                                    </div>
                                </div>
                            ))}
                            {recentEvents.length === 0 && <p className="text-slate-500 text-center py-8">No events yet</p>}
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-1 shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800">Events Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 h-80">
                        {eventsByMonth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={eventsByMonth}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">Not enough data</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
