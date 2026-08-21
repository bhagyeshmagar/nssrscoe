import type { SiteSettings } from '../../../services/api';

export const StatsSection = ({ formData, setFormData }: { formData: SiteSettings, setFormData: (data: SiteSettings) => void }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-nss-blue">Statistics Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Stat 1 - Events</label>
                    <input type="text" value={formData.statEventsCount} onChange={e => setFormData({ ...formData, statEventsCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="50+" />
                    <input type="text" value={formData.statEventsLabel} onChange={e => setFormData({ ...formData, statEventsLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Events Conducted" />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Stat 2 - Volunteers</label>
                    <input type="text" value={formData.statVolunteersCount} onChange={e => setFormData({ ...formData, statVolunteersCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="200+" />
                    <input type="text" value={formData.statVolunteersLabel} onChange={e => setFormData({ ...formData, statVolunteersLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Volunteers" />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Stat 3 - Impact</label>
                    <input type="text" value={formData.statImpactCount} onChange={e => setFormData({ ...formData, statImpactCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="1000+" />
                    <input type="text" value={formData.statImpactLabel} onChange={e => setFormData({ ...formData, statImpactLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Lives Impacted" />
                </div>
            </div>
        </div>
    );
};
