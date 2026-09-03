import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import { Eye, EyeOff, LockKeyhole, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onLoginSubmit = async (data: LoginFormData) => {
        setError('');

        try {
            const response = await authAPI.login(data.email, data.password);
            const payload = response.data.data;
            useAuthStore.getState().setAuth(payload.token, payload.role);

            toast.success('Login successful!');
            // Redirect based on role (using window.location to force Navbar reload)
            if (payload.role === 'admin') {
                window.location.assign('/admin');
            } else {
                window.location.assign('/volunteer');
            }
        } catch (err: unknown) {
            console.error('Login failed', err);
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Invalid credentials. Please try again.');
        }
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
                    <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
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
                                {...register('email')}
                                placeholder="Enter email or username"
                                className={`focus-visible:ring-nss-blue ${errors.email ? 'border-red-500' : ''}`}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    placeholder="Enter password"
                                    className={`pr-10 focus-visible:ring-nss-blue ${errors.password ? 'border-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-nss-blue hover:bg-blue-900 transition-colors"
                        >
                            {isSubmitting ? (
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
