import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { FileSignature, Search, Rocket, ChevronRight, Sparkles, Globe, BrainCircuit, UploadCloud, MonitorCheck, CheckCircle2, MapPin, Shield, Zap, Clock } from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { Link } from 'react-router-dom';

const BlueprintVisual = () => (
    <div className="w-full h-full bg-slate-50/50 border border-slate-200/60 rounded-xl overflow-hidden flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] backdrop-blur-sm">
        {/* Header */}
        <div className="bg-white/80 px-4 py-2.5 border-b border-slate-200/60 flex justify-between items-center shrink-0 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                Search Blueprint
            </span>
            <div className="flex gap-1.5 opacity-40">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
        </div>

        {/* UI Body */}
        <div className="p-4 flex flex-col gap-4 flex-1 justify-center relative">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Target Roles Group */}
            <div className="relative z-10">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Target Roles</label>
                <div className="flex flex-wrap gap-1.5">
                    {["Frontend Dev", "React Engineer", "UI Architect", "Full Stack"].map((role, i) => (
                        <motion.span
                            key={i}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border shadow-sm transition-all duration-300 ${i % 2 === 0
                                ? 'bg-brand-50/80 text-brand-600 border-brand-100/80 shadow-brand-100/20'
                                : 'bg-white/90 text-slate-600 border-slate-200/80'
                                }`}
                        >
                            {role}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Salary Floor */}
            <div className="relative z-10">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Salary Floor</label>
                <div className="flex items-center justify-between bg-white/90 border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300">
                    <span className="text-slate-500 text-xs font-medium">$</span>
                    <span className="text-slate-800 text-xs font-bold tracking-tight">140,000</span>
                    <span className="text-slate-400 text-[10px] font-medium">/yr</span>
                </div>
            </div>

            {/* Location & Mode Group */}
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Markets</label>
                    <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">Global</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 rounded-xl p-2.5 border border-slate-200/80 shadow-sm">
                    <div className="flex gap-1.5 flex-1 flex-wrap">
                        {["Chennai", "Bengaluru", "Remote"].map((loc, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-[4px] text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                                {loc}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-auto relative z-10">
                <span className="text-xs font-bold text-slate-700">Auto-Apply Mode</span>
                <div className="w-9 h-5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full relative shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)] ring-1 ring-emerald-500/20">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
            </div>
        </div>
    </div>
);

const DiscoveryVisual = () => (
    <div className="relative w-full h-full flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center px-1 mb-0.5">
            <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning Network</span>
            </div>
            <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">42/sec</span>
        </div>
        <div className="relative">
            {/* Fade overlay for infinite scroll feel */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

            <div className="space-y-2">
                {[
                    { bg: "bg-gradient-to-br from-blue-500 to-blue-600", text: "Senior React Dev", time: "2m", match: "98%", shadow: "shadow-blue-200" },
                    { bg: "bg-gradient-to-br from-indigo-500 to-indigo-600", text: "UI Engineer", time: "5m", match: "95%", shadow: "shadow-indigo-200" },
                    { bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", text: "Frontend Lead", time: "12m", match: "92%", shadow: "shadow-emerald-200" },
                    { bg: "bg-gradient-to-br from-violet-500 to-violet-600", text: "Full Stack Eng", time: "15m", match: "89%", shadow: "shadow-violet-200" },
                    { bg: "bg-gradient-to-br from-rose-500 to-rose-600", text: "Product Designer", time: "18m", match: "85%", shadow: "shadow-rose-200" },
                ].map((job, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + (i * 0.15) }}
                        className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:shadow-slate-200/50 hover:border-brand-100 transition-all duration-300 group cursor-default"
                    >
                        <div className={`w-8 h-8 rounded-lg ${job.bg} flex items-center justify-center text-white font-bold text-xs shadow-md ${job.shadow} shrink-0 group-hover:scale-105 transition-transform`}>
                            {job.text[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate mb-0.5 group-hover:text-brand-600 transition-colors">{job.text}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 font-medium">
                                {job.time} <span className="w-0.5 h-0.5 rounded-full bg-slate-300" /> <span className="text-slate-500">Match:</span> <span className="text-emerald-600 font-bold">{job.match}</span>
                            </div>
                        </div>
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
);

const ExecutionVisual = () => (
    <div className="relative w-full h-full bg-[#0F172A] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-700/50 flex flex-col ring-1 ring-white/5">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Rocket size={14} className="text-emerald-400" />
                </div>
                <div>
                    <div className="text-xs text-slate-200 font-bold tracking-wide">Auto-Applier</div>
                    <div className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold uppercase tracking-wider mt-0.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                        </span>
                        Active
                    </div>
                </div>
            </div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700/50 hover:bg-slate-600 transition-colors" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700/50 hover:bg-slate-600 transition-colors" />
            </div>
        </div>

        {/* Browser Preview (Window in Window) */}
        <div className="px-4 pt-4 pb-0">
            <div className="bg-[#1E293B] rounded-t-lg p-2 border border-slate-700/50 flex flex-col gap-1.5 opacity-80 shadow-lg relative overflow-hidden group">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="w-full h-1.5 bg-slate-700/50 rounded-full" />
                <div className="flex gap-1.5">
                    <div className="w-1/3 h-12 bg-slate-700/30 rounded border border-white/5" />
                    <div className="w-2/3 h-12 space-y-1.5">
                        <div className="w-full h-1.5 bg-slate-700/30 rounded" />
                        <div className="w-3/4 h-1.5 bg-slate-700/30 rounded" />
                        <div className="w-full h-6 bg-blue-500/10 rounded border border-blue-500/20 flex items-center px-2">
                            <div className="w-2 h-2 bg-blue-500/40 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Console Output */}
        <div className="p-4 font-mono text-[10px] flex-1 flex flex-col justify-end gap-2 bg-[#020617]/50 border-t border-white/5 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 text-slate-400">
                <span className="text-blue-400 font-bold">➜</span>
                <span>Initializing headless browser...</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex items-center gap-2 text-slate-400">
                <span className="text-purple-400 font-bold">➜</span>
                <span>Navigating to <span className="text-slate-300 font-medium">company-jobs.com</span>...</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }} className="flex items-center gap-2 text-slate-400">
                <span className="text-yellow-400 font-bold">➜</span>
                <span>Bypassing Cloudflare protections...</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 }} className="flex items-center gap-2 text-slate-400">
                <span className="text-blue-400 font-bold">➜</span>
                <span>Parsing form fields (24 detected)...</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.3 }} className="flex items-center gap-2 text-emerald-400 font-medium border-t border-white/5 pt-2 mt-1">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Application submitted successfully!</span>
            </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 w-full relative z-20">
            <motion.div
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
            />
        </div>
    </div>
);

const ActivePhaseCard = ({ phase }) => {
    return (
        <motion.div
            key={phase.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 overflow-hidden h-[500px] flex flex-col justify-center"
        >
            {/* Ambient Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${phase.bgGradient} opacity-50`} />

            <div className="relative z-10 grid lg:grid-cols-5 gap-8 items-center h-full">
                {/* Content Side */}
                <div className="col-span-3 flex flex-col justify-center h-full px-4 lg:px-0">
                    <div className="mb-4">
                        <div className={`inline-flex items-center gap-2 p-2 rounded-md w-2/3 bg-white  text-brand text-[10px] font-bold uppercase tracking-widest mb-3 border border- backdrop-blur-md`}>
                            <span className="text-brand">Phase {phase.id}</span>
                        </div>

                        <h3 className={`text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br ${phase.gradient} mb-2 tracking-tight leading-tight`}>
                            {phase.title}
                        </h3>

                        <p className="text-base text-slate-700 font-medium leading-relaxed">
                            {phase.tagline}
                        </p>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-lg">
                        {phase.description}
                    </p>

                    <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-white border-l-4 border-brand-400 rounded-r-xl relative max-w-lg shadow-sm">
                        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
                        <p className="text-xs text-slate-700 font-medium italic leading-relaxed relative z-10 flex gap-2">
                            <span className="text-brand-300 font-serif text-2xl leading-none -mt-1">"</span>
                            {phase.detail}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {phase.subFeatures.map((feat, i) => (
                            <div key={i} className="group flex items-center gap-2.5 bg-white border border-slate-100 p-2.5 rounded-xl transition-all duration-300 hover:border-brand-200 hover:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hover:bg-gradient-to-br hover:from-white hover:to-slate-50">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${phase.gradient} bg-opacity-10 p-[1px] shadow-sm group-hover:scale-105 transition-transform flex-shrink-0 group-hover:shadow-md`}>
                                    <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                                        <feat.icon size={16} className="text-slate-700 group-hover:text-brand-600 transition-colors" />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">{feat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visual Side */}
                <div className="col-span-2 relative flex items-center justify-center h-full pl-6">
                    {/* Decorative Background Blob */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br ${phase.gradient} rounded-full opacity-5 blur-[80px] pointer-events-none`} />

                    <div className="relative z-10 w-full flex justify-center items-center h-full">
                        {phase.id === "0" && <BlueprintVisual />}
                        {phase.id === "1" && <DiscoveryVisual />}
                        {phase.id === "2" && <ExecutionVisual />}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const HowItWorks = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const PHASES = [
        {
            id: "0",
            icon: FileSignature,
            title: "Blueprint Creation",
            tagline: "You define the strategy",
            description: "It starts with configuration. Set your target roles, salary expectations, and automation autonomy levels.",
            detail: "Our architecture respects your constraints strictly—no applying to roles below your salary floor.",
            metric: "00",
            metricLabel: "Setup Phase",
            gradient: "from-slate-600 to-slate-700",
            bgGradient: "from-slate-500/10 to-slate-600/5",
            subFeatures: [
                { label: "Target Roles", icon: MonitorCheck },
                { label: "Salary Floor", icon: UploadCloud },
                { label: "Geo-Fencing", icon: MapPin },
                { label: "Remote Priority", icon: Globe }
            ]
        },
        {
            id: "1",
            icon: Search,
            title: "Discovery & Enrichment",
            tagline: "Deep-dive intelligence",
            description: "Agents patrol the web 24/7, performing shallow scans for volume and deep scrapes for context.",
            detail: "We don't just find links; we extract full job descriptions and 'Easy Apply' status from hidden markets.",
            metric: "01",
            metricLabel: "Discovery",
            gradient: "from-blue-500 to-brand-600",
            bgGradient: "from-blue-500/10 to-brand-600/5",
            subFeatures: [
                { label: "Deep Scraping", icon: Globe },
                { label: "Local Scoring", icon: BrainCircuit },
                { label: "Smart Filter", icon: Sparkles },
                { label: "Blacklist Check", icon: Shield }
            ]
        },
        {
            id: "2",
            icon: Rocket,
            title: "Autonomous Execution",
            tagline: "Human-simulated interaction",
            description: "The agent switches to execution mode, navigating complex ATS portals and submitting applications.",
            detail: "Using Bezier mouse curves and typing delays, we bypass anti-bot defenses to deliver your tailored resume.",
            metric: "02",
            metricLabel: "Execution",
            gradient: "from-emerald-500 to-emerald-600",
            bgGradient: "from-emerald-500/10 to-emerald-600/5",
            subFeatures: [
                { label: "Tailored PDF", icon: FileSignature },
                { label: "Captcha Solve", icon: Rocket },
                { label: "Human Mimicry", icon: Clock },
                { label: "Smart Fill", icon: Zap }
            ]
        }
    ];

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (document.body.dataset.navScrolling === 'true') return;
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        const index = Math.min(
            Math.floor(latest * PHASES.length),
            PHASES.length - 1
        );
        setActiveIndex(index);
    });

    const getNextPhases = () => {
        const next1 = (activeIndex + 1) % PHASES.length;
        const next2 = (activeIndex + 2) % PHASES.length;
        return [PHASES[next1], PHASES[next2]];
    };

    const activePhase = PHASES[activeIndex];
    const nextPhases = getNextPhases();

    return (
        <section
            ref={containerRef}
            id="how-it-works"
            className="relative h-auto lg:h-[300vh] bg-white"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative lg:sticky top-0 h-auto lg:h-screen flex flex-col justify-center py-10 md:py-16 lg:py-0 overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">

                    {/* Header */}
                    <div className="mb-8 md:mb-12 lg:mb-16">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 py-2.5 mb-2"
                        >
                            <div className="w-16 h-0.5 bg-brand-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Workflow</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]"
                        >
                            Automated from{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                                start to finish.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mt-4 md:mt-6"
                        >
                            Stop fighting with ATS portals. Our autonomous agents handle the entire pipeline—from discovering hidden roles to tailoring every single resume.
                        </motion.p>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-8 items-center">

                        {/* LEFT: Active Phase Large Card */}
                        <div className="col-span-8">
                            <AnimatePresence mode="wait">
                                <ActivePhaseCard key={activeIndex} phase={activePhase} />
                            </AnimatePresence>

                            {/* Progress Dots */}
                            <div className="mt-6 flex items-center gap-2">
                                {PHASES.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex
                                            ? `flex-1 bg-gradient-to-r ${PHASES[activeIndex].gradient}`
                                            : 'w-1.5 bg-slate-200'
                                            } `}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: List / Preview Cards */}
                        <div className="col-span-4 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Process Stack</p>

                            {nextPhases.map((phase, index) => (
                                <motion.div
                                    key={`${activeIndex}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${phase.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                            <phase.icon size={20} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 mb-1 text-sm">
                                                {phase.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 italic">
                                                {phase.tagline}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${phase.gradient}`}>
                                                {phase.metric}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {phase.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="flex items-center justify-center gap-2 pt-4 text-slate-400">
                                <span className="text-xs font-medium">Scroll to visualize</span>
                                <ChevronRight size={14} className="animate-pulse rotate-90" />
                            </div>
                        </div>

                    </div>

                    {/* Mobile Layout (Simple Stack) */}
                    <div className="lg:hidden space-y-4">
                        {PHASES.map((phase, index) => (
                            <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
                                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${phase.gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                                        <phase.icon size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Phase {phase.id}</div>
                                        <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">{phase.title}</h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 mb-4 text-xs md:text-sm leading-relaxed">{phase.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {phase.subFeatures.map((f, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-100 rounded text-[10px] md:text-xs font-semibold text-slate-600">
                                            {f.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
