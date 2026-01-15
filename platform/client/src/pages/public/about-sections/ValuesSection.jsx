import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Users, Shield, Zap, Heart, Code, Eye, Sparkles, Quote, ChevronRight } from 'lucide-react';

const ValuesSection = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const values = [
        {
            icon: Users,
            title: "User First. Always.",
            tagline: "Your success is our mission",
            description: "We don't sell data. We don't spam. We exist solely to get you hired.",
            detail: "Every feature we build starts with one question: does this help our users get hired faster?",
            metric: "100%",
            metricLabel: "User-Focused",
            gradient: "from-brand-500 to-brand-600",
            bgGradient: "from-brand-500/10 to-brand-600/5"
        },
        {
            icon: Shield,
            title: "Privacy by Design",
            tagline: "Your data stays yours",
            description: "Encryption and anonymity are default features, not add-ons.",
            detail: "End-to-end encryption, zero-knowledge architecture, complete data control.",
            metric: "E2E",
            metricLabel: "Encrypted",
            gradient: "from-emerald-500 to-emerald-600",
            bgGradient: "from-emerald-500/10 to-emerald-600/5"
        },
        {
            icon: Eye,
            title: "Radical Transparency",
            tagline: "No black boxes",
            description: "You see exactly what our agents do and how matches are made.",
            detail: "Every AI action is logged, explainable, and overridable by you.",
            metric: "100%",
            metricLabel: "Auditable",
            gradient: "from-violet-500 to-violet-600",
            bgGradient: "from-violet-500/10 to-violet-600/5"
        },
        {
            icon: Code,
            title: "Engineering Excellence",
            tagline: "Built to last",
            description: "We solve hard problems with elegant code. If it's not robust, we don't ship it.",
            detail: "Battle-tested with 99.9% uptime. Your job search can't afford downtime.",
            metric: "99.9%",
            metricLabel: "Uptime",
            gradient: "from-slate-600 to-slate-700",
            bgGradient: "from-slate-500/10 to-slate-600/5"
        },
        {
            icon: Zap,
            title: "Speed as a Feature",
            tagline: "Machine-speed execution",
            description: "In the job market, timing is everything. Our automation moves instantly.",
            detail: "Apply within minutes of posting. Early applicants get 3x more responses.",
            metric: "3x",
            metricLabel: "Response Rate",
            gradient: "from-amber-500 to-amber-600",
            bgGradient: "from-amber-500/10 to-amber-600/5"
        },
        {
            icon: Heart,
            title: "Built with Empathy",
            tagline: "We've been there",
            description: "We're building the tool we wished we had when job hunting.",
            detail: "Our team has experienced rejection, ghosting, and ATS failures. We feel your pain.",
            metric: "∞",
            metricLabel: "Empathy",
            gradient: "from-rose-500 to-rose-600",
            bgGradient: "from-rose-500/10 to-rose-600/5"
        }
    ];

    // Scroll-based value switching (desktop only)
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        const index = Math.min(
            Math.floor(latest * values.length),
            values.length - 1
        );
        setActiveIndex(index);
    });

    // Get the next 2 values (wrapping around)
    const getNextValues = () => {
        const next1 = (activeIndex + 1) % values.length;
        const next2 = (activeIndex + 2) % values.length;
        return [values[next1], values[next2]];
    };

    const featuredValue = values[activeIndex];
    const nextValues = getNextValues();

    return (
        <section
            id="values"
            ref={containerRef}
            className="relative h-auto lg:h-[400vh] bg-slate-50"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative lg:sticky top-0 h-auto lg:h-screen flex flex-col justify-center py-10 md:py-16 lg:py-0 overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 py-2 mb-2"
                    >
                        <div className="w-10 md:w-16 h-0.5 bg-brand-500" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-700">Our Principles</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-2 md:mb-3"
                    >
                        Engineers building{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                            for engineers.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mb-6 md:mb-10"
                    >
                        These aren't corporate values. They're principles we live by.
                    </motion.p>

                    {/* Mobile Layout: Compact Cards */}
                    <div className="lg:hidden space-y-2">
                        {values.map((value, index) => (
                            <div key={index} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white shrink-0`}>
                                    <value.icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-slate-900 truncate">{value.title}</h3>
                                    <p className="text-[11px] text-slate-400 truncate">{value.tagline}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-base font-bold text-transparent bg-clip-text bg-gradient-to-r ${value.gradient}`}>
                                        {value.metric}
                                    </div>
                                    <div className="text-[8px] font-mono uppercase text-slate-400">
                                        {value.metricLabel}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Layout: Featured + Next 2 */}
                    <div className="hidden lg:grid grid-cols-12 gap-8 items-center">

                        {/* Featured Value - Large Card */}
                        <div className="col-span-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 overflow-hidden"
                                >
                                    {/* Background Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${featuredValue.bgGradient} opacity-50`} />

                                    {/* Quote decoration */}
                                    <Quote className="absolute top-6 right-6 w-16 h-16 text-slate-100 -rotate-6" />

                                    <div className="relative grid lg:grid-cols-5 gap-8 items-center">
                                        {/* Content */}
                                        <div className="col-span-3">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${featuredValue.gradient} text-white text-xs font-semibold mb-5 shadow-lg`}>
                                                <Sparkles size={12} />
                                                Core Value {String(activeIndex + 1).padStart(2, '0')}
                                            </div>

                                            <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                                                {featuredValue.title}
                                            </h3>

                                            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                                                {featuredValue.description}
                                            </p>

                                            <p className="text-slate-500 leading-relaxed mb-6">
                                                {featuredValue.detail}
                                            </p>

                                            <div className="flex items-center gap-4">
                                                <div className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${featuredValue.gradient}`}>
                                                    {featuredValue.metric}
                                                </div>
                                                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                                                    {featuredValue.metricLabel}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Element */}
                                        <div className="col-span-2 relative flex items-center justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                                className="absolute w-48 h-48 rounded-full border-2 border-dashed border-slate-200/50"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                                className="absolute w-36 h-36 rounded-full border border-slate-300/30"
                                            />
                                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${featuredValue.gradient} flex items-center justify-center shadow-2xl`}>
                                                <featuredValue.icon size={40} className="text-white" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress Indicator */}
                            <div className="mt-6 flex items-center gap-2">
                                {values.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex
                                            ? `flex-1 bg-gradient-to-r ${values[activeIndex].gradient}`
                                            : 'w-1.5 bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Next 2 Values - Preview Cards */}
                        <div className="col-span-4 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Up Next</p>

                            {nextValues.map((value, index) => (
                                <motion.div
                                    key={`${activeIndex}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                            <value.icon size={20} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 mb-1 text-sm">
                                                {value.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 italic">
                                                {value.tagline}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${value.gradient}`}>
                                                {value.metric}
                                            </div>
                                            <div className="text-[9px] font-mono uppercase text-slate-400">
                                                {value.metricLabel}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {value.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            <div className="flex items-center justify-center gap-2 pt-2 text-slate-400">
                                <span className="text-xs font-medium">Scroll to explore</span>
                                <ChevronRight size={14} className="animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Bottom Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="hidden lg:block mx-auto mt-5 text-center"
                    >
                        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8">
                            <Quote className="absolute top-4 left-4 w-6 h-6 text-brand-100" />

                            <p className="text-xl font-medium text-slate-700 leading-relaxed mb-6 relative">
                                "We've applied to thousands of jobs ourselves. We know the pain.
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500 font-bold"> That's why we built ApplyVortex.</span>"
                            </p>

                            <div className="flex items-center justify-center gap-3">
                                <div className="flex -space-x-3">
                                    {values.slice(0, 4).map((v, i) => (
                                        <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${v.gradient} flex items-center justify-center text-white border-2 border-white shadow-md`}>
                                            {/* <v.icon size={14} /> */}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-slate-500 font-medium">
                                    — The ApplyVortex Team
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile Bottom Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:hidden mt-6"
                    >
                        <div className="relative bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4">
                            <Quote className="absolute top-3 left-3 w-4 h-4 text-brand-100" />

                            <p className="text-sm font-medium text-slate-700 leading-relaxed mb-3 relative pl-3">
                                "We've applied to thousands of jobs ourselves. We know the pain. 
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500 font-bold"> That's why we built ApplyVortex.</span>"
                            </p>

                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {values.slice(0, 3).map((v, i) => (
                                        <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${v.gradient} flex items-center justify-center text-white border-2 border-white shadow-sm`}>
                                            <v.icon size={8} />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                    — The Team
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ValuesSection;
