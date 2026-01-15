import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { ROUTES } from '@/routes/routes';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 font-sans text-white selection:bg-brand-500/30 section-grid-pattern">
            {/* Glitch Animation */}
            <style>{`
                @keyframes glitch {
                    0% { transform: translate(0) }
                    20% { transform: translate(-2px, 2px) }
                    40% { transform: translate(-2px, -2px) }
                    60% { transform: translate(2px, 2px) }
                    80% { transform: translate(2px, -2px) }
                    100% { transform: translate(0) }
                }
                .glitch-text {
                    animation: glitch 3s infinite;
                    text-shadow:
                        2px 2px 0 rgba(239, 68, 68, 0.6),
                       -2px -2px 0 rgba(59, 130, 246, 0.6);
                }
            `}</style>

            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/80 via-slate-950 to-slate-950" />

            {/* Glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/5 blur-[120px]" />

            {/* Content */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.15 }
                    }
                }}
                className="relative z-10 max-w-3xl text-center px-2 md:px-3 lg:px-4"
            >
                {/* 404 */}
                <motion.h1
                    className="glitch-text select-none bg-gradient-to-b from-slate-200 to-slate-800 bg-clip-text text-[10rem] font-black leading-none tracking-tighter text-transparent md:text-[14rem]"
                >
                    404
                </motion.h1>

                {/* Text */}
                <div className="relative z-20 space-y-2 md:space-y-3 lg:space-y-4">
                    <motion.h2
                        initial={{ y: 60 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-3xl font-bold tracking-tight md:text-5xl"
                    >
                        <span className="text-brand-400">Career Path</span> Not Found
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="mx-auto max-w-lg border-l-2 border-brand-500/30 text-left text-lg leading-relaxed text-slate-400 md:text-xl pl-2 md:pl-3 lg:pl-4"
                    >
                        <span className="block font-mono text-xs uppercase tracking-widest text-brand-400 mb-2 md:mb-3 lg:mb-4">
                            Error: Route_Mismatched
                        </span>
                        The application or page you are looking for has been archived,
                        moved, or never existed in this workspace.
                    </motion.p>

                    {/* Actions */}
                    <motion.div className="flex flex-col items-center justify-center sm:flex-row gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                        <Link to={ROUTES.DASHBOARD} className="w-full sm:w-auto">
                            <button className="flex w-full items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-500 hover:shadow-brand-500/40 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                <Home className="h-5 w-5" />
                                Return to Dashboard
                            </button>
                        </Link>

                        <button
                            onClick={() => navigate(-1)}
                            className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white sm:w-auto gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Go Back
                        </button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="pointer-events-none absolute bottom-0 left-0 flex w-full items-end justify-between font-mono text-xs opacity-20 p-2 md:p-3 lg:p-4">
                <div className="flex flex-col gap-2 md:gap-3 lg:gap-4">
                    <span className="text-brand-400">SYS_STATUS: STABLE</span>
                    <span>LOC: UNKNOWN_VECTOR</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <FileQuestion className="h-4 w-4" />
                    <span>APPLY_FORGE_V1.0</span>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
