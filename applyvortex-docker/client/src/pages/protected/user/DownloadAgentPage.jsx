import { useNavigate } from "react-router-dom";
import { Download, Monitor, Cpu, Terminal, Shield, Zap, Ghost, ArrowRight, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function DownloadAgentPage() {
    const navigate = useNavigate();
    const { } = useAuthStore();
    const [detectedOS, setDetectedOS] = useState('windows');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('linux') || ua.includes('x11')) setDetectedOS('linux');
        else if (ua.includes('macintosh') || ua.includes('mac os')) setDetectedOS('macos');
        else setDetectedOS('windows');
    }, []);

    const osConfig = {
        windows: { name: 'Windows', icon: <Monitor className="h-5 w-5" />, label: 'Windows 10/11' },
        macos: { name: 'macOS', icon: <Cpu className="h-5 w-5" />, label: 'macOS (Intel/Apple Silicon)' },
        linux: { name: 'Linux', icon: <Terminal className="h-5 w-5" />, label: 'Ubuntu/Debian' }
    };

    const handleDownload = (platformId) => {
        const instructionPath = ROUTES.AGENT_INSTRUCTIONS.replace(':os', platformId);
        navigate(instructionPath);
    };

    const activeOS = osConfig[detectedOS] || osConfig['windows'];

    return (
        <div className="min-h-full w-full bg-white border border-slate-100 hover:border-slate-200 rounded-xl font-sans text-slate-900 mx-auto relative overflow-y-auto custom-scrollbar space-y-6 p-6">

            <div className="flex flex-row justify-between items-start w-full">


                {/* 1. Header */}
                <div className="text-center sm:text-left border-b border-slate-200 space-y-4 pb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Download Agent</h1>
                    <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
                        Install the local agent to automate job applications directly from your machine.
                        Ensure 100% data privacy and residential IP usage.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            {/* 2. Primary Action (Detected OS) */}
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between relative overflow-hidden group p-6 gap-6">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-600" />

                <div className="flex items-center z-10 gap-4">
                    <div className="h-14 w-14 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 border border-brand-100 p-4">
                        {activeOS.icon}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                        <h3 className="font-bold text-xl text-slate-900">Download for {activeOS.name}</h3>
                        <div className="flex items-center text-sm text-slate-500 gap-2">
                            <span>v1.4.2 Stable</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{activeOS.label}</span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => handleDownload(detectedOS)}
                    disabled={isDownloading}
                    className="w-full sm:w-auto min-w-[180px] h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-all active:scale-95"
                >
                    {isDownloading ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Starting...
                        </span>
                    ) : 'Download Installer'}
                </Button>
            </div>

            {/* 3. Secondary Options */}
            <div className="flex flex-col gap-6">

                {/* Other Platforms */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Monitor className="h-4 w-4" /> Other Platforms
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(osConfig).map(([key, config]) => (
                            key !== detectedOS && (
                                <button
                                    key={key}
                                    onClick={() => handleDownload(key)}
                                    className="flex items-center w-full rounded-xl bg-white border border-slate-200 hover:border-brand-300 transition-all text-slate-600 hover:text-slate-900 text-sm text-left group gap-3 p-4"
                                >
                                    <div className="text-slate-400 group-hover:text-brand-600 transition-colors">
                                        {config.icon}
                                    </div>
                                    <span className="font-medium">Download for {config.name}</span>
                                    <Download className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                </button>
                            )
                        ))}
                    </div>
                </div>

                {/* Features / Info */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Security & Performance
                    </h4>
                    <div className="space-y-3">
                        <div className="group rounded-xl bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all p-4">
                            <div className="flex gap-4">
                                <div className="rounded-xl bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-100 transition-colors p-3">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm mb-1">Bank-Grade Privacy</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">Your credentials stay locally encrypted on your device.</p>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-xl bg-white border border-slate-200 hover:border-violet-200 hover:bg-violet-50/30 transition-all p-4">
                            <div className="flex gap-4">
                                <div className="rounded-xl bg-violet-50 text-violet-600 shrink-0 group-hover:bg-violet-100 transition-colors p-3">
                                    <Ghost className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm mb-1">Stealth Mode</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">Undetectable residential IP usage for safe automation.</p>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-xl bg-white border border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 transition-all p-4">
                            <div className="flex gap-4">
                                <div className="rounded-xl bg-amber-50 text-amber-600 shrink-0 group-hover:bg-amber-100 transition-colors p-3">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm mb-1">Zero Latency</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">Native hardware acceleration for maximum speed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 4. Footer Links */}
            <div className="border-t border-slate-200 flex flex-col sm:flex-row text-sm text-slate-500 font-medium pt-4 gap-4">
                <button onClick={() => navigate(ROUTES.MY_AGENTS)} className="hover:text-brand-600 hover:underline flex items-center transition-colors gap-1">
                    View My Agents
                    <ArrowRight className="h-4 w-4" />
                </button>
                <span className="hidden sm:inline text-slate-300">|</span>
                <button onClick={() => navigate(ROUTES.HELP)} className="hover:text-brand-600 hover:underline flex items-center transition-colors gap-1">
                    Installation Guide
                    <HelpCircle className="h-4 w-4" />
                </button>
                <span className="hidden sm:inline text-slate-300">|</span>
                <a href="https://applyvortex.com" target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline flex items-center transition-colors gap-1">
                    System Requirements
                </a>
            </div>

        </div>
    );
}