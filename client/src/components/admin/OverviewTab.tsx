import { StatCard } from './Shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const OverviewTab = ({ events, gallery, members }: { events: any[], gallery: any[], members: any[] }) => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Events" count={events.length} color="blue" />
            <StatCard title="Gallery Items" count={gallery.length} color="green" />
            <StatCard title="Team Members" count={members.length} color="purple" />
            <StatCard title="Upcoming Events" count={events.filter(e => e.type === 'upcoming').length} color="orange" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="pb-4 border-b last:border-0 last:pb-0">
                                <p className="font-medium text-gray-900">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {events.length === 0 && <p className="text-muted-foreground">No events yet</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p className="text-muted-foreground">- Go to <strong className="text-gray-900">Events</strong> tab to manage events</p>
                        <p className="text-muted-foreground">- Go to <strong className="text-gray-900">Registrations</strong> to view event volunteers</p>
                        <p className="text-muted-foreground">- Go to <strong className="text-gray-900">Gallery</strong> tab to add photos</p>
                        <p className="text-muted-foreground">- Go to <strong className="text-gray-900">Members</strong> tab to update team</p>
                        <p className="text-muted-foreground">- Go to <strong className="text-gray-900">Settings</strong> to customize homepage</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);
