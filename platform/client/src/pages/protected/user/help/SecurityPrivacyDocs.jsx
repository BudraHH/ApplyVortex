import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, Download, FileText, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";

const InfoCard = ({ icon: Icon, title, children, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
        purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
        rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
    };

    return (
        <div className="group rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300 p-4 lg:p-6">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${colorClasses[color] || colorClasses.blue} mb-3 lg:mb-4`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base lg:text-lg mb-2 lg:mb-4">{title}</h3>
            <div className="text-slate-600 text-xs lg:text-sm leading-relaxed space-y-2 lg:space-y-4">
                {children}
            </div>
        </div>
    );
};

export default function SecurityPrivacyDocs() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden"
        >
            {/* Header */}
            <div className="flex flex-row justify-between items-center border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm px-4 py-3 lg:px-6 lg:py-4 gap-4">
                <div>
                    <div className="flex items-center text-[10px] lg:text-sm text-blue-600 font-bold uppercase tracking-wider gap-2 mb-1 lg:mb-2">
                        <ShieldCheck className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>Trust & Safety</span>
                    </div>
                    <h1 className="text-lg lg:text-xl font-bold text-slate-900">Security & Privacy</h1>
                </div>
                <Link to={ROUTES.HELP}>
                    <Button variant="outline" className="gap-2 h-8 px-3 text-xs lg:h-10 lg:px-4 lg:text-sm">
                        <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto p-3 space-y-4 lg:p-6 lg:space-y-8 max-w-5xl">

                    {/* Hero Section */}
                    <div className="relative rounded-xl bg-slate-900 overflow-hidden text-left p-4 lg:p-8">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -ml-20 -mb-20 rounded-full" />

                        <div className="relative z-10 flex flex-col space-y-2 lg:space-y-4">
                            <h2 className="text-xl lg:text-3xl font-black text-white tracking-tight">Your Data, Your Control.</h2>
                            <p className="text-blue-100/80 text-sm lg:text-lg leading-relaxed font-medium">
                                We believe your career data is personal property. Our architecture is designed from the ground up to be local-first and privacy-centric.
                            </p>
                        </div>
                    </div>

                    {/* Core Principles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard icon={Lock} title="Data Encryption" color="blue">
                            <p>
                                All data transmitted between your device and our servers is encrypted using <strong>TLS 1.3</strong>.
                            </p>
                            <p>
                                Sensitive information stored in our databases (like auth tokens) uses <strong>AES-256 encryption</strong> at rest.
                            </p>
                        </InfoCard>

                        <InfoCard icon={Eye} title="No Data Selling" color="emerald">
                            <p>
                                We <strong>do not sell</strong> your personal data to third-party recruiters, advertisers, or data brokers.
                            </p>
                            <p>
                                Your resume is only processed by our AI algorithms to provide you with insights, matches, and tailoring suggestions.
                            </p>
                        </InfoCard>

                        <InfoCard icon={Download} title="Data Portability" color="purple">
                            <p>
                                You have the right to access and export your data at any time.
                            </p>
                            <p className="flex items-center text-purple-700 font-medium bg-purple-50 rounded-lg w-fit gap-2 mt-2 lg:mt-4 p-2 lg:p-3">
                                <FileText className="w-3 h-3 lg:w-4 lg:h-4" />
                                Settings &gt; Advanced &gt; Export Data
                            </p>
                        </InfoCard>

                        <InfoCard icon={Trash2} title="Right to Erasure" color="rose">
                            <p>
                                If you decide to leave ApplyVortex, you can permanently delete your account.
                            </p>
                            <p>
                                This action is irreversible and wipes all your data from our active servers immediately. Backups are purged within 30 days.
                            </p>
                        </InfoCard>
                    </div>

                    {/* Official Policy Link / Footer */}
                    <div className="border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left pt-8 gap-4">
                        <div className="text-sm text-slate-500">
                            Last updated: <span className="font-semibold text-slate-700">January 14, 2026</span>
                        </div>

                        <div className="flex gap-4">
                            <a href="#" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-2">
                                Privacy Policy
                            </a>
                            <span className="text-slate-300">•</span>
                            <a href="#" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-2">
                                Terms of Service
                            </a>
                            <span className="text-slate-300">•</span>
                            <a href="mailto:security@applyvortex.com" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-2">
                                Security Contact
                            </a>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl flex items-start p-4 lg:p-6 gap-3 lg:gap-4">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 shrink-0 mt-1" />
                        <div className="text-xs lg:text-sm text-blue-800">
                            <strong className="block font-semibold mb-1 lg:mb-2">Compliance Note</strong>
                            ApplyVortex is compliant with GDPR and CCPA regulations. If you reside in the EU or California, you have additional rights regarding the processing of your personal data.
                        </div>
                    </div>

                    <div className="h-4" />
                </div>
            </div>
        </motion.div>
    );
}
