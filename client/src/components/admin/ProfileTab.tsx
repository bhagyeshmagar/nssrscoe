import { useState, useEffect } from 'react';
import { useFlash } from './Shared';
import { useProfile, useUpdateProfile } from '../../hooks/useAdmins';

export const ProfileTab = () => {
    const { data: profile, isLoading: loading } = useProfile();
    const { mutateAsync: updateProfile, isPending: isSubmitting } = useUpdateProfile();
    
    const [form, setForm] = useState({ username: '', password: '' });
    const { msg, flash } = useFlash();

    useEffect(() => {
        if (profile) {
            setForm({ username: profile.username, password: '' });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (form.password && form.password.length < 6) {
            flash('err', 'Password must be at least 6 characters');
            return;
        }

        if (form.password && !confirm('Are you sure you want to change your password? You will need to use it on your next login.')) {
            return;
        }

        try {
            await updateProfile(form);
            flash('ok', 'Profile updated successfully');
            setForm(prev => ({ ...prev, password: '' }));
        } catch (err: any) {
            flash('err', err.response?.data?.message || 'Error updating profile');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>
            {msg && (
                <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Username (Email)</label>
                        <input required type="email" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">New Password (Leave blank to keep current)</label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};
