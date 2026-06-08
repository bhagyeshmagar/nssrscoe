import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import { Eye, EyeOff, LockKeyhole, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
            type LoginPayload = { token: string; role: 'admin' | 'volunteer'; data?: { token: string; role: 'admin' | 'volunteer' } };
            const rawData = response.data as unknown as LoginPayload;
            const payload = rawData.data || rawData;
            useAuthStore.getState().setAuth(payload.token, payload.role);

            toast.success('Login successful!');
            // Redirect based on role (using window.location to force Navbar reload)
            if (payload.role === 'admin') {
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
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-nss-blue/10 to-nss-red/10 p-4">
            <Card className="w-full max-w-md shadow-xl border-gray-100">
                <CardHeader className="text-center space-y-4">
                    <div className="w-16 h-16 bg-nss-blue rounded-full mx-auto flex items-center justify-center shadow-inner">
                        <LockKeyhole className="text-white w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-nss-blue">NSS Login</CardTitle>
                        <CardDescription>Sign in to access your dashboard</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-50">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email / Username</Label>
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                placeholder="Enter email or username"
                                required
                                className="focus-visible:ring-nss-blue"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    className="pr-10 focus-visible:ring-nss-blue"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-nss-blue hover:bg-blue-900 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col text-center text-xs text-muted-foreground border-t bg-gray-50/50 px-6 py-4 rounded-b-xl">
                    <p><strong>Admin:</strong> Use your admin username</p>
                    <p className="mt-1"><strong>Volunteers:</strong> Use your registered email</p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;
