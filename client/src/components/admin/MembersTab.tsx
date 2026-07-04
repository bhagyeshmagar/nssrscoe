import { useState, useEffect } from 'react';
import { membersAPI, uploadAPI } from '../../services/api';
import type { MemberData } from '../../services/api';
import ImageCropperModal from '../common/ImageCropperModal';

export const MembersTab = ({ members, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<MemberData>({ name: '', role: '', photoUrl: '', year: '', order: 0 });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    // Image Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');

    useEffect(() => {
        if (editingItem) {
             
            setFormData({ name: editingItem.name, role: editingItem.role, photoUrl: editingItem.photoUrl || '', year: editingItem.year || '', order: editingItem.order || 0 });
            setPhotoPreview(editingItem.photoUrl ? uploadAPI.getFullUrl(editingItem.photoUrl) : '');
            setShowForm(true);
        }
    }, [editingItem, setShowForm]);

    // Memory cleanup for object URLs
    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropImageSrc(reader.result as string);
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let photoUrl = formData.photoUrl;

            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                photoUrl = uploadResult.url;
            }

            const memberData = { ...formData, photoUrl };

            if (editingItem) {
                await membersAPI.update(editingItem.id, memberData);
            } else {
                await membersAPI.create(memberData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving member:', error);
            alert('Error saving member');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this member?')) {
            await membersAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', role: '', photoUrl: '', year: '', order: 0 });
        setSelectedFile(null);
        if (photoPreview && photoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }
        setPhotoPreview('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Team Members</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Member
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Member' : 'Add New Member'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border rounded px-3 py-2" />
                            <div>
                            <select
                                required
                                value={
                                    [
                                        'Institute Officer',
                                        'Principal',
                                        'NSS Program Officer',
                                        'NSS Representatives - Boys Representative',
                                        'NSS Representatives - Girls Representative',
                                        'Department Coordinator - Computer Engineering',
                                        'Department Coordinator - Computer Science and Business Systems',
                                        'Department Coordinator - Information Technology',
                                        'Department Coordinator - Electronics and telecommunication',
                                        'Department Coordinator - Electrical Engineering',
                                        'Department Coordinator - Automation and Robotics',
                                        'Department Coordinator - Mechanical engineering',
                                        'Department Coordinator - Civil Engineering',
                                        'Department Coordinator - Bachelor of Computer Applications department',
                                        'Portfolio Lead - Technical team Lead',
                                        'Portfolio Lead - Event Management team Lead',
                                        'Portfolio Lead - Social Media team Lead',
                                        'Portfolio Lead - Cultural team Lead',
                                        'Portfolio Lead - Graphics team Lead',
                                        'Portfolio Lead - Documentation team Lead',
                                        'Portfolio Lead - PR team Lead',
                                        'Portfolio Lead - Hospitality team Lead',
                                        'Portfolio Lead - Decoration team lead',
                                        ''
                                    ].includes(formData.role) ? formData.role : 'other'
                                }
                                onChange={e => setFormData({ ...formData, role: e.target.value === 'other' ? 'other' : e.target.value })}
                                className="border rounded px-3 py-2 bg-white w-full"
                            >
                                <option value="" disabled>Select Role</option>
                                <optgroup label="Institute Officers">
                                    <option value="Principal">Principal</option>
                                    <option value="NSS Program Officer">NSS Program Officer</option>
                                </optgroup>
                                <optgroup label="NSS Representatives">
                                    <option value="NSS Representatives - Boys Representative">Boys Representative</option>
                                    <option value="NSS Representatives - Girls Representative">Girls Representative</option>
                                </optgroup>
                                <optgroup label="Department Coordinators">
                                    <option value="Department Coordinator - Computer Engineering">Computer Engineering</option>
                                    <option value="Department Coordinator - Computer Science and Business Systems">Computer Science and Business Systems</option>
                                    <option value="Department Coordinator - Information Technology">Information Technology</option>
                                    <option value="Department Coordinator - Electronics and telecommunication">Electronics and telecommunication</option>
                                    <option value="Department Coordinator - Electrical Engineering">Electrical Engineering</option>
                                    <option value="Department Coordinator - Automation and Robotics">Automation and Robotics</option>
                                    <option value="Department Coordinator - Mechanical engineering">Mechanical engineering</option>
                                    <option value="Department Coordinator - Civil Engineering">Civil Engineering</option>
                                    <option value="Department Coordinator - Bachelor of Computer Applications department">Bachelor of Computer Applications department</option>
                                </optgroup>
                                <optgroup label="Portfolio Leads">
                                    <option value="Portfolio Lead - Technical team Lead">Technical team Lead</option>
                                    <option value="Portfolio Lead - Event Management team Lead">Event Management team Lead</option>
                                    <option value="Portfolio Lead - Social Media team Lead">Social Media team Lead</option>
                                    <option value="Portfolio Lead - Cultural team Lead">Cultural team Lead</option>
                                    <option value="Portfolio Lead - Graphics team Lead">Graphics team Lead</option>
                                    <option value="Portfolio Lead - Documentation team Lead">Documentation team Lead</option>
                                    <option value="Portfolio Lead - PR team Lead">PR team Lead</option>
                                    <option value="Portfolio Lead - Hospitality team Lead">Hospitality team Lead</option>
                                    <option value="Portfolio Lead - Decoration team lead">Decoration team lead</option>
                                </optgroup>
                                <option value="other">Other (Custom Institute Officer)</option>
                            </select>
                            {formData.role === 'other' || (![
                                    'Institute Officer',
                                    'Principal',
                                    'NSS Program Officer',
                                    'NSS Representatives - Boys Representative',
                                    'NSS Representatives - Girls Representative',
                                    'Department Coordinator - Computer Engineering',
                                    'Department Coordinator - Computer Science and Business Systems',
                                    'Department Coordinator - Information Technology',
                                    'Department Coordinator - Electronics and telecommunication',
                                    'Department Coordinator - Electrical Engineering',
                                    'Department Coordinator - Automation and Robotics',
                                    'Department Coordinator - Mechanical engineering',
                                    'Department Coordinator - Civil Engineering',
                                    'Department Coordinator - Bachelor of Computer Applications department',
                                    'Portfolio Lead - Technical team Lead',
                                    'Portfolio Lead - Event Management team Lead',
                                    'Portfolio Lead - Social Media team Lead',
                                    'Portfolio Lead - Cultural team Lead',
                                    'Portfolio Lead - Graphics team Lead',
                                    'Portfolio Lead - Documentation team Lead',
                                    'Portfolio Lead - PR team Lead',
                                    'Portfolio Lead - Hospitality team Lead',
                                    'Portfolio Lead - Decoration team lead',
                                    ''
                                ].includes(formData.role)) ? (
                                <input 
                                    type="text" 
                                    placeholder="Enter Custom Role" 
                                    required 
                                    value={formData.role === 'other' ? '' : formData.role} 
                                    onChange={e => setFormData({ ...formData, role: e.target.value })} 
                                    className="border rounded px-3 py-2 mt-2 w-full" 
                                />
                            ) : null}
                            </div>
                            <input type="text" placeholder="Year (e.g., 2024-25)" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="number" placeholder="Priority / Order" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="border rounded px-3 py-2" title="Lower number appears first" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="border rounded px-3 py-2 w-full"
                                />
                            </div>
                        </div>

                        {photoPreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Photo Preview:</p>
                                <img src={photoPreview} alt="Preview" className="h-24 w-24 object-cover rounded-full border" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {members.map((member: any) => (
                    <div key={member.id} className="bg-white p-6 rounded-lg shadow text-center relative group">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                            {member.photoUrl ? (
                                <img src={uploadAPI.getFullUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">🎥</div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-nss-blue font-medium">{member.role}</p>
                        {member.year && <p className="text-gray-500 text-sm">{member.year}</p>}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                            <button onClick={() => setEditingItem(member)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                            <button onClick={() => handleDelete(member.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No team members. Click "Add Member" to get started.
                    </div>
                )}
            </div>

            <ImageCropperModal
                isOpen={cropModalOpen}
                imageSrc={cropImageSrc}
                aspectRatio={undefined} // Free ratio crop
                onClose={() => setCropModalOpen(false)}
                onCropComplete={(croppedFile) => {
                    setSelectedFile(croppedFile);
                    setPhotoPreview(URL.createObjectURL(croppedFile));
                    setCropModalOpen(false);
                }}
            />
        </div>
    );
};
