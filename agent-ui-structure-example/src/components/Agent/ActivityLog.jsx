import { useState, useMemo } from 'react';
import { Search, Trash2, Download, Filter, Terminal, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const ActivityLog = ({ theme, activities = [] }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');

    const filteredLogs = useMemo(() => {
        return activities.filter(log => {
            const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.taskType?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = filterLevel === 'all' || log.type === filterLevel;
            return matchesSearch && matchesLevel;
        });
    }, [activities, searchQuery, filterLevel]);

    const getLevelIcon = (level) => {
        switch (level) {
            case 'success': return <CheckCircle2 size={12} className={isDark ? 'text-[#00FFBB]' : 'text-emerald-500'} />;
            case 'warning': return <AlertTriangle size={12} className={isDark ? 'text-[#FFD700]' : 'text-amber-500'} />;
            case 'error': return <AlertCircle size={12} className={isDark ? 'text-[#FF453A]' : 'text-red-500'} />;
            default: return <Info size={12} className={isDark ? 'text-brand-400' : 'text-brand-500'} />;
        }
    };

    const getLevelStyle = (level) => {
        switch (level) {
            case 'success': return isDark ? 'text-[#00FFBB] border-[#00FFBB]/10' : 'text-emerald-500 ';
            case 'warning': return isDark ? 'text-[#FFD700] border-[#FFD700]/10' : 'text-amber-500 ';
            case 'error': return isDark ? 'text-[#FF453A] border-[#FF453A]/10' : 'text-red-500 ';
            default: return isDark ? 'text-brand-400 border-brand-400/10' : 'text-brand-500 ';
        }
    };

    return (
        <div className="flex flex-col h-full space-y-5">
            {/* Header and Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-tight transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                        System Audit Logs
                    </h2>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                        Live autonomous agent execution streaming.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm rounded-lg border ${isDark ? 'text-[#666666] bg-white/5 border-white/5 hover:text-white' : 'text-[#666666] bg-white border-[#EAEAEA] hover:text-black hover:bg-gray-50'
                        }`}>
                        <Download size={14} />
                        Export
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm rounded-lg border ${isDark ? 'text-[#FF453A] bg-[#FF453A]/5 border-[#FF453A]/10 hover:bg-[#FF453A]/20' : 'text-red-600 bg-white border-red-100 hover:bg-red-50'
                        }`}>
                        <Trash2 size={14} />
                        Clear
                    </button>
                </div>
            </div>

         
            {/* Logs Terminal */}
            <div className={`flex-1 border rounded-lg overflow-hidden flex flex-col min-h-[400px] transition-colors ${isDark ? 'bg-[#050505] border-[#1A1A1A] shadow-2xl' : 'bg-white border-[#EAEAEA] shadow-sm'
                }`}>
                {/* Terminal Header Decoration */}
               
                {/* Logs List */}
                <div className={`flex-1 overflow-y-auto p-5 font-mono text-[11px] space-y-1 scrollbar-thin ${isDark ? 'bg-[#050505] scrollbar-thumb-gray-800' : 'bg-slate-50 scrollbar-thumb-gray-200'
                    }`}>
                    {filteredLogs.length === 0 ? (
                        <div className={`h-full flex flex-col items-center justify-center opacity-10 space-y-3 font-black uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-black'}`}>
                            <Terminal size={48} strokeWidth={1} />
                            <p className="text-xs">No Logs Detected</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`group flex items-center gap-4 py-1.5 px-3 rounded transition-colors border-l-2 border-transparent ${isDark ? `hover:bg-white/[0.02] hover:border-brand-400/50` : `hover:bg-white hover:border-brand-500/50`
                                    }`}
                            >
                                <span className={`shrink-0 select-none font-bold ${isDark ? 'text-[#777777] group-hover:text-[#999999]' : 'text-gray-500 group-hover:text-black'}`}>
                                    {log.timestamp}
                                </span>

                                <div className={`flex items-center font-black uppercase ${getLevelStyle(log.type)}`}>
                                  {log.type}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className={`leading-relaxed break-words font-medium ${isDark ? 'text-[#CCCCCC] group-hover:text-[#EEEEEE]' : 'text-gray-900'}`}>
                                        {log.message}
                                    </span>
                                    {log.taskType && (
                                        <span className={`ml-3 px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${isDark ? 'bg-white/5 text-brand-400 border-white/5' : 'bg-brand-500/5 text-brand-500 border-brand-500/10'
                                            }`}>
                                            {log.taskType}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div className={`flex items-center gap-2 pl-3 pt-4 ${isDark ? 'text-[#222222]' : 'text-gray-100'}`}>
                        <span className="animate-pulse font-black">_</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
