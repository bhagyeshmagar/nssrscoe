import type { SiteSettings } from '../../../services/api';

export const HeroSection = ({ formData, setFormData }: { formData: SiteSettings, setFormData: (data: SiteSettings) => void }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-nss-blue">Hero Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" value={formData.heroTitle} onChange={e => setFormData({ ...formData, heroTitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="NOT ME, BUT YOU" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input type="text" value={formData.heroSubtitle} onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="National Service Scheme - JSPM RSCOE" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                    <input type="text" value={formData.heroCta} onChange={e => setFormData({ ...formData, heroCta: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Join Us / Register" />
                </div>
            </div>
        </div>
    );
};
