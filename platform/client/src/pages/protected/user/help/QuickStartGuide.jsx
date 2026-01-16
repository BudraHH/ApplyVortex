import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Zap, Download, Monitor, User, Rocket, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";

const StepCard = ({ number, title, description, icon: Icon }) => (
    <div className="flex flex-col h-full rounded-xl bg-white border border-slate-100 hover:border-brand-200 transition-all duration-300 group relative overflow-hidden p-4 lg:p-6">
        {/* Background Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 group-hover:from-brand-50/30 group-hover:to-transparent transition-all duration-500" />

        <div className="relative z-10 flex items-start justify-between mb-4">
            <div className={`rounded-xl bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors duration-300 p-2 lg:p-3`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <span className="text-2xl lg:text-4xl font-black text-slate-100 group-hover:text-brand-100/50 transition-colors select-none">
                0{number}
            </span>
        </div>

        <div className="relative z-10 flex-grow space-y-2 lg:space-y-4">
            <h3 className="font-bold text-slate-900 text-base lg:text-lg group-hover:text-brand-700 transition-colors">{title}</h3>
            <p className="text-slate-500 text-xs lg:text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);

const Section = ({ title, children, className }) => (
    <div className={`${className} space-y-4`}>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-4">
            {title}
        </h2>
        <div className="text-slate-600 leading-relaxed text-[15px] space-y-4">
            {children}
        </div>
    </div>
);

export default function QuickStartGuide() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden"
        >
            {/* Header */}
            <div className="flex flex-row justify-between items-center border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-4 py-3 lg:px-6 lg:py-4 gap-4">

                <div>
                    <div className="flex items-center text-[10px] lg:text-xs text-brand-600 font-bold uppercase tracking-wider gap-2 mb-1 lg:mb-2">
                        <Zap className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                        <span>Getting Started</span>
                    </div>
                    <h1 className="text-lg lg:text-xl font-bold text-slate-900">Quick Start Guide</h1>
                </div>
                <Link to={ROUTES.HELP}>
                    <Button variant="outline" className="gap-2 h-8 px-3 text-xs lg:h-10 lg:px-4 lg:text-sm">
                        <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Content SCROLLABLE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto p-3 space-y-4 lg:p-6 lg:space-y-8 max-w-5xl">

                    {/* Intro */}
                    <div className="max-w-3xl">
                        <p className="text-sm lg:text-lg text-slate-600 leading-relaxed">
                            Welcome to ApplyVortex! We use a unique <strong>local-first</strong> approach to job automation.
                            Follow these steps to deploy your autonomous recruiting agent.
                        </p>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StepCard
                            number="1"
                            title="Download Agent"
                            description="Get the secure desktop application for your OS (Windows, macOS, or Linux)."
                            icon={Download}
                        />
                        <StepCard
                            number="2"
                            title="Install & Pair"
                            description="Run the installer. It detects your config and securely links to your account."
                            icon={Monitor}
                        />
                        <StepCard
                            number="3"
                            title="Complete Profile"
                            description="Fill out your experience, education, and skills on this dashboard. This is the 'Brain' of your agent."
                            icon={User}
                        />
                        <StepCard
                            number="4"
                            title="Launch"
                            description="Start the engine. It runs in the background, autonomously finding & applying to jobs."
                            icon={Rocket}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                        {/* Concept Explanation */}
                        <Section title="Why Local Agent?">
                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 lg:p-6">
                                <p className="mb-4 text-sm lg:text-base">
                                    ApplyVortex is not just a website. To protect your privacy and ensure 100% success rates,
                                    all automation happens <strong>locally on your device</strong>.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start text-sm text-slate-600 gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0 mt-2" />
                                        <span><strong>Stealth Mode:</strong> Keeps your accounts safe by mimicking human behavior.</span>
                                    </li>
                                    <li className="flex items-start text-sm text-slate-600 gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0 mt-2" />
                                        <span><strong>Data Privacy:</strong> Your credentials never leave your computer.</span>
                                    </li>
                                </ul>
                            </div>
                        </Section>

                        {/* Checklist */}
                        <Section title="Next Steps">
                            <ul className="space-y-3">
                                {[
                                    "Monitor the 'Live Operations' terminal in the agent window",
                                    "Check the 'Applications' tab for real-time progress",
                                    "Use the 'Resume Builder' to create targeted CVs",
                                    "Keep your profile updated; the agent syncs automatically"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center rounded-lg bg-white border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group cursor-default gap-3 p-3 lg:p-4">
                                        <div className="h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    </div>

                    {/* CTA */}
                    <div className="rounded-xl relative overflow-hidden bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between group p-4 gap-4 lg:p-8 lg:gap-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-brand-500/30 transition-all duration-700" />

                        <div className="relative z-10 text-center md:text-left space-y-2 lg:space-y-4">
                            <h3 className="text-xl lg:text-2xl font-bold">Ready to automate your search?</h3>
                            <p className="text-slate-400 max-w-md text-sm lg:text-base">Download the agent software in your <span className="font-bold">Personal Computer</span>  and let AI handle the applications while you focus on the interviews.</p>
                        </div>

                        <div className="hidden lg:block relative z-10">
                            <Button
                                as={Link}
                                to={ROUTES.DOWNLOAD_AGENT}
                                variant="secondary">
                                Get Desktop Agent
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="h-4" /> {/* Bottom Spacer */}
                </div>
            </div>
        </motion.div>
    );
}
