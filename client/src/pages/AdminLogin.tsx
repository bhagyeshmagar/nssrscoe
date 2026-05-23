import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(username, password);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userRole', response.data.role);

            // Redirect based on role
            if (response.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/volunteer');
            }
        } catch (err: any) {
            console.error('Login failed', err);
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-nss-blue/10 to-nss-red/10">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-96 border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-nss-blue rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl text-white">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-nss-blue">NSS Login</h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to manage the NSS website</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter username"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter password"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-nss-blue text-white py-3 rounded-lg hover:bg-blue-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Signing in...
                        </span>
                    ) : 'Sign In'}
                </button>

                <p className="text-center text-gray-400 text-xs mt-6">
                    Default credentials: admin / admin123
                </p>
            </form>
        </div>
    );
}
export default AdminLogin;
