import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Play,
    Monitor,
    Shield,
    Zap,
    Clock,
    Target,
    TrendingUp
} from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { Button } from '@/components/ui/Button';
import Navbar from './sections/Navbar';

const WatchDemoPage = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    const features = [
        {
            icon: Monitor,
            title: "Autonomous Navigation",
            description: "Intelligently browses job boards and identifies high-value opportunities."
        },
        {
            icon: Shield,
            title: "Private & Secure",
            description: "Your credentials and data never leave your machine."
        },
        {
            icon: Zap,
            title: "Smart Applications",
            description: "Tailors your resume and fills complex forms automatically."
        }
    ];

    const stats = [
        { icon: Clock, value: "2 min", label: "50 Applications" },
        { icon: Target, value: "98%", label: "Accuracy Rate" },
        { icon: TrendingUp, value: "5x", label: "Faster Response" }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-brand-100 selection:text-brand-900 font-sans">

            <Navbar />

            <main className="relative pt-20 md:pt-24 lg:pt-28 pb-8 md:pb-12 lg:pb-20">

                {/* Stats Bar */}
                <div className="container mx-auto px-4 mb-6 md:mb-8 lg:mb-12">
                    <div className="flex justify-center items-center gap-0 max-w-lg mx-auto">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex flex-col justify-center items-center gap-1 flex-1 ${idx === 1 ? 'border-x border-slate-200 lg:px-6' : ''}`}
                            >
                                <div className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">{stat.value}</div>
                                <div className="text-[9px] md:text-[10px] text-slate-500 text-center leading-tight">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8 lg:mb-12 px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 md:mb-4 lg:mb-6 text-slate-900 leading-[1.1]"
                    >
                        See the Agent in{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">
                            Action
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm md:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto px-2"
                    >
                        Watch our autonomous AI navigate complex job applications in real-time.{' '}
                        <span className="font-semibold text-slate-900">No cuts, no edits</span>—just raw efficiency.
                    </motion.p>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-3 md:px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 items-start">

                        {/* Video Player - Spans 2 columns */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="lg:col-span-2 w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden relative group bg-slate-900 shadow-xl md:shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5"
                        >
                            {!isPlaying ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629904853716-64f95d8e7acc?q=80&w=2932&auto=format&fit=crop')] bg-cover bg-center" />

                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                        <button
                                            onClick={() => setIsPlaying(true)}
                                            className="group/btn relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 transition-all duration-300 hover:scale-110 hover:bg-white shadow-2xl active:scale-95"
                                        >
                                            <Play size={28} className="ml-1 text-white fill-white group-hover/btn:text-brand-600 transition-colors" />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 z-20">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                    Actual Footage
                                                </div>
                                                <p className="text-white text-sm md:text-base font-semibold">Applying to 50+ jobs autonomously</p>
                                            </div>
                                            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10">
                                                <Clock size={12} className="text-white/80" />
                                                <span className="text-white/90 text-xs font-mono font-medium">02:14</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                                    title="ApplyVortex Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            )}
                        </motion.div>

                        {/* Side Panel - Compact Features */}
                        <div className="lg:col-span-1 flex flex-col gap-3 md:gap-4 h-full">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                    className="p-3 md:p-4 rounded-lg md:rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 group"
                                >
                                    <div className="flex items-start gap-2.5 md:gap-3">
                                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                            <feature.icon size={15} className="md:w-4 md:h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs md:text-sm font-bold text-slate-900 mb-0.5 md:mb-1 leading-tight">{feature.title}</h3>
                                            <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* CTA Card - Expands to fill remaining height */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                                className="p-4 md:p-5 rounded-xl flex-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden mt-1 md:mt-2 flex flex-col justify-center"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10">
                                    <h3 className="text-xs md:text-sm font-bold mb-1.5 md:mb-2">Ready to automate?</h3>
                                    <p className="text-[11px] md:text-xs text-slate-400 mb-3 md:mb-4 leading-relaxed">
                                        Start your journey with 50 free applications.
                                    </p>
                                    <Button
                                        as={Link}
                                        to={ROUTES.SIGNUP}
                                        variant="outline"
                                        className="w-full bg-white"
                                    >
                                        Create Free Account
                                    </Button>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
};

export default WatchDemoPage;
