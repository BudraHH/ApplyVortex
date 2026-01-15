// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/services/api/auth.api';

import { Input } from '@/components/ui/Input';
import { Button } from "@/components/ui/Button";
import { Label } from '@/components/ui/Label';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
    });

    const toast = (options) => console.log('Toast:', options);
    const shouldShowWelcome = () => false;

    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [credentials, setCredentials] = useState(null);

    const onSubmit = async (formData) => {
        setError('');
        setIsLoading(true);

        try {
            const response = await authAPI.login({
                email: formData.email,
                password: formData.password,
                rememberMe: rememberMe,
            });

            const { user } = response;

            login(user);

            toast({
                title: 'Login Successful',
                description: `Welcome back, ${user.full_name || user.email}!`,
            });

            if (user.role === 'admin' || user.role === 'super-admin') {
                navigate('/admin/dashboard');
            } else if (shouldShowWelcome()) {
                navigate(ROUTES.PROTECTED.WELCOME);
            } else {
                navigate(ROUTES.DASHBOARD);
            }
        } catch (err) {
            console.error('Login error:', err);
            const detail = err.response?.data?.detail;

            if (detail === 'ACCOUNT_SOFT_DELETED') {
                setCredentials({ email: formData.email, password: formData.password });
                setShowRestoreModal(true);
            } else {
                setError(detail || 'Invalid credentials. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            const response = await authAPI.restore(credentials);
            const { user } = response.data;
            login(user);
            toast({
                title: 'Account Restored',
                description: 'Your account has been successfully reactivated.',
            });
            navigate(ROUTES.DASHBOARD);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to restore account.');
            setShowRestoreModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans relative p-4 sm:p-8 md:p-12 lg:p-24 overflow-y-auto">
            {/* Dark mode ambient glow */}
            <div className="hidden  absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="hidden  absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col lg:flex-row w-full bg-white rounded-xl md:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden relative min-h-[500px] lg:h-[calc(100vh-12rem)]"
            >
                {/* Left Side - Visual Gradient Section */}
                <div className="w-2/3 hidden lg:flex flex-col justify-center p-16 bg-gradient-to-br from-brand-700 via-brand-700 to-brand-600 text-white relative overflow-hidden">
                    {/* Background Texture - Grid */}
                    <div className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                            backgroundSize: '28px 28px'
                        }}
                    />

                    {/* Animated gradient orbs */}
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-brand-400/25 rounded-full blur-3xl pointer-events-none"
                    />

                    <Link to={ROUTES.HOME} className="absolute top-16 left-16 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                        Back to Home
                    </Link>
                    <div className="relative z-10 w-full ">
                        {/* Logo */}


                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-brand-200 text-xl font-medium mb-4"
                        >
                            Welcome back
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl xl:text-7xl font-extrabold tracking-tight w-full mb-4"
                        >
                            Your next opportunity <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-brand-200">awaits you.</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="h-1 w-16 bg-gradient-to-r from-white/80 to-white/20 rounded-full origin-left mb-4"
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="text-brand-100 text-lg leading-relaxed max-w-md"
                        >
                            Sign in to continue your automated job search. Your AI assistant has been working while you were away.
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex border-t border-white/10 gap-4 mt-4 pt-4"
                        >
                            <div>
                                <p className="text-2xl font-bold">2,000+</p>
                                <p className="text-brand-200 text-sm">Active Users</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">50k+</p>
                                <p className="text-brand-200 text-sm">Jobs Applied</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">94%</p>
                                <p className="text-brand-200 text-sm">Success Rate</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center items-center bg-white p-6 sm:p-12 lg:p-14 flex-1">
                    <div className="w-full max-w-lg mx-auto">
                        <div className="flex flex-col lg:hidden gap-4 mb-8">
                            <Link to={ROUTES.HOME} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                Back to Home
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                    <Sparkles size={12} fill="currentColor" />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                            </div>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
                        <p className="text-slate-500 text-sm mb-8">Enter your credentials to continue</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-4 p-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    error={errors.email}
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-700 ">Password</Label>
                                    <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-brand-600 hover:underline hover:text-brand-700  transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        error={errors.password}
                                        {...register('password', { required: 'Password is required' })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400  hover:text-slate-600  transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
                            </div>

                            {/* Remember Me */}
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <div className="h-[18px] w-[18px] rounded border border-slate-300  bg-white  transition-all peer-checked:border-brand-500 peer-checked:bg-brand-500"></div>
                                    <Check size={12} strokeWidth={3} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors ml-4">Remember me</span>
                            </label>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="ml-4">Signing in...</span>
                                    </>
                                ) : (
                                    <span className="">
                                        Sign in
                                    </span>
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-slate-500 text-sm mt-4">
                            Don't have an account?{' '}
                            <Link to={ROUTES.SIGNUP} className="text-brand-700 hover:underline font-semibold hover:text-brand-700 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Account Restoration Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden text-center p-8"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 bg-brand-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-5">
                                <Sparkles className="w-8 h-8 text-brand-600 " />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                Restore Account?
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Your account is in the <span className="font-semibold text-slate-700 ">30-day reactivation period</span>. Would you like to restore your data?
                            </p>
                            <div className="flex w-full gap-4">
                                <Button
                                    onClick={() => setShowRestoreModal(false)}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="flex-1 h-11 border-slate-200 "
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRestore}
                                    disabled={isLoading}
                                    className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Restore"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}