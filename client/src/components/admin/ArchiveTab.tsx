import type { AcademicYear } from '../../services/api';
import { AYStatusBadge } from './Shared';

export const ArchiveTab = ({ years }: { years: AcademicYear[] }) => {
    const archived = years.filter(y => y.isArchived);
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Archive</h2>
            {archived.length === 0 && <p className="text-gray-500 text-sm bg-white rounded-xl shadow p-6">No archived academic years yet.</p>}
            <div className="space-y-4">
                {archived.map(ay => (
                    <div key={ay.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-gray-300">
                        <div className="flex items-center gap-3 mb-1"><span className="text-lg font-bold text-gray-600">{ay.label}</span><AYStatusBadge ay={ay} /></div>
                        <p className="text-sm text-gray-500">{ay.startDate} → {ay.endDate}</p>
                        <p className="text-xs text-gray-400 mt-1">All data preserved and read-only</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
