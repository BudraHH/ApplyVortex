// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Mail, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { authAPI } from '@/services/api/auth.api';
import { Input } from '@/components/ui/Input';
import { Button } from "@/components/ui/Button";
import { Label } from '@/components/ui/Label';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
    });

    const email = watch('email');

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            await authAPI.forgotPassword(data.email);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Success State
    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans relative overflow-hidden p-4">
                {/* Dark mode ambient glow */}
                <div className="hidden absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="hidden absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center justify-center w-full max-w-md bg-white rounded-2xl shadow-2xl text-center p-8"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                        <Mail className="h-8 w-8 text-green-600 " />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Check your email</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                        We've sent a password reset link to<br />
                        <span className="font-semibold text-slate-900 ">{email}</span>
                    </p>

                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl text-left p-6 mb-6">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Next Steps</p>
                        <ol className="space-y-3 text-sm text-slate-600 ">
                            <li className="flex items-start gap-3">
                                <div className="min-w-[20px] h-5 flex items-center justify-center bg-brand-100 text-brand-700 font-bold rounded-full text-xs">1</div>
                                Check your inbox (and spam folder)
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="min-w-[20px] h-5 flex items-center justify-center bg-brand-100 text-brand-700 font-bold rounded-full text-xs">2</div>
                                Click the reset link in the email
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="min-w-[20px] h-5 flex items-center justify-center bg-brand-100 text-brand-700 font-bold rounded-full text-xs">3</div>
                                Create a new password
                            </li>
                        </ol>
                    </div>

                    <Link to={ROUTES.LOGIN} className="w-full">
                        <Button variant="outline" className="w-full h-11 font-semibold text-slate-700 border-slate-200 ">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                        </Button>
                    </Link>

                    <p className="mt-6 text-sm text-slate-400 ">
                        Didn't receive it?{' '}
                        <button
                            onClick={() => setSuccess(false)}
                            className="font-semibold text-brand-600  hover:text-brand-700  underline underline-offset-2"
                        >
                            Try again
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    // Form State
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
                            Recover access
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl xl:text-7xl font-extrabold tracking-tight w-full mb-4"
                        >
                            Reset your <br />
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
                            Enter your email address and we'll send you a secure link to reset your password.
                        </motion.p>

                        {/* Security note */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex border-t border-white/10 mt-8 pt-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold">Secure Link</p>
                                    <p className="text-brand-200 text-sm">Expires in 1 hour</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center items-center bg-white p-6 sm:p-12 lg:p-14 flex-1">
                    <div className="w-full max-w-lg mx-auto">
                        {/* Logo for mobile/tablet */}
                        <div className="flex flex-col lg:hidden gap-2 mb-8">
                            <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                Back to Login
                            </Link>
                            <div className="flex items-center lg:hidden gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                    <Sparkles size={12} fill="currentColor" />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                            </div>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Forgot password?</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            No worries. Enter your email and we'll send you a reset link.
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
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-lg shadow-brand-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <span>Send reset link</span>
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-slate-500 text-sm mt-8">
                            Remember your password?{' '}
                            <Link to={ROUTES.LOGIN} className="text-brand-700 font-semibold hover:underline transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
