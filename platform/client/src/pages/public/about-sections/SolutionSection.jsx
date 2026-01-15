import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, FileEdit, Zap, BarChart3, Sparkles, CheckCircle2 } from 'lucide-react';
import AgentMockup from './AgentMockup';

const SolutionSection = () => {
    const [activeTab, setActiveTab] = useState(0);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const solutions = [
        {
            icon: Search,
            title: "Unified Discovery",
            subtitle: "Multi-Platform Aggregation",
            description: "Aggregate hidden opportunities from multiple job boards into one intelligent, de-duplicated feed.",
            color: "brand",
            gradient: "from-brand-500 to-brand-600",
            benefits: ["12+ Job Boards", "Smart Deduplication", "Real-time Updates"]
        },
        {
            icon: FileEdit,
            title: "Deep Tailoring",
            subtitle: "AI-Powered Optimization",
            description: "AI rewrites your resume for every single application to match keywords and beat ATS filters perfectly.",
            color: "brand",
            gradient: "from-brand-500 to-brand-600",
            benefits: ["98% ATS Pass Rate", "Keyword Matching", "Industry Templates"]
        },
        {
            icon: Zap,
            title: "Auto-Pilot Mode",
            subtitle: "Hands-Free Automation",
            description: "Set your criteria and let our agents apply to 100+ matching jobs while you sleep. Maximum efficiency.",
            color: "brand",
            gradient: "from-brand-500 to-brand-600",
            benefits: ["100+ Daily Apps", "Smart Filtering", "24/7 Operation"]
        },
        {
            icon: BarChart3,
            title: "Performance Analytics",
            subtitle: "Data-Driven Insights",
            description: "Track response rates, A/B test resume versions, and optimize your strategy with real-time data insights.",
            color: "brand",
            gradient: "from-brand-500 to-brand-600",
            benefits: ["Response Tracking", "A/B Testing", "Conversion Funnels"]
        }
    ];

    const colorMap = {
        brand: { text: "text-brand-600", bg: "bg-brand-50", border: "border-brand-200", glow: "shadow-brand-500/20" },
    };

    // Scroll-based tab switching (desktop only)
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        const index = Math.min(
            Math.floor(latest * solutions.length),
            solutions.length - 1
        );
        setActiveTab(index);
    });

    return (
        <section
            id="solution"
            ref={containerRef}
            className="relative h-auto lg:h-[300vh] bg-white"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-500/3 to-transparent rounded-full" />
            </div>

            <div className="relative lg:sticky top-0 h-auto lg:h-screen flex flex-col justify-center overflow-hidden py-16 lg:py-0">
                <div className="container mx-auto px-4 md:px-6">

                    {/* Header - Enhanced */}
                    <div className="text-left mb-6 lg:mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 py-2.5 "
                        >
                            <div className="w-16 h-0.5  bg-brand-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">The Solution</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] mb-2"
                        >
                            Automate your job search{' '}
                            <br className="hidden md:block" />
                            <span className="relative">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500 animate-gradient">
                                    without losing control.
                                </span>

                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl"
                        >
                            Sophisticated tools that give you superhuman speed while keeping the human touch where it matters.
                        </motion.p>
                    </div>

                    {/* Mobile Layout: Fresh Redesign */}
                    <div className="lg:hidden">
                        {/* Agent Mockup First - Hero Visual */}
                        <div className="h-[320px] sm:h-[380px] mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent rounded-2xl -z-10 opacity-50" />
                            <AgentMockup />
                        </div>

                        {/* Solution Tabs - Horizontal Scroll */}
                        <div className="flex flex-row gap-2 w-full justify-between overflow-x-auto mt-20 mb-4 no-scrollbar">
                            {solutions.map((solution, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`flex-1 items-center  gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-all shrink-0 ${activeTab === index
                                        ? `bg-gradient-to-r ${solution.gradient} text-white shadow-md`
                                        : 'bg-white border border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2"> <solution.icon size={14} />
                                        <span className="text-xs font-semibold">{solution.title}</span></div>
                                </button>
                            ))}
                        </div>

                        {/* Active Solution Detail */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${solutions[activeTab].gradient} flex items-center justify-center text-white shadow-md`}>
                                        {React.createElement(solutions[activeTab].icon, { size: 18 })}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">{solutions[activeTab].title}</h3>
                                        <p className="text-[10px] text-brand-600 font-medium uppercase tracking-wide">{solutions[activeTab].subtitle}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    {solutions[activeTab].description}
                                </p>

                                {/* Benefits Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {solutions[activeTab].benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex flex-col items-center text-center p-2 bg-slate-50 rounded-lg">
                                            <CheckCircle2 size={14} className="text-brand-500 mb-1" />
                                            <span className="text-[10px] font-medium text-slate-600 leading-tight">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-1.5 mt-4">
                            {solutions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`h-1.5 rounded-full transition-all ${index === activeTab
                                        ? 'w-6 bg-brand-500'
                                        : 'w-1.5 bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Desktop Layout: Enhanced Sticky Scroll with Tabs */}
                    <div className="hidden lg:grid grid-cols-12 gap-10 items-center min-h-[520px]">

                        {/* Left Column: Enhanced Feature Navigation */}
                        <div className="col-span-4 flex flex-col gap-3">
                            {solutions.map((solution, index) => {
                                const isActive = activeTab === index;
                                const colors = colorMap[solution.color];

                                return (
                                    <motion.button
                                        key={index}
                                        onClick={() => setActiveTab(index)}
                                        whileHover={{ x: isActive ? 0 : 4 }}
                                        className={`group relative flex items-start rounded-2xl text-left transition-all duration-400 ${isActive
                                            ? `bg-white ring-1 ring-slate-200 shadow-xl ${colors.glow}`
                                            : "opacity-70 hover:opacity-100 hover:bg-white/60"
                                            } gap-4 p-5`}
                                    >
                                        {/* Icon */}
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                                            ? `bg-gradient-to-br ${solution.gradient} text-white shadow-lg`
                                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                            }`}>
                                            <solution.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold text-base transition-colors ${isActive ? "text-slate-900" : "text-slate-600"
                                                    }`}>
                                                    {solution.title}
                                                </h3>
                                                {isActive && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className={`text-[10px] font-bold ${colors.text} ${colors.bg} px-2 py-0.5 rounded-full`}
                                                    >
                                                        ACTIVE
                                                    </motion.span>
                                                )}
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <p className="text-sm text-slate-500 leading-relaxed mt-2 mb-3">
                                                            {solution.description}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {solution.benefits.map((benefit, idx) => (
                                                                <motion.span
                                                                    key={idx}
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: idx * 0.05 }}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100"
                                                                >
                                                                    <CheckCircle2 size={10} className={colors.text} />
                                                                    {benefit}
                                                                </motion.span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="solution-active-indicator"
                                                className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${solution.gradient}`}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}

                            {/* Progress Indicator */}
                            <div className="mt-4 flex items-center gap-2 px-2">
                                {solutions.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${index === activeTab
                                            ? `flex-1 bg-gradient-to-r ${solutions[activeTab].gradient}`
                                            : 'w-1.5 bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Agent Mockup with Glow */}
                        <div className="col-span-8 relative h-[520px]">
                            {/* Background Glow */}
                            <motion.div
                                className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${solutions[activeTab].gradient} opacity-5 blur-2xl transition-all duration-500 pointer-events-none`}
                                key={activeTab}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.05 }}
                            />
                            <div className="relative z-10 h-full">
                                <AgentMockup />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SolutionSection;