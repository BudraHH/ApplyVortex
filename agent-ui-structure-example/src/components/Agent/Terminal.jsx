import { Terminal as TerminalIcon, ChevronDown, ChevronUp, Play, Square, RefreshCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export const Terminal = ({ theme, isOpen, onToggle, logs: externalLogs }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Use external logs if provided, otherwise use internal state for demo
    const [internalLogs, setInternalLogs] = useState([
        { id: 1, timestamp: '19:53:10', level: 'info', message: 'Agent initialized successfully.' },
        { id: 2, timestamp: '19:53:12', level: 'success', message: 'Session #42 started (Stealth Mode: Enabled)' },
        { id: 3, timestamp: '19:53:15', level: 'info', message: 'Navigating to linkedin.com/jobs...' },
        { id: 4, timestamp: '19:53:22', level: 'warning', message: 'Scrolling detected as high speed. Throttling mouse movements.' },
        { id: 5, timestamp: '19:53:30', level: 'info', message: 'Found match: "Senior Frontend Engineer" - Match Score: 94%' },
    ]);

    const logs = externalLogs && externalLogs.length > 0 ? externalLogs : internalLogs;


    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'info': return isDark ? 'text-brand-400' : 'text-brand-500';
            case 'success': return 'text-emerald-500';
            case 'warning': return 'text-amber-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className={`border-y transition-all duration-300 flex flex-col ${isDark ? 'bg-[#050505] border-slate-50/20' : 'bg-white border-[#EAEAEA]'
            } `}>
            {/* Terminal Header */}
            <div
                className={`flex items-center justify-between px-5 py-2.5 cursor-pointer transition-colors ${isDark ? isOpen ? 'bg-[#0A0A0A] hover:bg-[#0D0D0D] border-b border-slate-50/20' : 'bg-[#0A0A0A] hover:bg-[#0D0D0D] border-slate-50/20' : 'bg-[#FAFAFA] hover:bg-gray-50 border-[#EAEAEA]'
                    }`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <TerminalIcon size={14} className={isDark ? 'text-white' : 'text-black'} />
                    <span className={`text-[11px] font-black uppercase tracking-tight ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>Agent Live Logs</span>
                </div>
                <div className='flex items-center gap-4'>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${isDark ? 'bg-[#00FFBB]/5 border-[#00FFBB]/20 text-[#00FFBB]' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDark ? 'text-[#666666]' : 'text-gray-400'} ${isOpen ? 'rotate-0' : 'rotate-180'}`} />
                </div>
            </div>

            {/* Terminal Content */}
            <div
                ref={scrollRef}
                className={`font-mono text-[11px] selection:bg-brand-500/30 scrollbar-thin overflow-y-auto transition-all duration-300 ease-in-out ${isDark ? 'bg-[#050505] scrollbar-thumb-gray-800 selection:bg-brand-400/30' : 'bg-slate-50 scrollbar-thumb-gray-200'
                    } ${isOpen ? 'h-64 p-5 opacity-100' : 'h-0 p-0 opacity-0'}`}
            >
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 mb-2 group">
                        <span className={`shrink-0 font-bold ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>[{log.timestamp}]</span>
                        | <span className={`${log.level === 'info' ? isDark ? 'text-brand-400' : 'text-brand-500' :
                            log.level === 'success' ? isDark ? 'text-[#00FFBB]' : 'text-emerald-600' :
                                log.level === 'warning' ? isDark ? 'text-[#FFD700]' : 'text-orange-600' :
                                    isDark ? 'text-[#FF453A]' : 'text-red-600'
                            } uppercase font-black shrink-0 w-10 tracking-tighter`}>{log.level}</span>
                        | <span className={`font-medium break-all ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900'}`}>{log.message}</span>
                    </div>
                ))}
                <div className={`flex gap-2 items-center mt-4 ${isDark ? 'text-[#222222]' : 'text-gray-200'}`}>
                    <span className="animate-pulse font-black">_</span>
                </div>
            </div>
        </div>
    );
};
