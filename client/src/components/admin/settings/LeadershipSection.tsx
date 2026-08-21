import type { SiteSettings } from '../../../services/api';
import { uploadAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface Props {
    formData: SiteSettings;
    setFormData: (data: SiteSettings) => void;
    uploadingDirectorPhoto: boolean;
    setUploadingDirectorPhoto: (v: boolean) => void;
    uploadingPoPhoto: boolean;
    setUploadingPoPhoto: (v: boolean) => void;
    setCropImageSrc: (src: string) => void;
    setCropAspect: (aspect: number | undefined) => void;
    setCropCallback: (cb: (file: File) => void) => void;
    setCropModalOpen: (open: boolean) => void;
}

export const LeadershipSection = ({ formData, setFormData, uploadingDirectorPhoto, setUploadingDirectorPhoto, uploadingPoPhoto, setUploadingPoPhoto, setCropImageSrc, setCropAspect, setCropCallback, setCropModalOpen }: Props) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-nss-blue">Leadership Messages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Director's Info */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Director's Info</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Director's Name</label>
                        <input type="text" value={formData.aboutDirectorName || ''} onChange={e => setFormData({ ...formData, aboutDirectorName: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Dr. XYZ" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Director's Message</label>
                        <textarea value={formData.aboutDirectorMessage || ''} onChange={e => setFormData({ ...formData, aboutDirectorMessage: e.target.value })} className="w-full border rounded px-3 py-2" rows={5} placeholder="Message from the Director..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Director's Photo</label>
                        <div className="flex items-center gap-4">
                            {formData.aboutDirectorPhoto && (
                                <img src={uploadAPI.getFullUrl(formData.aboutDirectorPhoto)} alt="Director" className="h-20 w-20 object-cover rounded-full shadow" />
                            )}
                            <label className="cursor-pointer">
                                <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                    {uploadingDirectorPhoto ? 'Uploading...' : (formData.aboutDirectorPhoto ? 'Change Photo' : 'Upload Photo')}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingDirectorPhoto}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCropImageSrc(reader.result as string);
                                                setCropAspect(1);
                                                setCropCallback(() => async (croppedFile: File) => {
                                                    setUploadingDirectorPhoto(true);
                                                    try {
                                                        const result = await uploadAPI.uploadFile(croppedFile);
                                                        setFormData({ ...formData, aboutDirectorPhoto: result.url });
                                                    } catch (err) {
                                                        console.error('Error uploading director photo', err);
                                                        toast.error('Error uploading image');
                                                    }
                                                    setUploadingDirectorPhoto(false);
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

                {/* NSS PO's Info */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">NSS PO's Info</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NSS PO's Name</label>
                        <input type="text" value={formData.aboutPoName || ''} onChange={e => setFormData({ ...formData, aboutPoName: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Prof. ABC" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NSS PO's Message</label>
                        <textarea value={formData.aboutPoMessage || ''} onChange={e => setFormData({ ...formData, aboutPoMessage: e.target.value })} className="w-full border rounded px-3 py-2" rows={5} placeholder="Message from the NSS PO..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NSS PO's Photo</label>
                        <div className="flex items-center gap-4">
                            {formData.aboutPoPhoto && (
                                <img src={uploadAPI.getFullUrl(formData.aboutPoPhoto)} alt="NSS PO" className="h-20 w-20 object-cover rounded-full shadow" />
                            )}
                            <label className="cursor-pointer">
                                <span className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition inline-block">
                                    {uploadingPoPhoto ? 'Uploading...' : (formData.aboutPoPhoto ? 'Change Photo' : 'Upload Photo')}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingPoPhoto}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCropImageSrc(reader.result as string);
                                                setCropAspect(1);
                                                setCropCallback(() => async (croppedFile: File) => {
                                                    setUploadingPoPhoto(true);
                                                    try {
                                                        const result = await uploadAPI.uploadFile(croppedFile);
                                                        setFormData({ ...formData, aboutPoPhoto: result.url });
                                                    } catch (err) {
                                                        console.error('Error uploading PO photo', err);
                                                        toast.error('Error uploading image');
                                                    }
                                                    setUploadingPoPhoto(false);
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
        </div>
    );
};
