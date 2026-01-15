import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    Cpu,
    Zap,
    Download,
    ChevronRight,
    Lock
} from "lucide-react";
import { ROUTES } from "@/routes/routes.js";
import { Button } from "@/components/ui/Button";

export default function AgentIntroPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: ShieldCheck,
            title: "100% Privacy",
            desc: "Your resume and personal data never leave your machine for AI processing."
        },
        {
            icon: Cpu,
            title: "Local AI Power",
            desc: "Uses your computer's GPU to run advanced AI models (Llama 3) for free."
        },
        {
            icon: Zap,
            title: "Automation",
            desc: "The Agent handles scraping, tailoring, and applying while you sleep."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden p-6">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-slate-50 to-slate-50" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-brand-50/50 to-transparent rounded-full blur-3xl opacity-60"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden relative p-8"
            >
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-8">

                    {/* Header Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Cpu className="w-10 h-10 text-white" />
                    </div>

                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Meet Your Personal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                                AI Recruiting Agent
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                            ApplyVortex is different. Instead of a cloud server, we give you a powerful
                            <span className="text-slate-900 font-bold"> desktop agent</span> that runs locally on your machine.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-6 pt-4">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                className="bg-white/60 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left p-6"
                            >
                                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-500">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-center border-t border-slate-200/60 gap-4 pt-8 mt-4">
                        <Button
                            onClick={() => navigate('/download-agent')}
                            className="w-full sm:w-auto text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all group px-8 py-4"
                        >
                            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform mr-3" />
                            Download Agent
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => navigate(ROUTES.WELCOME)}
                            className="w-full sm:w-auto text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl px-8 py-4"
                        >
                            I'll do it later
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            <p className="mt-8 text-xs text-slate-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Secure • Private • Local
            </p>
        </div>
    );
}
