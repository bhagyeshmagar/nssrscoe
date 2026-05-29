import { forwardRef } from 'react';
import { User, Hash, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface VisitorPassCardProps {
    visitorPassId: string;
    name: string;
    eventTitle: string;
}

export const VisitorPassCard = forwardRef<HTMLDivElement, VisitorPassCardProps>(({ visitorPassId, name, eventTitle }, ref) => {
    return (
        <div ref={ref} className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border-2 border-nss-blue relative">
            {/* Header */}
            <div className="bg-nss-blue text-white p-4 text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <img src="/assets/nss_logo.jpg" alt="NSS" className="w-10 h-10 rounded-full bg-white p-0.5" />
                    <img src="/assets/rscoe_logo.png" alt="RSCOE" className="w-10 h-10 rounded-full bg-white p-0.5" />
                </div>
                <h3 className="font-bold text-lg tracking-wide uppercase">Visitor Pass</h3>
                <p className="text-xs opacity-90">NSS - JSPM RSCOE</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <img src="/assets/nss_logo.jpg" alt="Watermark" className="w-48 h-48 grayscale" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                        <User className="w-6 h-6 text-nss-red" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Visitor Name</p>
                        <p className="font-bold text-lg text-gray-800">{name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                        <Hash className="w-6 h-6 text-nss-red" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Visitor ID</p>
                        <p className="font-mono font-bold text-xl text-nss-blue tracking-wider">{visitorPassId}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</p>
                        <p className="font-medium text-sm">{format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Event</p>
                        <p className="font-medium text-sm truncate">{eventTitle}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-400">Please present this digital pass at the venue.</p>
            </div>
        </div>
    );
});

VisitorPassCard.displayName = 'VisitorPassCard';
