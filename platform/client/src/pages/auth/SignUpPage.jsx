// src/pages/auth/SignupPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/services/api/auth.api';
import { toTitleCase } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from "@/components/ui/Button";
import { Label } from '@/components/ui/Label';

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

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
        if (!pwd) return { strength: 0, text: '', color: '' };
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
        if (!acceptedTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await authAPI.signup({
                name: data.name,
                email: data.email,
                password: data.password,
            });

            const { user } = response;

            if (user) {
                login(user);
                navigate(ROUTES.WELCOME);
            } else {
                throw new Error("Authentication failed. No user data received.");
            }

        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.message || 'Signup failed. Please try again.');
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

                    <div className="relative z-10 w-full">

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-brand-200 text-xl font-medium mb-4"
                        >
                            Join the movement
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl xl:text-7xl font-extrabold tracking-tight w-full mb-4"
                        >
                            Start your journey <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-brand-200">to success.</span>
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
                            Create your account and let our AI automation handle the tedious job application process for you.
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex border-t border-white/10 gap-4 mt-4 pt-4"
                        >
                            <div>
                                <p className="text-2xl font-bold">5 min</p>
                                <p className="text-brand-200 text-sm">Setup Time</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">100+</p>
                                <p className="text-brand-200 text-sm">Jobs/Day</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">Free</p>
                                <p className="text-brand-200 text-sm">To Start</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center items-center bg-white p-6 sm:p-12 lg:p-16 flex-1">
                    <div className="w-full max-w-lg mx-auto">
                        {/* Logo for mobile/tablet */}
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
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Create account</h2>
                        <p className="text-slate-500 text-sm mb-8">Join thousands automating their job search</p>

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
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">Full Name</Label>
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    error={errors.name}
                                    {...register('name', { required: 'Name is required' })}
                                    onChange={(e) => {
                                        const val = toTitleCase(e.target.value);
                                        e.target.value = val;
                                        register('name').onChange(e);
                                    }}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>}
                            </div>

                            {/* Email */}
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

                            {/* Password */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 8 characters"
                                        error={errors.password}
                                        {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 chars' } })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400  hover:text-slate-600  transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex-1 h-1.5 bg-slate-200  rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${passwordStrength.barColor}`} style={{ width: `${(passwordStrength.strength / 5) * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-semibold ${passwordStrength.color}`}>{passwordStrength.text}</span>
                                    </div>
                                )}
                                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 ">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Re-enter password"
                                        error={errors.confirmPassword || (!isPasswordMatch && confirmPassword)}
                                        {...register('confirmPassword', {
                                            required: 'Confirm password',
                                            validate: (value) => value === password || 'Passwords do not match',
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400  hover:text-slate-600  transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{errors.confirmPassword.message}</p>}
                            </div>

                            {/* Terms */}
                            <label className="flex items-center cursor-pointer group pt-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    />
                                    <div className="h-[18px] w-[18px] rounded border border-slate-300  bg-white  transition-all peer-checked:border-brand-500 peer-checked:bg-brand-500"></div>
                                    <Check size={12} strokeWidth={3} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-600 ml-4">
                                    I agree to the{' '}
                                    <a href="#" className="text-brand-600  font-semibold hover:underline">Terms</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-brand-600  font-semibold hover:underline">Privacy Policy</a>
                                </span>
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
                                        <span className="ml-4">Creating account...</span>
                                    </>
                                ) : (
                                    <span>Create account</span>
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-slate-500 text-sm mt-4">
                            Already have an account?{' '}
                            <Link to={ROUTES.LOGIN} className="text-brand-700  font-semibold hover:underline hover:text-brand-700  transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
