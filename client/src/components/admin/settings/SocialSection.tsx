import type { SiteSettings } from '../../../services/api';

export const SocialSection = ({ formData, setFormData }: { formData: SiteSettings, setFormData: (data: SiteSettings) => void }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-nss-blue">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input type="url" value={formData.socialInstagram || ''} onChange={e => setFormData({ ...formData, socialInstagram: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://instagram.com/nss_jspm_rscoe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                    <input type="url" value={formData.socialFacebook || ''} onChange={e => setFormData({ ...formData, socialFacebook: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://facebook.com/nss_jspm_rscoe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                    <input type="url" value={formData.socialTwitter || ''} onChange={e => setFormData({ ...formData, socialTwitter: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://twitter.com/nss_jspm_rscoe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                    <input type="url" value={formData.socialYoutube || ''} onChange={e => setFormData({ ...formData, socialYoutube: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://youtube.com/@NSSRSCOE" />
                </div>
            </div>
        </div>
    );
};
