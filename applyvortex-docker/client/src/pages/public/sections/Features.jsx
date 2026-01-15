import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
    LayoutDashboard,
    Globe,
    FileText,
    Zap,
    BarChart3,
    CheckCircle2,
    Cpu,
    Terminal,
    Search,
    Settings,
    Bell,
    Menu,
    MoreHorizontal,
    ArrowRight,
    ShieldCheck,
    Clock
} from "lucide-react";

/**
 * FEATURES DATA
 * aligned with the "Internal Dashboard" theme
 */
const FEATURES = [
    {
        id: "scraping",
        label: "Unified Discovery",
        title: "Multi-Platform Intelligence",
        icon: Globe,
        description: "Aggregates listings from LinkedIn, Indeed, and Naukri using stealth browsers to uncover hidden job markets.",
        status: "LIVE",
        dashboardView: "scraping",
        stats: {
            value1: "4+", value1Label: "Major Portals",
            value2: "24/7", value2Label: "Monitoring"
        }
    },
    {
        id: "architect",
        label: "Adaptive Tailoring",
        title: "Context-Aware Optimization",
        icon: FileText,
        description: "Reconstructs your resume for every single application, mapping keywords and restructuring content for 100% ATS sizing.",
        status: "ACTIVE",
        dashboardView: "architect",
        stats: {
            value1: "100%", value1Label: "ATS Score",
            value2: "< 2s", value2Label: "Gen Time"
        }
    },
    {
        id: "autoplier",
        label: "Stealth Execution",
        title: "Human-Like Automation",
        icon: ShieldCheck,
        description: "Enterprise-grade browser agents simulate natural mouse movements and typing to bypass advanced anti-bot protections.",
        status: "RUNNING",
        dashboardView: "autoplier",
        stats: {
            value1: "99.9%", value1Label: "Evasion",
            value2: "0", value2Label: "Captchas"
        }
    },
    {
        id: "analytics",
        label: "Live Observability",
        title: "Pipeline Analytics",
        icon: BarChart3,
        description: "Granular visibility into every action, from conversion rates to agent health metrics and ban detection monitoring.",
        status: "TRACKING",
        dashboardView: "analytics",
        stats: {
            value1: "Real-time", value1Label: "Logs",
            value2: "Full", value2Label: "History"
        }
    }
];

// --- DASHBOARD COMPONENTS ---

