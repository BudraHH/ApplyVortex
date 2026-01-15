import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Clock, FileX, Ghost, AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';

const ProblemSection = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const problems = [
        {
            id: "01",
            title: "Automated Rejection",
            desc: "ATS algorithms discard 75% of resumes before a human ever sees them. You're being judged by a keyword matching bot, not a recruiter.",
            stat: "75%",
            statLabel: "Auto-Rejected",
            icon: FileX,
            color: "red"
        },
        {
            id: "02",
            title: "The Black Hole",
            desc: "The average response rate for online applications is under 2%. Ghosting isn't an exception; it's the standard operating procedure.",
            stat: "< 2%",
            statLabel: "Response Rate",
            icon: Ghost,
            color: "orange"
        },
        {
            id: "03",
            title: "Manual Grunt Work",
            desc: "Job seekers spend 20+ hours a week re-typing their resume into clunky legacy portals (Workday, Taleo, etc).",
            stat: "20hrs",
            statLabel: "Wasted/Week",
            icon: Clock,
            color: "amber"
        },
        {
            id: "04",
            title: "Emotional Burnout",
            desc: "The process is designed to be exhausting. Constant rejection without feedback leads to search fatigue and imposter syndrome.",
            stat: "6mo",
            statLabel: "Avg Search",
            icon: TrendingDown,
            color: "red"
        },
        {
            id: "05",
            title: "Zero Feedback Loop",
            desc: "You never know why you were rejected. No insights, no improvements, just silence. It's impossible to iterate when you're flying blind.",
            stat: "0%",
            statLabel: "Feedback Rate",
            icon: AlertTriangle,
            color: "orange"
        }
    ];

    const colorVariants = {
        red: {
            icon: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30",
            stat: "text-red-600",
            border: "border-red-200",
            glow: "shadow-red-500/10",
            bg: "bg-red-50"
        },
        orange: {
            icon: "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30",
            stat: "text-orange-600",
            border: "border-orange-200",
            glow: "shadow-orange-500/10",
            bg: "bg-orange-50"
        },
        amber: {
            icon: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30",
            stat: "text-amber-600",
            border: "border-amber-200",
            glow: "shadow-amber-500/10",
            bg: "bg-amber-50"
        }
    };

    // Scroll-based card switching (desktop only)
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        const index = Math.min(
            Math.floor(latest * problems.length),
            problems.length - 1
        );
        setActiveIndex(index);
    });

    // Get the next 2 problems (wrapping around)
    const getNextProblems = () => {
        const next1 = (activeIndex + 1) % problems.length;
        // const next2 = (activeIndex + 2) % problems.length;
        return [problems[next1]];
    };

    const nextProblems = getNextProblems();

    return (
        <section
            id="problem"
            ref={containerRef}
            className="relative h-auto lg:h-[300vh] bg-gradient-to-b from-slate-50 via-white to-slate-50"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/3 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/3 rounded-full blur-3xl" />
            </div>

            <div className="relative lg:sticky top-0 h-auto lg:h-screen flex flex-col justify-center py-10 md:py-16 lg:py-0 overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 relative">

                    {/* Mobile Layout: Fresh Compact Design */}
                    <div className="lg:hidden">
                        {/* Mobile Header */}
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 mb-3">
                                <div className="w-10 h-0.5 bg-red-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">The Problem</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
                                Hiring is{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                                    broken.
                                </span>
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                High effort, low reward. The deck is stacked against you.
                            </p>
                        </div>

                        {/* Stats Highlight Strip - Horizontal Scroll */}
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 -mx-4 px-4 no-scrollbar">
                            {problems.slice(0, 4).map((item, index) => {
                                const colors = colorVariants[item.color];
                                return (
                                    <div key={index} className="flex-shrink-0 bg-white rounded-xl p-3 border border-slate-200 shadow-sm min-w-[120px]">
                                        <div className={`text-2xl font-bold ${colors.stat} mb-1`}>{item.stat}</div>
                                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{item.statLabel}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Compact Problem List */}
                        <div className="space-y-2">
                            {problems.map((item, index) => {
                                const colors = colorVariants[item.color];
                                return (
                                    <div key={index} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${colors.icon} flex items-center justify-center shrink-0`}>
                                            <item.icon size={16} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                                            <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                                        </div>
                                        <div className={`text-base font-bold ${colors.stat} shrink-0`}>{item.stat}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop Layout: Sticky Scroll */}
                    {/* Desktop Layout: Sticky Scroll */}
                    <div className="hidden lg:grid grid-cols-2 gap-16 items-center min-h-[500px]">

                        {/* Left: Sticky Header */}
                        <div className="self-center">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2.5 py-2.5 mb-5"
                            >
                                <div className="w-16 h-0.5 bg-red-700" />
                                <span className="text-xs font-bold uppercase tracking-widest text-red-500">The Problem</span>
                            </motion.div>


                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5"
                            >
                                The hiring process is{' '}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
                                    fundamentally flawed.
                                </span>
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-slate-500 text-lg leading-relaxed max-w-md mb-8"
                            >
                                You're playing a game where the rules are rigged against you. High effort, low reward. It's time to stop playing by their rules.
                            </motion.p>

                            {/* Code Block */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-slate-900 rounded-2xl p-6 font-mono text-xs border border-slate-800 shadow-2xl shadow-slate-900/50 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
                                <div className="flex gap-2 mb-4 border-b border-slate-700/50 pb-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                    <span className="ml-auto text-slate-600 text-[10px]">broken_hiring.js</span>
                                </div>
                                <div className="space-y-1.5 text-slate-400 relative">
                                    <p><span className="text-purple-400">while</span> <span className="text-slate-500">(</span><span className="text-cyan-400">searching</span><span className="text-slate-500">)</span> {"{"}</p>
                                    <p className="pl-4"><span className="text-yellow-400">apply</span><span className="text-slate-500">(</span><span className="text-green-400">manual_entry</span><span className="text-slate-500">);</span></p>
                                    <p className="pl-4"><span className="text-yellow-400">wait</span><span className="text-slate-500">(</span><span className="text-orange-400">weeks</span><span className="text-slate-500">);</span></p>
                                    <p className="pl-4"><span className="text-purple-400">throw</span> <span className="text-purple-400">new</span> <span className="text-red-400">Error</span><span className="text-slate-500">(</span><span className="text-red-400">"Ghosted"</span><span className="text-slate-500">);</span></p>
                                    <p>{"}"}</p>
                                </div>
                            </motion.div>

                            {/* Progress Indicator */}
                            <div className="mt-8 flex items-center gap-2">
                                {problems.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex
                                            ? `flex-1 bg-gradient-to-r from-red-500 to-orange-500`
                                            : 'w-1.5 bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right: Problem Cards with Scroll Animation */}
                        {/* Right: Active Card + Previews */}
                        <div className="relative flex flex-col gap-6 h-full justify-center">
                            {/* Active Card */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Up Next</p>
                                {nextProblems.map((item, i) => {
                                    const colors = colorVariants[item.color];
                                    return (
                                        <motion.div
                                            key={`${activeIndex}-${i}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-default grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                                        >
                                            <div className={`w-10 h-10 rounded-lg bg-slate-100 group-hover:${colors.icon.split(" ")[0]} group-hover:${colors.icon.split(" ")[1]} flex items-center justify-center text-slate-400 group-hover:text-white transition-all duration-300`}>
                                                <item.icon size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 group-hover:text-slate-900 text-sm transition-colors">{item.title}</h4>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.statLabel}</div>
                                            </div>
                                            <div className="ml-auto text-xs font-bold text-slate-300 group-hover:text-slate-500 transition-colors">
                                                {item.id}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="relative min-h-[380px]">
                                <AnimatePresence mode="wait">
                                    {problems.map((item, index) => {
                                        if (index !== activeIndex) return null;
                                        const colors = colorVariants[item.color];

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -50 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 50 }}
                                                transition={{ duration: 0.4, ease: "circOut" }}
                                                className={`bg-white rounded-2xl p-10 border ${colors.border} shadow-2xl ${colors.glow} relative overflow-hidden h-full`}
                                            >
                                                {/* Glow */}
                                                <div className={`absolute top-0 right-0 w-64 h-64 ${colors.bg} rounded-full blur-3xl opacity-40`} />

                                                <div className="relative z-10">
                                                    <div className="flex items-start justify-between mb-8">
                                                        <div className={`w-16 h-16 rounded-2xl ${colors.icon} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
                                                            <item.icon size={32} strokeWidth={2} />
                                                        </div>
                                                        <span className="font-mono text-6xl font-bold text-slate-100 select-none">
                                                            {item.id}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-slate-500 text-lg leading-relaxed mb-8">
                                                        {item.desc}
                                                    </p>

                                                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                                                        <div className={`text-5xl font-bold ${colors.stat} tracking-tight`}>
                                                            {item.stat}
                                                        </div>
                                                        <div className="text-sm font-mono text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg">
                                                            {item.statLabel}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Up Next Previews */}

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
