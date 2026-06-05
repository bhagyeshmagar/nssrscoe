import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, uploadAPI } from '../services/api';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    imageUrl?: string;
    type: 'upcoming' | 'today' | 'past';
}

const UpcomingEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventsAPI.getAll();
                const upcoming = (response.data.data || []).filter((e: Event) => e.type === 'upcoming');
                setEvents(upcoming);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
            setLoading(false);
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Upcoming Events</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Upcoming Events</h1>
                <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                    Join us in our upcoming initiatives. Click on an event to view details and register.
                </p>

                {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <Link to={`/events/${event.id}`} key={event.id} className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="h-48 overflow-hidden relative">
                                    {event.imageUrl ? (
                                        <img src={uploadAPI.getFullUrl(event.imageUrl)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-nss-blue to-nss-red flex items-center justify-center text-white text-4xl">
                                            📅
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-nss-blue shadow">
                                        UPCOMING
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-nss-blue transition">{event.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(event.date), 'MMMM d, yyyy')}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <MapPin className="w-4 h-4 text-nss-red" />
                                        {event.location}
                                    </div>
                                    <span className="flex items-center text-nss-red font-semibold text-sm">
                                        View Details & Register <ArrowRight className="w-4 h-4 ml-1" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow">
                        No upcoming events scheduled at the moment. Please check back later!
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingEvents;
