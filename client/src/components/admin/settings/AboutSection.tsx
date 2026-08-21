import type { SiteSettings } from '../../../services/api';
import { uploadAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface Props {
    formData: SiteSettings;
    setFormData: (data: SiteSettings) => void;
    uploadingTeamPhoto: boolean;
    setUploadingTeamPhoto: (v: boolean) => void;
    setCropImageSrc: (src: string) => void;
    setCropAspect: (aspect: number | undefined) => void;
    setCropCallback: (cb: (file: File) => void) => void;
    setCropModalOpen: (open: boolean) => void;
}

export const AboutSection = ({ formData, setFormData, uploadingTeamPhoto, setUploadingTeamPhoto, setCropImageSrc, setCropAspect, setCropCallback, setCropModalOpen }: Props) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-nss-blue">About Content</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                    <textarea value={formData.aboutMission} onChange={e => setFormData({ ...formData, aboutMission: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="NSS aims to provide hands on experience..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Our History (Vision)</label>
                    <textarea value={formData.aboutHistory} onChange={e => setFormData({ ...formData, aboutHistory: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Established in..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NSS Team Photo</label>
                    <div className="flex items-center gap-4">
                        {formData.aboutTeamPhoto && (
                            <img src={uploadAPI.getFullUrl(formData.aboutTeamPhoto)} alt="Team Photo" className="h-20 w-32 object-cover rounded shadow" />
                        )}
                        <label className="cursor-pointer">
                            <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                {uploadingTeamPhoto ? 'Uploading...' : (formData.aboutTeamPhoto ? 'Change Photo' : 'Upload Photo')}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTeamPhoto}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            setCropImageSrc(reader.result as string);
                                            setCropAspect(undefined);
                                            setCropCallback(() => async (croppedFile: File) => {
                                                setUploadingTeamPhoto(true);
                                                try {
                                                    const result = await uploadAPI.uploadFile(croppedFile);
                                                    setFormData({ ...formData, aboutTeamPhoto: result.url });
                                                } catch (err) {
                                                    console.error('Error uploading team photo', err);
                                                    toast.error('Error uploading image');
                                                }
                                                setUploadingTeamPhoto(false);
                                            });
                                            setCropModalOpen(true);
                                        };
                                        reader.readAsDataURL(file);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
