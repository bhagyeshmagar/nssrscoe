import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Events = () => {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        // Fetch events from API
        // axios.get('http://localhost:5000/api/events').then(res => setEvents(res.data)).catch(console.error);

        // Mock data
        setEvents([
            {
                id: 1,
                title: 'Village Cleanliness Drive',
                date: '2025-01-15',
                description: 'Cleaning drive and awareness program in adopted village.',
                type: 'upcoming',
                location: 'Adopted Village'
            },
            {
                id: 2,
                title: 'Blood Donation Camp',
                date: '2024-12-01',
                description: 'Annual blood donation drive in association with Red Cross.',
                type: 'past',
                location: 'College Campus',
                reportUrl: '#'
            }
        ]);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                    <div key={event.id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="h-48 bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500">Event Image</span>
                        </div>
                        <div className="p-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${event.type === 'upcoming' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {event.type === 'upcoming' ? 'Upcoming' : 'Past'}
                            </span>
                            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                            <p className="text-sm text-gray-500 mb-2">{format(new Date(event.date), 'MMMM d, yyyy')} | {event.location}</p>
                            <p className="text-gray-700 mb-4">{event.description}</p>
                            {event.type === 'upcoming' && (
                                <button className="w-full bg-nss-red text-white py-2 rounded-md hover:bg-red-700 transition">Register Now</button>
                            )}
                            {event.type === 'past' && event.reportUrl && (
                                <a href={event.reportUrl} className="block text-center w-full border border-nss-blue text-nss-blue py-2 rounded-md hover:bg-blue-50 transition">View Report</a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
