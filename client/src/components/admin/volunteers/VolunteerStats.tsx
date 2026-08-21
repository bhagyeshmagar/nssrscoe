import type { AYStats, AcademicYear } from '../../../services/api';
import { CapBar } from '../Shared';

interface Props {
    stats: AYStats | null;
    selectedAY: AcademicYear | null;
}

export const VolunteerStats = ({ stats, selectedAY }: Props) => {
    if (!stats) return null;
    
    return (
        <div className="bg-white rounded-xl p-4 shadow mb-4">
            <div className="grid grid-cols-4 gap-4 mb-3">
                {[
                    { v: stats.volunteers.regular, l: 'Regular', c: 'text-blue-600' }, 
                    { v: stats.volunteers.backup, l: 'Backup', c: 'text-orange-500' }, 
                    { v: stats.volunteers.total, l: 'Total', c: 'text-gray-700' }, 
                    { v: stats.volunteers.active, l: 'Active', c: 'text-emerald-600' }
                ].map(i => (
                    <div key={i.l} className="text-center">
                        <div className={`text-2xl font-bold ${i.c}`}>{i.v}</div>
                        <div className="text-xs text-gray-500">{i.l}</div>
                    </div>
                ))}
            </div>
            <CapBar regular={stats.volunteers.regular} cap={selectedAY?.volunteerCap ?? 100} />
        </div>
    );
};
