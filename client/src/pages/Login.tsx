import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, password);
            useAuthStore.getState().setAuth(response.data.token, response.data.role);

            toast.success('Login successful!');
            // Redirect based on role (using window.location to force Navbar reload)
            if (response.data.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/volunteer';
            }
        } catch (err: unknown) {
            console.error('Login failed', err);
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Invalid credentials. Please try again.');
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
                    <p className="text-gray-500 text-sm mt-1">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Email / Username</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                        placeholder="Enter email or username"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-nss-blue focus:border-nss-blue outline-none transition"
                            placeholder="Enter password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
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

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-center text-gray-400 text-xs">
                        <strong>Admin:</strong> Use your admin username
                    </p>
                    <p className="text-center text-gray-400 text-xs mt-1">
                        <strong>Volunteers:</strong> Use your registered email
                    </p>
                </div>
            </form>
        </div>
    );
}
export default Login;