const DashboardSidebar = () => (
    <div className="hidden md:flex flex-col w-64 border-r border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
                <Zap size={14} className="text-white" fill="currentColor" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">ApplyVortex OS</span>
        </div>

        <div className="space-y-1">
            {["Dashboard", "Live Feed", "Portals", "Network"].map((item, i) => (
                <div key={item} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${i === 0 ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}>
                    {i === 0 && <LayoutDashboard size={16} />}
                    {i === 1 && <Terminal size={16} />}
                    {i === 2 && <Globe size={16} />}
                    {i === 3 && <ShieldCheck size={16} />}
                    {item}
                </div>
            ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200/60 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 text-sm font-medium">
                <Settings size={16} />
                Settings
            </div>
        </div>
    </div>
);

const StatCard = ({ label, value, trend, trendUp }) => (
    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-100 shadow-sm">
        <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-end justify-between">
            <span className="text-xl md:text-2xl font-bold text-slate-900">{value}</span>
            {trend && (
                <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {trend}
                </span>
            )}
        </div>
    </div>
);

const ActivityRow = ({ time, source, action, status }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-12">{time}</span>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">{action}</span>
                <span className="text-[11px] text-slate-400">{source}</span>
            </div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
            {status}
        </div>
    </div>
);

// Specific views for each feature type
const ScrapingView = () => (
    <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <StatCard label="Jobs Indexed" value="42.8k" trend="+1.2k" trendUp={true} />
            <StatCard label="Duplicates" value="12k" trend="Removed" trendUp={false} />
            <div className="col-span-2 md:col-span-1">
                <StatCard label="Sources" value="54" trend="Active" trendUp={true} />
            </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 md:p-4 h-auto min-h-[12rem] md:h-48 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h4 className="text-sm font-semibold text-slate-800">Live Ingestion Stream</h4>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">Monitoring</span>
                </div>
            </div>
            <div className="space-y-1 overflow-hidden relative">
                <div className="space-y-2">
                    {[
                        { src: "LinkedIn", title: "Senior React Developer - Netflix", time: "10:42:05" },
                        { src: "Indeed", title: "Frontend Engineer - Vercel", time: "10:42:01" },
                        { src: "Naukri", title: "SDE II - Uber", time: "10:41:55" },
                        { src: "BuiltIn", title: "Product Designer - Linear", time: "10:41:42" },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100"
                        >
                            <div className="flex items-center gap-2 md:gap-3 overflow-hidden text-clip whitespace-nowrap">
                                <span className="text-slate-400 font-mono text-[10px] hidden xs:inline">{item.time}</span>
                                <span className="font-medium text-slate-700 truncate">{item.title}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-500 shrink-0">
                                {item.src}
                            </span>
                        </motion.div>
                    ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
        </div>
    </div>
);

const ArchitectView = () => (
    <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatCard label="Reconstructed" value="843" />
            <StatCard label="ATS Score" value="98/100" trend="Perfect" trendUp={true} />
        </div>

        <div className="bg-slate-900 rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden h-auto min-h-[12rem] md:h-48 flex flex-col">
            <div className="absolute top-3 right-3 flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>
            <div className="font-mono text-[10px] xs:text-xs text-slate-300 space-y-1.5 mt-2">
                <div className="flex gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2">
                    <span>$</span> <span className="text-slate-300 break-all">applyvortex tailorer --target=netflix.json</span>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <span className="text-blue-400">info</span> Analyzing ... <span className="text-emerald-400">Done</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <span className="text-blue-400">info</span> Extracting skills: ["TS", "GQL"]
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="pl-4 border-l-2 border-emerald-500/30 text-slate-400">
                    Injecting <span className="text-amber-300">"CI/CD"</span> into Exp...
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                    <span className="text-emerald-400">success</span> PDF Rebuilt. Score: 99%
                </motion.div>
            </div>
        </div>
    </div>
);

const AutoplierView = () => (
    <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatCard label="Bot Evasion" value="100%" trend="Secure" trendUp={true} />
            <StatCard label="Captchas" value="0" trend="Avoided" trendUp={true} />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 md:p-4 h-auto min-h-[12rem] md:h-48 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <h4 className="text-sm font-semibold text-slate-800">Browser Stealth Checks</h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase">
                    <ShieldCheck size={10} />
                    Verified
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                    { label: "IP Rep", status: "Clean", val: "Resi-Proxy" },
                    { label: "Print", status: "Consistent", val: "Chrome 120" },
                    { label: "Mouse", status: "Natural", val: "Bezier" },
                    { label: "Typing", status: "Human-Like", val: "140ms" },
                ].map((check) => (
                    <div key={check.label} className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide truncate">{check.label}</span>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] md:text-xs font-bold text-slate-700 truncate">{check.val}</span>
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AnalyticsView = () => (
    <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatCard label="Applications" value="1,204" />
            <StatCard label="Response Rate" value="18.5%" trend="+4.2%" trendUp={true} />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 md:p-4 h-48 flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Conversion Pipeline</p>
                <BarChart3 size={14} className="text-slate-300" />
            </div>

            <div className="flex items-end justify-between gap-2 md:gap-4 h-full px-2 pb-2">
                {[
                    { label: "Sent", height: "100%", val: "1,204", color: "bg-slate-200" },
                    { label: "Viewed", height: "65%", val: "782", color: "bg-blue-100" },
                    { label: "Reply", height: "25%", val: "223", color: "bg-brand-200" },
                    { label: "Screen", height: "12%", val: "54", color: "bg-brand-500" },
                ].map((bar) => (
                    <div key={bar.label} className="flex-1 flex flex-col justify-end group h-full relative">
                        <div className="text-center text-[10px] font-bold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-0 right-0">
                            {bar.val}
                        </div>
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: bar.height }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`w-full rounded-t-lg ${bar.color}`}
                        />
                        <div className="text-center text-[10px] font-medium text-slate-400 mt-1 md:mt-2 border-t border-slate-100 pt-1">
                            {bar.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function Features() {
    const containerRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);
    const [lockedByClick, setLockedByClick] = useState(false);

    const activeFeature = FEATURES[activeTab];

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        // Prevent interference during programmatic scrolling
        if (lockedByClick || document.body.dataset.navScrolling === 'true') return;
        if (typeof window !== "undefined" && window.innerWidth < 1024) return;

        // Map 0-1 progress to 0-(Length-1) index
        const index = Math.min(
            FEATURES.length - 1,
            Math.floor(v * FEATURES.length)
        );

        if (index !== activeTab) {
            setActiveTab(index);
        }
    });

    const handleTabClick = useCallback((index) => {
        setLockedByClick(true);
        setActiveTab(index);
        // Release lock after animation flows
        setTimeout(() => setLockedByClick(false), 1000);
    }, []);

    return (
        <section id="features" ref={containerRef} className="relative h-auto lg:h-[300vh] bg-slate-50">
            <div className="relative lg:sticky top-0 h-auto lg:h-screen flex flex-col justify-center overflow-hidden">
                <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 lg:px-6 lg:py-20 h-full flex flex-col justify-center">

                    {/* 1. Header Section */}
                    <div className="max-w-4xl content-start">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 py-2.5 mb-2"
                        >
                            <div className="w-16 h-0.5 bg-brand-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Our Features</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-3"
                        >
                            Full-stack automation{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                                for modern job search.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-base md:text-lg text-slate-500 leading-relaxed  mb-6 lg:mb-10"
                        >
                            A complete suite of tools designed to remove friction from every stage of the hiring pipeline. From discovery to application, we handle the boring stuff so you can focus on the interview.
                        </motion.p>
                    </div>

                    {/* 2. Main Layout Grid */}
                    <div className="grid lg:grid-cols-12 gap-6 lg:gap-16 items-start lg:items-stretch">

                        {/* LEFT COLUMN: Navigation (Mobile: Accordion, Desktop: Tabs) */}
                        <div className="lg:col-span-4 flex flex-col gap-2">
                            {FEATURES.map((feature, index) => {
                                const isActive = activeTab === index;
                                return (
                                    <div key={feature.id} className="flex flex-col">
                                        <button
                                            onClick={() => handleTabClick(index)}
                                            className={`group w-full text-left p-3 md:p-4 rounded-xl transition-all duration-200 border relative overflow-hidden flex items-center ${isActive
                                                ? "bg-white border-slate-200 shadow-lg shadow-slate-200/50"
                                                : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200/60"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3 md:gap-4 z-10 relative w-full">
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:text-slate-700"
                                                    }`}>
                                                    <feature.icon size={18} className="md:w-5 md:h-5" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-semibold text-sm md:text-base ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                                                            {feature.label}
                                                        </h3>
                                                        {isActive && (
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold tracking-wide">
                                                                {feature.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs md:text-sm leading-relaxed ${isActive ? "text-slate-600 block" : "text-slate-400 line-clamp-2"}`}>
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Simple active left border accent */}
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />
                                            )}
                                        </button>

                                        {/* MOBILE ONLY: Embedded Content (Accordion View) */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="lg:hidden overflow-hidden"
                                                >
                                                    <div className="pt-2 pb-4 pl-2 pr-2">
                                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                                            {/* We don't need the title/desc here as it's already in the button above */}
                                                            {feature.id === 'scraping' && <ScrapingView />}
                                                            {feature.id === 'architect' && <ArchitectView />}
                                                            {feature.id === 'autoplier' && <AutoplierView />}
                                                            {feature.id === 'analytics' && <AnalyticsView />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>

                        {/* RIGHT COLUMN: Detailed Content Panel (Desktop Only) */}
                        <div className="hidden lg:block lg:col-span-8">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 h-full p-8 relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="w-full mx-auto"
                                    >
                                        <div className="mb-8 text-left">
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{activeFeature.title}</h3>
                                            <p className="text-slate-500">{activeFeature.description}</p>
                                        </div>

                                        {activeFeature.id === 'scraping' && <ScrapingView />}
                                        {activeFeature.id === 'architect' && <ArchitectView />}
                                        {activeFeature.id === 'autoplier' && <AutoplierView />}
                                        {activeFeature.id === 'analytics' && <AnalyticsView />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
