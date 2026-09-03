import { useState } from 'react';
import { decodeToken } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useFlash } from './Shared';
import { useAdmins, useAdminMutations } from '../../hooks/useAdmins';

export const AdminsTab = () => {
    const { data: adminsList = [], isLoading: loading } = useAdmins();
    const { createAdmin, updateAdmin, deleteAdmin, isCreating, isUpdating, isDeleting } = useAdminMutations();
    
    const busy = isCreating || isUpdating || isDeleting;
    
    const [form, setForm] = useState({ username: '', password: '', isSuperadmin: false });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const { msg, flash } = useFlash();

    const currentUser = decodeToken(useAuthStore.getState().token || '');
    const currentAdminId = currentUser?.id;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingId && form.password.length < 6) {
            return flash('err', 'Password must be at least 6 characters.');
        }
        if (editingId && form.password && form.password.length < 6) {
            return flash('err', 'Password must be at least 6 characters.');
        }

        const adminBeingEdited = adminsList.find(a => a.id === editingId);
        if (adminBeingEdited?.isSuperadmin && !form.isSuperadmin) {
            const superadminCount = adminsList.filter(a => a.isSuperadmin).length;
            if (superadminCount <= 1) {
                return flash('err', 'Cannot demote the last superadmin.');
            }
        }

        try {
            const payload: any = { username: form.username, isSuperadmin: form.isSuperadmin };
            if (form.password) payload.password = form.password;

            if (editingId) {
                await updateAdmin({ id: editingId, data: payload });
                flash('ok', 'Admin updated successfully');
            } else {
                await createAdmin(payload);
                flash('ok', 'Admin created successfully');
            }
            setShowForm(false);
            setForm({ username: '', password: '', isSuperadmin: false });
            setEditingId(null);
        } catch (err: any) {
            flash('err', err.response?.data?.message || 'Error saving admin');
        }
    };

    const handleDelete = async (id: number) => {
        if (id === currentAdminId) {
            return flash('err', 'You cannot delete your own account while logged in.');
        }
        
        const adminToDelete = adminsList.find(a => a.id === id);
        if (adminToDelete?.isSuperadmin) {
            const superadminCount = adminsList.filter(a => a.isSuperadmin).length;
            if (superadminCount <= 1) {
                return flash('err', 'Cannot delete the last superadmin account.');
            }
        }

        if (!confirm('Are you sure you want to delete this admin?')) return;
        
        try {
            await deleteAdmin(id);
            flash('ok', 'Admin deleted');
        } catch (err: any) {
            flash('err', err.response?.data?.message || 'Failed to delete admin');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ username: '', password: '', isSuperadmin: false }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ New Admin</button>
            </div>
            {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">{msg.text}</div>}

            {showForm && (
                <div className="mb-6 bg-white rounded-xl shadow p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">{editingId ? 'Edit Admin' : 'Create Admin'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Username (Email)</label>
                            <input required type="email" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Password {editingId && '(Leave blank to keep current)'}</label>
                            <input required={!editingId} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={form.isSuperadmin} onChange={e => setForm({ ...form, isSuperadmin: e.target.checked })} id="superadmin-check" />
                            <label htmlFor="superadmin-check" className="text-sm text-gray-600">Is Superadmin?</label>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={busy} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">{busy ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                            <button type="button" onClick={() => setShowForm(false)} disabled={busy} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                            <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {adminsList.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-800">{a.username}</td>
                                <td className="p-4">
                                    {a.isSuperadmin ? <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Superadmin</span> : <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Admin</span>}
                                </td>
                                <td className="p-4 flex gap-2 justify-end">
                                    <button disabled={busy} onClick={() => { setForm({ username: a.username, password: '', isSuperadmin: a.isSuperadmin }); setEditingId(a.id); setShowForm(true); }} className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50">Edit</button>
                                    <button disabled={busy} onClick={() => handleDelete(a.id)} className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded disabled:opacity-50">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
