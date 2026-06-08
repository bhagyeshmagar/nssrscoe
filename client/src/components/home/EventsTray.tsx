import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { EventData } from '../../services/api';

interface EventsTrayProps {
    title: string;
    events: EventData[];
    emptyMessage?: string;
    className?: string;
}

export const EventsTray: React.FC<EventsTrayProps> = ({ title, events, emptyMessage = "No events to display", className = "" }) => {
    return (
        <Card className={`overflow-hidden flex flex-col h-[500px] border-t-4 border-t-nss-red shadow-lg ${className}`}>
            <CardHeader className="bg-gray-50 border-b pb-3 pt-4">
                <CardTitle className="text-xl font-bold text-nss-blue flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-nss-red" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative bg-white group">
                {events.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 italic p-6 text-center">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="absolute w-full animate-marquee-up group-hover:[animation-play-state:paused] flex flex-col">
                        {/* Render the list twice for seamless looping */}
                        {[...events, ...events].map((event, index) => (
                            <Link 
                                to={`/events/${event.id}`} 
                                key={`${event.id}-${index}`}
                                className="block border-b border-gray-100 hover:bg-red-50 transition-colors duration-200"
                            >
                                <div className="p-4 flex flex-col gap-2">
                                    <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                                        {event.title}
                                    </h4>
                                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-nss-red" />
                                            <span>
                                                {new Date(event.date).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
