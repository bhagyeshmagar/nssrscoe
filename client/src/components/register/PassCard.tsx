import type { EventRegistration } from '../../services/api';

export const PassCard = ({ reg, eventTitle }: { reg: EventRegistration; eventTitle: string }) => (
    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border-2 border-nss-blue">
        <div className="bg-nss-blue text-white p-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <img src="/assets/nss_logo.jpg" alt="NSS" className="w-10 h-10 rounded-full bg-white p-0.5" />
                <img src="/assets/rscoe_logo.png" alt="RSCOE" className="w-10 h-10 rounded-full bg-white p-0.5" />
            </div>
            <h3 className="font-bold text-lg tracking-wide uppercase">Volunteering Pass</h3>
            <p className="text-xs opacity-90">NSS – JSPM RSCOE</p>
        </div>
        <div className="p-6 space-y-3 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                <img src="/assets/nss_logo.jpg" alt="" className="w-48 h-48 grayscale" />
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Volunteer Name</p>
                <p className="font-bold text-xl text-gray-900">{reg.name}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pass ID</p>
                <p className="font-mono font-bold text-2xl text-nss-blue tracking-widest">{reg.visitorPassId}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Event</p>
                <p className="font-semibold text-gray-800 text-sm">{eventTitle}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Department / Year</p>
                <p className="text-sm text-gray-700">{reg.department} · {reg.year}</p>
            </div>
        </div>
        <div className="bg-gray-50 border-t p-3 text-center">
            <p className="text-[10px] text-gray-400">Present this pass at the venue. Valid for registered event only.</p>
        </div>
    </div>
);
