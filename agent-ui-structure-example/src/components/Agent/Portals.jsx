import { Globe, Shield, CheckCircle2, AlertCircle, ExternalLink, Settings2, Linkedin, LinkedinIcon } from 'lucide-react';

export const Portals = ({ theme }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const portals = [
        {
            id: 'linkedin',
            name: 'LinkedIn',
            url: 'https://linkedin.com',
            status: 'connected',
            lastSync: '2m ago',
            details: 'Active session with 2FA bypass active.',
            successRate: '94%',
            color: 'bg-brand'
        },
        {
            id: 'naukri',
            name: 'Naukri',
            url: 'https://naukri.com',
            status: 'connected',
            lastSync: '15m ago',
            details: 'Profile sync complete. Stealth mode active.',
            successRate: '88%',
            color: 'bg-orange-500'
        },
        {
            id: 'indeed',
            name: 'Indeed',
            url: 'https://indeed.com',
            status: 'disconnected',
            lastSync: '2d ago',
            details: 'Session expired. Re-authentication required.',
            successRate: '-',
            color: 'bg-brand'
        },
        {
            id: 'glassdoor',
            name: 'Glassdoor',
            url: 'https://glassdoor.com',
            status: 'warning',
            lastSync: '1h ago',
            details: 'Bot detection partially triggered. Throttling session.',
            successRate: '42%',
            color: 'bg-emerald-600'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        Managed Portals
                    </h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        Connect and manage agent sessions across job platforms.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {portals.map((portal) => (
                    <div key={portal.id} className={`border transition-all group shadow-sm rounded-lg p-5 flex flex-col gap-5 ${isDark ? 'bg-[#0D0D0D] border-[#1A1A1A] hover:border-brand-400/30' : 'bg-white border-[#EAEAEA] hover:border-brand-500/30'
                        }`}>
                        <div className="flex items-start justify-between ">
                            <div>
                                    <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>{portal.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <ExternalLink size={10} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{portal.url}</span>
                                    </div>
                                </div>
                            <div className="flex gap-6 items-center pr-2">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Last Sync</p>
                                    <p className={`text-xs font-black uppercase transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>{portal.lastSync}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Success</p>
                                    <p className={`text-xs font-black uppercase ${portal.successRate === '-' ? 'text-gray-400' : isDark ? 'text-brand-400' : 'text-brand-500'}`}>{portal.successRate}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`border-t pt-4 flex gap-3 transition-colors ${isDark ? 'border-[#1A1A1A]' : 'border-[#EAEAEA]'}`}>
                            <button className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${portal.status === 'connected'
                                ? isDark ? 'text-[#FF453A] bg-[#FF453A]/5 hover:bg-[#FF453A]/10' : 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                                }`}>
                                {portal.status === 'connected' ? 'Terminate Session' : 'Establish Connection'}
                            </button>
                            <button className={`px-5 py-3 rounded-lg transition-all ${isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-[#FAFAFA] text-gray-400 border border-[#EAEAEA] hover:text-black hover:bg-gray-50'
                                }`}>
                                <Settings2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
