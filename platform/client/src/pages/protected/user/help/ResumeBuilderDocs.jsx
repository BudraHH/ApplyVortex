import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Wand2, RefreshCw, FileCheck, Layers, ChevronRight, PenTool } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";

const FeatureBlock = ({ title, description, icon: Icon, color }) => (
    <div className="flex items-start rounded-xl hover:bg-white transition-colors gap-4 p-4">
        <div className={`rounded-xl ${color} bg-opacity-10 shrink-0 p-3`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">{title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
        </div>
    </div>
);

export default function ResumeBuilderDocs() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col bg-white rounded-xl border border-slate-100 hover:border-slate-200 overflow-hidden"
        >
            {/* Header */}
            <div className="flex flex-row justify-between items-center border-b border-slate-100 bg-slate-50/50 rounded-t-xl sticky top-0 z-20 backdrop-blur-sm px-6 py-4 gap-4">
                <div>
                    <div className="flex items-center text-sm text-brand-600 font-bold uppercase tracking-wider gap-2 mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Tools & Features</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Resume Builder</h1>
                </div>
                <Link to={ROUTES.HELP}>
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto p-6 space-y-8 max-w-5xl">

                    {/* Intro Hero */}
                    <div className="relative rounded-xl bg-slate-900 text-white overflow-hidden flex flex-col sm:flex-row items-center p-8 gap-6">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 blur-[100px] -mr-20 -mt-20 rounded-full" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] -ml-20 -mb-20 rounded-full" />

                        <div className="relative z-10 flex-1 text-left space-y-4">
                            <h2 className="text-3xl font-black tracking-tight">Craft the Perfect Resume</h2>
                            <p className="text-brand-100/90 text-lg leading-relaxed font-medium">
                                Create tailored, expert-level resumes for every application with our AI-powered architect.
                            </p>
                            <Button
                                onClick={() => navigate(ROUTES.PROFILE_SETUP.BASE)}
                                className="bg-brand-600 hover:bg-brand-500 text-white border-0 font-semibold"
                            >
                                Open Builder
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 bg-slate-50 rounded-xl border border-slate-100 gap-4 p-4">
                        <FeatureBlock
                            title="AI Parsing"
                            description="Automatically extracts skills, experience, and education from your existing documents."
                            icon={Wand2}
                            color="bg-brand-500"
                        />
                        <FeatureBlock
                            title="Smart Tailoring"
                            description="Rephrases bullet points to match keywords found in job descriptions."
                            icon={RefreshCw}
                            color="bg-brand-500"
                        />
                        <FeatureBlock
                            title="ATS Friendly"
                            description="Clean, standard formatting that passes Applicant Tracking Systems easily."
                            icon={FileCheck}
                            color="bg-emerald-500"
                        />
                        <FeatureBlock
                            title="Version Control"
                            description="Keep multiple versions of your resume for different roles or industries."
                            icon={Layers}
                            color="bg-indigo-500"
                        />
                    </div>

                    {/* How it works */}
                    <div className="space-y-6">
                        <div className="flex items-center border-b border-slate-100 gap-4 pb-4">
                            <div className="h-8 w-1 rounded-full bg-brand-500" />
                            <h2 className="text-xl font-bold text-slate-900">How It Works</h2>
                        </div>

                        <div className="grid gap-6">
                            {[
                                { title: "Import Data", desc: "Go to Profile > Resume and upload your master PDF. Our AI will digitize your entire career history." },
                                { title: "Review & Polish", desc: "Verify the extracted data. Fix any typos and flesh out descriptions with quantifiable achievements." },
                                { title: "Create a Target Version", desc: "When applying for a specific role, click 'Tailor Resume'. Paste the job description, and watch the AI highlight relevant skills." },
                                { title: "Export", desc: "Download as a perfectly formatted PDF consistent with industry standards." }
                            ].map((step, i) => (
                                <div key={i} className="group flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:border-brand-500 group-hover:text-brand-600 transition-colors">
                                        {i + 1}
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 flex p-6 gap-4">
                        <div className="bg-amber-100 rounded-lg h-fit shrink-0 text-amber-600 p-3">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">Pro Tip</h3>
                            <p className="text-amber-800/80 text-sm leading-relaxed">
                                Always keep your "Master Profile" up to date with every single project and skill. The Resume Builder works best when it has a large pool of information to select from when tailoring for specific niche roles.
                            </p>
                        </div>
                    </div>

                    <div className="h-4" />
                </div>
            </div>
        </motion.div>
    );
}
