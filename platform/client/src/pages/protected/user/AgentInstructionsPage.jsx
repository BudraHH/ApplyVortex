import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    Monitor,
    Cpu,
    Terminal,
    CheckCircle2,
    Copy,
    AlertTriangle,
    Download,
    Loader2
} from 'lucide-react';
import { ROUTES } from '@/routes/routes';
import { useToast } from '@/hooks/use-toast';

export default function AgentInstructionsPage() {
    const { os } = useParams();
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const platform = os?.toLowerCase() || 'windows';

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard",
            description: "Command is ready to paste."
        });
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        const osMap = { 'windows': 'win', 'linux': 'linux', 'macos': 'mac' };
        const osParam = osMap[platform] || 'win';

        try {
            const response = await fetch(`/api/v1/agent-keys/generate?os=${osParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `${platform} Desktop Agent` })
            });

            if (!response.ok) throw new Error("Failed to generate installer");

            const data = await response.json();

            // 1. Download Config
            const blob = new Blob([JSON.stringify(data.agent_config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'agent_config.json';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // 2. Download Installer (delayed)
            setTimeout(() => {
                const installerLink = document.createElement('a');
                installerLink.href = data.installer_url;
                installerLink.download = '';
                document.body.appendChild(installerLink);
                installerLink.click();
                document.body.removeChild(installerLink);

                toast({
                    title: "Download Started",
                    description: "Your installer and config file are downloading."
                });
            }, 1000);

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Download Failed",
                description: error.message
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const instructionData = {
        windows: {
            title: 'Windows Installation',
            icon: <Monitor className="h-8 w-8 text-black" />,
            steps: [
                {
                    title: "Locate Installer",
                    desc: "Open your 'Downloads' folder and find 'ApplyVortex-Agent-Setup.exe'.",
                    tip: "If you don't see the file, check your browser's download history (Ctrl+J)."
                },
                {
                    title: "Run & Bypass SmartScreen",
                    desc: "Double-click to run. If Microsoft Defender SmartScreen appears, click 'More Info' -> 'Run anyway'.",
                },
                {
                    title: "Blocked? Use PowerShell",
                    desc: "If you cannot run the installer, use this PowerShell command to unblock it:",
                    command: `Unblock-File -Path "$env:USERPROFILE\\Downloads\\ApplyVortex-Agent-Setup.exe"`
                },
                {
                    title: "Installation & Firewall",
                    desc: "Follow the setup wizard. When prompted by Windows Firewall, ensure both 'Private' and 'Public' networks are checked to allow communication.",
                }
            ]
        },
        macos: {
            title: 'macOS Installation',
            icon: <Cpu className="h-8 w-8 text-black" />,
            steps: [
                {
                    title: "Open Disk Image",
                    desc: "Locate the downloaded .dmg file and double-click to mount it.",
                },
                {
                    title: "Drag to Applications",
                    desc: "Drag the ApplyVortex logo into the Applications folder shortcut in the window.",
                },
                {
                    title: "Fix 'App is Damaged'",
                    desc: "If you get a 'damaged' error, run this command in Terminal to fix permissions:",
                    command: "xattr -cr /Applications/ApplyVortex.app"
                },
                {
                    title: "First Launch",
                    desc: "Right-click (Control+Click) 'ApplyVortex' in Applications and select 'Open' to bypass Gatekeeper.",
                    tip: "You only need to do this once. Future launches can be done normally via Spotlight or Launchpad."
                }
            ]
        },
        linux: {
            title: 'Linux Installation',
            icon: <Terminal className="h-8 w-8 text-black" />,
            steps: [
                {
                    title: "Open Terminal",
                    desc: "Launch your terminal (Ctrl+Alt+T) and navigate to your downloads directory.",
                    command: "cd ~/Downloads"
                },
                {
                    title: "Make Executable",
                    desc: "The AppImage needs execution permissions to run. Run this command:",
                    command: "chmod +x applyvortex-agent-v1.4.2.AppImage"
                },
                {
                    title: "Launch Agent",
                    desc: "Start the agent directly from the terminal to see initial logs.",
                    command: "./applyvortex-agent-v1.4.2.AppImage"
                },
                {
                    title: "Missing Dependencies?",
                    desc: "If the app does not open (common on Ubuntu 22.04+), you may need FUSE 2.",
                    command: "sudo apt install libfuse2"
                }
            ]
        }
    };

    const current = instructionData[platform] || instructionData.windows;

    return (
        <div className="min-h-full w-full bg-white border border-slate-100 hover:border-slate-200 rounded-xl font-sans text-slate-900 mx-auto relative overflow-y-auto custom-scrollbar p-6 space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 gap-4 pb-6">
                <div className="flex items-center gap-4">
                    <div className="">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
                        <p className="text-slate-500 font-medium text-lg">Setup guide for your autonomous worker.</p>
                    </div>
                </div>

                <div className="flex items-center w-full md:w-auto gap-4">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Download Installer
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Steps Column */}
                <div className="md:col-span-8 space-y-6">
                    {current.steps.map((step, idx) => (
                        <div key={idx} className="flex group gap-4">
                            {/* Step Number */}
                            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-lg group-hover:border-slate-300 transition-all">
                                {idx + 1}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 pt-2 space-y-2">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                                    <p className="text-slate-500 leading-relaxed mt-2">
                                        {step.desc}
                                    </p>
                                </div>

                                {step.command && (
                                    <div className={`rounded-lg overflow-hidden border shadow-sm ${platform === 'windows' ? 'bg-[#0c0c0c] border-[#333]' : platform === 'macos' ? 'bg-slate-950 border-slate-800' : 'bg-[#300a24] border-slate-700'} mt-4`}>
                                        {/* Terminal Header */}
                                        <div className={`flex items-center border-b ${platform === 'windows' ? 'justify-between bg-[#1f1f1f] border-transparent' : platform === 'macos' ? 'gap-1.5 bg-slate-900/50 border-white/5' : 'justify-between bg-[#3e3e3e] border-transparent'} px-4 py-3`}>
                                            {platform === 'macos' && (
                                                <>
                                                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                                                </>
                                            )}

                                            {platform === 'windows' && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Terminal className="h-3 w-3 text-white" />
                                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-white">Administrator: PowerShell</span>
                                                    </div>
                                                    <div className="flex opacity-50 gap-2">
                                                        <div className="w-2 h-[2px] bg-white self-center"></div>
                                                        <div className="w-2 h-2 border border-white"></div>
                                                        <div className="w-2 h-2 bg-white"></div>
                                                    </div>
                                                </>
                                            )}

                                            {platform === 'linux' && (
                                                <>
                                                    <span className="text-xs text-slate-300 font-medium opacity-80 pl-2">Terminal</span>
                                                    <div className="flex gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center text-[8px]">-</div>
                                                        <div className="w-3 h-3 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center text-[8px]">□</div>
                                                        <div className="w-3 h-3 rounded-full bg-orange-500/80 text-white flex items-center justify-center text-[8px]">×</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Terminal Content */}
                                        <div className="flex items-center justify-between group/code relative p-4">
                                            <div className="flex text-sm font-mono overflow-x-auto custom-scrollbar items-center gap-2">
                                                <span className={`font-bold select-none shrink-0 ${platform === 'windows' ? 'text-blue-300' :
                                                    platform === 'linux' ? 'text-green-400' :
                                                        'text-brand-400'
                                                    }`}>
                                                    {platform === 'windows' ? 'PS >' : '$'}
                                                </span>
                                                <div className="flex-1">
                                                    <span className={`select-none ${platform === 'windows' ? 'hidden' : 'inline-block opacity-50'} mr-2`}></span>
                                                    <code className="text-slate-200 tracking-tight whitespace-nowrap">{step.command}</code>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(step.command)}
                                                className="hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors shrink-0 p-2 ml-2"
                                                title="Copy"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step.tip && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl flex items-start p-4 gap-4">
                                        <div className="bg-amber-100 rounded-lg shrink-0 p-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div className="space-y-1 pt-1">
                                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Note</p>
                                            <p className="text-sm text-amber-900/80 leading-relaxed">
                                                {step.tip}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Column */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl sticky top-6 p-6 space-y-6">
                        <div className="flex items-center border-b border-slate-100 gap-3 pb-4">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">Next Steps</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 1: Authorization</p>
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                                    <p className="font-bold text-slate-900">Connect Instance</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">Link your newly installed worker to the cloud.</p>
                                    <Link to={ROUTES.AGENT_PAIR} className="block pt-2">
                                        <Button
                                            className="w-full" variant="primary">
                                            Pair Agent <ArrowLeft className="h-3 w-3 rotate-180" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 2: Configuration</p>
                                <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                                    <p className="font-bold text-slate-900">Verify Sessions</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">Ensure your browser sessions are active.</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-4">
                            <Link to={ROUTES.HELP}>
                                <Button variant="outline"
                                    className="w-full">
                                    Open Help Center
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
