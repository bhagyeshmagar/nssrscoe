import { useState, useEffect } from 'react';
import { adminsAPI } from '../../services/api';
import { useFlash } from './Shared';

export const ProfileTab = () => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(true);
    const { msg, flashString: flash } = useFlash();

    const loadProfile = async () => {
        try {
            setLoading(true);
            const { data } = await adminsAPI.getMe();
            setForm({ username: data.data.username, password: '' });
        } catch (e: any) {
            flash('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminsAPI.updateMe(form);
            flash('Profile updated successfully');
            setForm(prev => ({ ...prev, password: '' }));
        } catch (err: any) {
            flash(err.response?.data?.message || 'Error updating profile');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg.text}</div>}

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
                    <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Update Profile</button>
                </form>
            </div>
        </div>
    );
};
