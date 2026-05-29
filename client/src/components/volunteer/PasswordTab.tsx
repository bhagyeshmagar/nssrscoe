import { useState } from 'react';
import { volunteerProfileAPI } from '../../services/api';

export const PasswordTab = ({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) => {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        try {
            await volunteerProfileAPI.updatePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password change error:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Update Password</h2>
                <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-nss-blue hover:underline"
                >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
            </div>

            {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-6 py-2 bg-nss-blue text-white rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                    >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            )}
        </div>
    );
};
