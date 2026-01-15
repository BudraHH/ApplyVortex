import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Upload,
    UserCheck,
    Rocket,
    ChevronRight,
    Sparkles,
    Quote,
    FileText,
    AlertTriangle,
} from "lucide-react";
import { ROUTES } from "@/routes/routes.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";

const steps = [

    {
        icon: Upload,
        title: "Import Resume",

        description:
            "Upload your resume to instantly populate your profile with high accuracy using AI parsing.",
    },
    {
        icon: UserCheck,
        title: "Verify Details",
        description:
            "Review and refine your skills, experience, and education before applying.",
    },
    {
        icon: Rocket,
        title: "Auto-Apply",
        description:
            "Configure preferences and let AI agents apply to relevant roles automatically.",
    },
];

const quotes = [
    "The future belongs to those who believe in the beauty of their dreams.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Quality is not an act, it is a habit.",
    "Success is where preparation and opportunity meet.",
];

export default function WelcomePage() {
    const { user } = useAuthStore();
    const [quote, setQuote] = useState("");

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    const firstName = user?.name?.split(" ")[0] || "Pioneer";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 50, damping: 20 }
        }
    };

    return (
        <div className="relative w-full min-h-screen bg-slate-50 overflow-hidden font-sans flex flex-col items-center justify-center selection:bg-brand-100 selection:text-brand-900">

            {/* Optimized Dynamic Background - GPU Accelerated */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-white to-brand-50/20" />
                <motion.div
                    className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-brand-200/20 blur-[100px] will-change-transform"
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 30, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-300/20 blur-[120px] will-change-transform"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, -40, 0],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
                />
                <div className="absolute inset-0 opacity-[0.3]"
                    style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
            </div>

            <main className="relative z-10 w-full max-w-7xl flex flex-col h-full max-h-[900px] justify-between p-6">

                {/* Top Section: Header & Stats */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="flex-none text-center space-y-4"
                >
                    <motion.div variants={itemVariants}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center rounded-full bg-white/80 backdrop-blur border border-brand-100 shadow-sm text-brand-600 text-xs font-bold tracking-widest uppercase cursor-default gap-2 px-4 py-2"
                        >
                            <Sparkles className="h-3 w-3" />
                            <span>Ready to Launch</span>
                        </motion.div>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl md:text-6xl font-black tracking-tight text-slate-900"
                    >
                        Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700">{firstName}.</span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="max-w-xl mx-auto">
                        <p className="text-lg md:text-xl text-slate-500 font-medium">{quote}</p>
                    </motion.div>
                </motion.div>

                {/* Middle Section: Cards Grid with Stagger */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="flex-1 flex items-center justify-center py-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-6">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
                                className="group relative bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-brand-100 transition-all duration-300 p-6"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl " />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm text-brand-600 mb-4">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom Section: Warning & Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex-none max-w-4xl mx-auto w-full space-y-4"
                >
                    {/* Clarified Note */}
                    <div className="flex items-center bg-white/60 backdrop-blur border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 gap-4 p-4">
                        <div className="bg-slate-100 rounded-lg shrink-0 text-brand-600 p-3">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                            <span className="font-bold text-slate-900 shrink-0">Please Note:</span>
                            <div className="flex flex-col sm:flex-row text-slate-600 gap-4">
                                <span className="flex items-center gap-2">
                                    <Upload className="h-3.5 w-3.5 text-brand-500" />
                                    Resume import <strong className="text-slate-900">replaces</strong> existing data
                                </span>
                                <span className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-brand-500" />
                                    Use manual entry to <strong className="text-slate-900">edit</strong> after import
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons with Tap Effects */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link
                            to={ROUTES.PROFILE_SETUP.RESUME}
                            className="flex-1 group relative overflow-hidden rounded-xl bg-brand-900 hover:bg-brand-500 text-white shadow-lg hover:shadow-brand-900/20 transition-all font-bold text-lg w-full text-center py-4 px-6"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-full flex items-center justify-center gap-3"
                            >
                                <div className="relative flex items-center justify-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    <span>Import Resume</span>
                                    <ChevronRight className="h-5 w-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        </Link>



                        <Link
                            to={ROUTES.PROFILE_SETUP.PERSONAL}
                            className="flex-1 group rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-brand-700 hover:border-brand-200 hover:bg-brand-50/30 transition-all font-bold text-lg shadow-sm w-full text-center py-4 px-6"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-full flex items-center justify-center gap-3"
                            >
                                <FileText className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                                <span>Manual Entry</span>
                            </motion.div>
                        </Link>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
