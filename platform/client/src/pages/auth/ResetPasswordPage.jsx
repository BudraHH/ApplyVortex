// src/pages/auth/ResetPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Eye, EyeOff, Check, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { authAPI } from '@/services/api/auth.api';

import { Input } from '@/components/ui/Input';
import { Button } from "@/components/ui/Button";
import { Label } from '@/components/ui/Label';

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
    });

    const password = watch('password');
    const confirmPassword = watch('confirmPassword');

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, text: '', color: '', barColor: '' };
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

        if (strength <= 2) return { strength, text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
        if (strength <= 3) return { strength, text: 'Medium', color: 'text-yellow-500', barColor: 'bg-yellow-500' };
        return { strength, text: 'Strong', color: 'text-green-500', barColor: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);
    const isPasswordMatch = confirmPassword && password === confirmPassword;

    const onSubmit = async (data) => {
        if (!token) {
            setError('Invalid or expired reset link');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authAPI.resetPassword(token, data.password);
            setSuccess(true);
            setTimeout(() => {
                navigate(ROUTES.LOGIN);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    // Success State
    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans relative p-4 sm:p-8 md:p-12 lg:p-24 overflow-y-auto">
                {/* Dark mode ambient glow */}
                <div className="hidden absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="hidden absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center justify-center w-full max-w-md bg-white rounded-2xl shadow-2xl text-center p-8"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600 " />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Password Reset!</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        Your password has been changed successfully. You can now login with your new credentials.
                    </p>

                    <div className="rounded-xl bg-slate-50 text-sm text-slate-500 w-full border border-slate-100 p-4 mb-6">
                        Redirecting to login page in 3 seconds...
                    </div>

                    <Link to={ROUTES.LOGIN} className="w-full">
                        <Button className="w-full h-11 font-semibold">
                            Continue to Login
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Form State
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans relative p-4 sm:p-8 md:p-12 lg:p-24 overflow-y-auto">
            {/* Dark mode ambient glow */}
            <div className="hidden absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="hidden absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

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
                    <Link to={ROUTES.LOGIN} className="absolute top-16 left-16 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                        Back to Login
                    </Link>

                    <div className="relative z-10 w-full">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-brand-200 text-xl font-medium mb-4"
                        >
                            Secure access
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl xl:text-7xl font-extrabold tracking-tight w-full mb-4"
                        >
                            Create a new <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-brand-200">password.</span>
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
                            Choose a strong, unique password to keep your account secure.
                        </motion.p>

                        {/* Security tips */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex border-t border-white/10 gap-4 mt-8 pt-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold">Strong Password</p>
                                    <p className="text-brand-200 text-sm">8+ characters</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center items-center bg-white p-6 sm:p-12 lg:p-14 flex-1">
                    <div className="w-full max-w-lg mx-auto">
                        {/* Logo for mobile/tablet */}
                        <div className="flex flex-col lg:hidden gap-4 mb-8">
                            <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                Back to Login
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                    <Sparkles size={12} fill="currentColor" />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                            </div>
                        </div>



                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Set new password</h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Your new password must be different from previously used passwords.
                        </p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-6 p-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* New Password */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">New Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 8 characters"
                                        error={errors.password}
                                        className="pr-12"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: { value: 8, message: 'Min 8 chars' },
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                message: 'Must contain Uppercase, Lowercase, Number',
                                            },
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {password && (
                                    <div className="space-y-4 mt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-300 ${passwordStrength.barColor}`} style={{ width: `${(passwordStrength.strength / 5) * 100}%` }} />
                                            </div>
                                            <span className={`text-xs font-semibold ${passwordStrength.color}`}>{passwordStrength.text}</span>
                                        </div>
                                        <div className="text-xs space-y-2">
                                            <div className={password.length >= 8 ? 'text-green-500 flex items-center gap-2' : 'text-slate-400 flex items-center gap-2'}>
                                                {password.length >= 8 ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-current"></div>} At least 8 characters
                                            </div>
                                            <div className={/[A-Z]/.test(password) ? 'text-green-500 flex items-center gap-2' : 'text-slate-400 flex items-center gap-2'}>
                                                {/[A-Z]/.test(password) ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-current"></div>} One uppercase letter
                                            </div>
                                            <div className={/\d/.test(password) ? 'text-green-500 flex items-center gap-2' : 'text-slate-400 flex items-center gap-2'}>
                                                {/\d/.test(password) ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-current"></div>} One number
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {errors.password && <p className="text-xs text-red-500 mt-2">{errors.password.message}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Re-enter password"
                                        error={errors.confirmPassword || (!isPasswordMatch && confirmPassword)}
                                        className="pr-12"
                                        {...register('confirmPassword', {
                                            required: 'Please confirm password',
                                            validate: (value) => value === password || 'Passwords do not match',
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-500 mt-2">{errors.confirmPassword.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 text-sm font-semibold mt-4 shadow-lg shadow-brand-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
