import { useState, useEffect, useMemo } from 'react';
import { StatCard } from './Shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { academicYearsAPI } from '../../services/api';
import type { AcademicYear, AYStats, EventData, GalleryItem, MemberData } from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57'];

interface OverviewTabProps {
    events: (EventData & { id: number })[];
    gallery: GalleryItem[];
    members: MemberData[];
    currentAY?: AcademicYear | null;
}

export const OverviewTab = ({ events, gallery, members, currentAY }: OverviewTabProps) => {
    const [stats, setStats] = useState<AYStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentAY) {
            setLoading(true);
            academicYearsAPI.getStats(currentAY.id)
                .then(res => setStats(res.data.data))
                .catch(err => {
                    console.error("Failed to load AY stats", err);
                    toast.error("Failed to load volunteer statistics");
                })
                .finally(() => setLoading(false));
        }
    }, [currentAY]);

    const pieData = stats?.byDepartment.map(d => ({ name: d.department, value: d.total })) || [];

    const recentEvents = useMemo(() => {
        return [...events]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [events]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Events" count={events.length} color="blue" />
                <StatCard title="Total Volunteers" count={stats?.volunteers?.total || 0} color="green" />
                <StatCard title="Gallery Items" count={gallery.length} color="purple" />
                <StatCard title="Team Members" count={members.length} color="orange" />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {recentEvents.map(event => (
                                <div key={event.id} className="pb-4 border-b last:border-0 last:pb-0">
                                    <p className="font-medium text-gray-900">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {recentEvents.length === 0 && <p className="text-muted-foreground">No events yet</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
