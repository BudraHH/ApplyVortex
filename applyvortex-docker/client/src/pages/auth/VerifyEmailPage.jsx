// src/pages/auth/VerifyEmailPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { authAPI } from '@/services/api/auth.api';
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setError('Invalid verification link. Token is missing.');
                return;
            }

            try {
                await authAPI.verifyEmail(token);
                setStatus('success');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate(ROUTES.LOGIN);
                }, 3000);
            } catch (err) {
                setStatus('error');
                setError(
                    err.response?.data?.message ||
                    'Verification failed. Link may be expired or invalid.'
                );
            }
        };

        verifyEmail();
    }, [token, navigate]);

    // Common Left Side Visual Section
    const VisualSection = () => (
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
                    Email verification
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-5xl xl:text-7xl font-extrabold tracking-tight w-full mb-4"
                >
                    Confirming <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-brand-200">your identity.</span>
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
                    Verifying your email ensures a secure experience and unlocks all features.
                </motion.p>

                {/* Trust badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex border-t border-white/10 gap-4 mt-8 pt-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="font-semibold">One-time verification</p>
                            <p className="text-brand-200 text-sm">Quick & secure</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );

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
                <VisualSection />

                {/* Right Side - Content Section */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center items-center bg-white p-6 sm:p-12 lg:p-14 flex-1">
                    <div className="w-full max-w-lg mx-auto text-center">

                        {/* Loading State */}
                        {status === 'loading' && (
                            <div className="animate-in fade-in duration-500">
                                <div className="flex flex-col lg:hidden gap-4 mb-8">
                                    <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                        Back to Login
                                    </Link>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                            <Sparkles size={12} fill="currentColor" />
                                        </div>
                                        <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                                    </div>
                                </div>

                                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 " />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email...</h2>
                                <p className="text-slate-500 text-sm">Please wait while we confirm your address.</p>
                            </div>
                        )}

                        {/* Success State */}
                        {status === 'success' && (
                            <div className="animate-in zoom-in-95 duration-500">
                                <div className="flex flex-col lg:hidden gap-4 mb-8">
                                    <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                        Back to Login
                                    </Link>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                            <Sparkles size={12} fill="currentColor" />
                                        </div>
                                        <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                                    </div>
                                </div>

                                <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 " />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    Your email has been successfully verified. You can now access all features.
                                </p>

                                <div className="rounded-xl bg-slate-50 text-sm text-slate-500 w-full border border-slate-100 p-4 mb-6">
                                    Redirecting to login page in 3 seconds...
                                </div>

                                <Link to={ROUTES.LOGIN} className="w-full block">
                                    <Button className="w-full h-11 font-semibold shadow-lg shadow-brand-500/20">
                                        Continue to Login
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Error State */}
                        {status === 'error' && (
                            <div className="animate-in slide-in-from-top-4 duration-500">
                                <div className="flex flex-col lg:hidden gap-4 mb-8">
                                    <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-brand-500 transition-colors group">
                                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform mr-4" />
                                        Back to Login
                                    </Link>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                                            <Sparkles size={12} fill="currentColor" />
                                        </div>
                                        <span className="text-2xl font-bold text-slate-900 ">ApplyVortex</span>
                                    </div>
                                </div>

                                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                                    <XCircle className="h-8 w-8 text-red-500 " />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                                <p className="text-slate-500 text-sm mb-6">{error}</p>

                                <div className="w-full rounded-xl bg-red-50 border border-red-100 text-left p-6 mb-8">
                                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">Possible reasons:</p>
                                    <ul className="text-sm text-red-600/80 list-disc list-inside space-y-2">
                                        <li>The verification link has expired</li>
                                        <li>The link has already been used</li>
                                        <li>The link is invalid or incomplete</li>
                                    </ul>
                                </div>

                                <div className="w-full space-y-3">
                                    <Link to={ROUTES.SIGNUP} className="w-full block">
                                        <Button className="w-full h-11 font-semibold">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Resend Verification Email
                                        </Button>
                                    </Link>
                                    <Link to={ROUTES.LOGIN} className="w-full block">
                                        <Button variant="outline" className="w-full h-11 font-semibold border-slate-200">
                                            Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
