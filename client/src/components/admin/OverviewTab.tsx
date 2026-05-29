import { StatCard } from './Shared';

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
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
                {events.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="py-2 border-b last:border-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                ))}
                {events.length === 0 && <p className="text-gray-500">No events yet</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <p className="text-gray-600">- Go to <strong>Events</strong> tab to manage events</p>
                    <p className="text-gray-600">- Go to <strong>Registrations</strong> to view event volunteers</p>
                    <p className="text-gray-600">- Go to <strong>Gallery</strong> tab to add photos</p>
                    <p className="text-gray-600">- Go to <strong>Members</strong> tab to update team</p>
                    <p className="text-gray-600">- Go to <strong>Settings</strong> to customize homepage</p>
                </div>
            </div>
        </div>
    </div>
);
