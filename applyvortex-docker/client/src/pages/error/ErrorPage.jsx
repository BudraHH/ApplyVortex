import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, RefreshCw, Terminal } from 'lucide-react';
import { ROUTES } from '@/routes/routes';

const ErrorPage = () => {
    const [dialogueStep, setDialogueStep] = useState(0);

    const dialogues = [
        { id: "SYS-01", text: "CRITICAL ALERT: Unexpected anomaly detected in core render process.", color: "text-red-500" },
        { id: "SYS-02", text: "DIAGNOSTIC: Route integrity compromised. 404/500 Event.", color: "text-amber-500" },
        { id: "AI-NET", text: "Trying automatic restoration protocol... [FAILED]", color: "text-red-400" },
        { id: "ADMIN", text: "Recommendation: Initiate manual system reboot or emergency evacuation.", color: "text-emerald-400" },
    ];

    useEffect(() => {
        if (dialogueStep < dialogues.length) {
            const timer = setTimeout(() => {
                setDialogueStep(prev => prev + 1);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [dialogueStep, dialogues.length]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 font-mono relative overflow-hidden p-2 md:p-3 lg:p-4">
            {/* Dramatic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950" />
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(239, 68, 68, .3) 25%, rgba(239, 68, 68, .3) 26%, transparent 27%, transparent 74%, rgba(239, 68, 68, .3) 75%, rgba(239, 68, 68, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(239, 68, 68, .3) 25%, rgba(239, 68, 68, .3) 26%, transparent 27%, transparent 74%, rgba(239, 68, 68, .3) 75%, rgba(239, 68, 68, .3) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Animated Glitch Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            {/* Main Terminal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="relative z-10 w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl rounded-lg border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
            >
                {/* Terminal Header */}
                <div className="bg-red-500/10 border-b border-red-500/20 flex items-center justify-between p-2 md:p-3 lg:p-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Terminal className="text-red-500 h-5 w-5" />
                        <span className="text-red-500 font-bold tracking-widest uppercase text-sm">System_Failure_Protocol</span>
                    </div>
                    <div className="flex gap-2 md:gap-3 lg:gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-2 md:p-3 lg:p-4">
                    {/* Dialogues */}
                    <div className="font-mono text-sm md:text-base min-h-[160px] mb-2 md:mb-3 lg:mb-4 space-y-2 md:space-y-3 lg:space-y-4">
                        {dialogues.slice(0, dialogueStep + 1).map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-start gap-2 md:gap-3 lg:gap-4"
                            >
                                <span className="text-slate-600 shrink-0 select-none">[{line.id}]</span>
                                <span className={`${line.color} font-medium tracking-wide`}>{line.text}</span>
                            </motion.div>
                        ))}
                        {dialogueStep < dialogues.length && (
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-3 h-5 bg-red-500 ml-2 md:ml-3 lg:ml-4"
                            />
                        )}
                    </div>

                    {/* Actions - Appear after sequence */}
                    <AnimatePresence>
                        {dialogueStep >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid md:grid-cols-2 border-t border-slate-800/50 gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4"
                            >
                                <button
                                    onClick={() => window.location.reload()}
                                    className="group relative overflow-hidden flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-bold tracking-wider uppercase text-sm shadow-lg shadow-red-900/20 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                >
                                    <span className="relative z-10 flex items-center gap-2 md:gap-3 lg:gap-4">
                                        <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
                                        Reboot System
                                    </span>
                                </button>

                                <Link to={ROUTES.HOME} className="w-full">
                                    <button className="w-full h-full flex items-center justify-center bg-transparent border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg transition-all font-bold tracking-wider uppercase text-sm group gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        <Home className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                                        Emergency Evac
                                    </button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Decorative Bottom Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 opacity-20" />
            </motion.div>
        </div>
    );
};

export default ErrorPage;
