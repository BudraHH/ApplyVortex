import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { ShieldCheck, Zap, Cpu, Globe, Search, Command, CheckCircle2, FileText, Clock, Briefcase } from 'lucide-react';

const CommandBar = () => {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 1 });

    const [step, setStep] = useState(0);
    const [currentCompany, setCurrentCompany] = useState('Netflix');
    const [systemLoad, setSystemLoad] = useState(24);
    const [successRate, setSuccessRate] = useState(98.2);
    const [logs, setLogs] = useState([
        { action: 'Applied to', target: 'Spotify', time: '2m ago' },
        { action: 'Tailored for', target: 'Uber', time: '15m ago' },
        { action: 'Found', target: '5 matches', time: '1h ago' }
    ]);

    const steps = [
        { text: "Scanning 15+ boards for 'Staff Engineer' roles...", icon: Search, color: "text-blue-500" },
        { text: "Analyzing job description: 'Distributed Systems'...", icon: Cpu, color: "text-purple-500" },
        { text: "Optimizing keywords: Kafka, Kubernetes, Go...", icon: CheckCircle2, color: "text-emerald-500" },
        { text: `Generating cover letter for ${currentCompany} application...`, icon: FileText, color: "text-brand-500" },
        { text: `Application submitted via Greenhouse. 2 min saved.`, icon: Zap, color: "text-amber-500" }
    ];

    useEffect(() => {
        if (!isInView) return;

        const stepInterval = setInterval(() => {
            setStep((prev) => {
                const next = (prev + 1) % steps.length;
                if (next === 0) {
                    const companies = ['Netflix', 'Google', 'Meta', 'Stripe', 'Uber', 'Airbnb', 'DoorDash'];
                    setCurrentCompany(companies[Math.floor(Math.random() * companies.length)]);
                }
                return next;
            });
        }, 3000);

        const loadInterval = setInterval(() => {
            // Fluctuate between 18% and 42%
            setSystemLoad(Math.floor(Math.random() * (42 - 18 + 1)) + 18);
        }, 2000);

        const successInterval = setInterval(() => {
            // Small positive increments
            setSuccessRate(prev => {
                const increase = Math.random() * 0.04;
                return Math.min(99.9, parseFloat((prev + increase).toFixed(2)));
            });
        }, 4000);

        const logInterval = setInterval(() => {
            const actions = ['Applied to', 'Tailored for', 'Matched with', 'Optimized for'];
            const companies = ['Airbnb', 'Stripe', 'Linear', 'Vercel', 'Coinbase', 'Notion', 'Figma', 'Datadog'];

            const newLog = {
                action: actions[Math.floor(Math.random() * actions.length)],
                target: companies[Math.floor(Math.random() * companies.length)],
                time: 'Just now'
            };

            setLogs(prev => [newLog, ...prev.slice(0, 2)]);
        }, 3500);

        return () => {
            clearInterval(stepInterval);
            clearInterval(loadInterval);
            clearInterval(successInterval);
            clearInterval(logInterval);
        };
    }, [isInView]);

    const activeStep = steps[step];
    const Icon = activeStep.icon;

    return (
        <div ref={containerRef} className="w-full relative z-20 flex flex-col gap-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-200/50 p-6"
            >
                {/* Header: Status */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className={`${isInView ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent Active</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                        <Command size={12} className="text-slate-400" />
                        <span className="text-[10px] font-mono text-slate-400 font-bold">809-AF</span>
                    </div>
                </div>

                {/* Main Action Action */}
                <div className="flex gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200/50">
                        <Icon size={24} className={activeStep.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                            >
                                <h4 className="text-slate-900 font-bold text-sm leading-snug mb-1">{activeStep.text}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="h-full bg-brand-500/50 w-full"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase">Processing</span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100/80">
                    <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                            <span>System Load</span>
                            <span className="text-slate-600">{systemLoad}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "24%" }}
                                animate={{ width: `${systemLoad}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                            <span>Success Rate</span>
                            <span className="text-slate-600">{successRate.toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "98%" }}
                                animate={{ width: `${successRate}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-brand-500 rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity Log */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="px-6 py-4 bg-white/50 border border-slate-200/60 rounded-xl backdrop-blur-sm"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                    <Clock size={12} />
                    <span>Recent Activity</span>
                </div>
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {logs.map((log, index) => (
                            <motion.div
                                key={`${log.target}-${index}`} // simple unique key for animation
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-3 text-sm"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <span className="text-slate-600">{log.action} <span className="font-semibold text-slate-800">{log.target}</span></span>
                                <span className="ml-auto text-xs text-slate-400">{log.time}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-brand-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl -z-10 opacity-60"></div>
        </div>
    );
};

const BenefitItem = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm bg-white/50 px-3 py-1.5 rounded-lg hover:bg-white hover:border-slate-400 border border-slate-200">
        <Icon size={14} className="text-brand-500" />
        <span>{text}</span>
    </div>
);

const AboutHero = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

    return (
        <section id="about-hero" ref={targetRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-50 pt-20 md:pt-32 pb-16 md:pb-24">
            {/* Tech Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-70">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,rgba(120,119,198,0.15),transparent)]"></div>
            </div>

            <div className="container flex flex-col lg:flex-row justify-between px-4 md:px-6 relative z-10 w-full gap-10 lg:gap-0">
                <div className="flex flex-col w-full text-left lg:w-1/2">

                    <motion.div style={{ opacity, y }} className="relative flex flex-col justify-center w-full">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 py-2.5 mb-3 md:mb-5"
                        >
                            <div className="w-10 md:w-16 h-0.5 bg-brand-700" />
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-500/75">Engineering The Future</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-4 md:mb-6"
                        >
                            Career growth, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-600 to-brand-500 ">
                                fully autonomous.
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-base md:text-xl text-slate-500 leading-relaxed max-w-xl font-medium mb-6 md:mb-8"
                        >
                            ApplyVortex replaces the manual grind of job hunting with an intelligent agent that works 24/7. It finds, tailors, and applies while you focus on what matters.
                        </motion.p>

                        {/* Benefits Minimal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8"
                        >
                            <BenefitItem icon={Globe} text="Multiple Jobs" />
                            <BenefitItem icon={Cpu} text="AI Tailoring" />
                            <BenefitItem icon={Zap} text="Instant Apply" />
                        </motion.div>

                        {/* Performance Metric */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-3 text-xs font-medium text-slate-400 mb-6 md:mb-8"
                        >
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] text-blue-600 font-bold">A</div>
                                <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] text-indigo-600 font-bold">K</div>
                                <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] text-emerald-600 font-bold">M</div>
                            </div>
                            <p>User average: <span className="text-slate-700 font-bold">15+ hours saved</span> / week.</p>
                        </motion.div>

                        {/* Integration Strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-6 border-t border-slate-200/60 hidden md:block"
                        >
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Seamless Integration With</p>
                            <div className="flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
                                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm"><Briefcase size={16} /> LinkedIn</div>
                                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm"><Briefcase size={16} /> Indeed</div>
                                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm"><Briefcase size={16} /> Glassdoor</div>
                            </div>
                        </motion.div>

                    </motion.div>

                </div>
                <div className="w-full lg:w-1/2 flex justify-center items-center lg:pl-10">
                    <CommandBar />
                </div>
            </div>
        </section>
    );
};

export default AboutHero;
