export const StatusBar = ({ theme, system }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Use passed system data or defaults
    const status = system?.status || 'ready';
    const cpu = system?.cpu || '0%';
    const memory = system?.memory || '0 MB';
    const version = system?.version || 'REL_2.0.1';

    return (
        <div className={`h-[28px] border-t px-5 flex items-center justify-between text-[10px] font-bold transition-colors duration-300 ${isDark ? 'bg-[#050505] border-[#1A1A1A] text-[#666666]' : 'bg-white border-[#EAEAEA] text-gray-500'
            }`}>
            <div className="flex items-center gap-4">
                <span className={`uppercase tracking-widest font-black ${status === 'ready' ? (isDark ? 'text-emerald-600' : 'text-black') : 'text-amber-500'}`}>
                    {status === 'ready' ? 'System Ready' : status.toUpperCase()}
                </span>
                <span className={`${isDark ? 'text-[#222222]' : 'text-gray-200'} italic`}>/</span>
                <span className={`uppercase tracking-tighter ${isDark ? 'text-[#888888]' : 'text-gray-400'}`}>CPU: {cpu}</span>
                <span className={`${isDark ? 'text-[#222222]' : 'text-gray-200'} italic`}>/</span>
                <span className={`uppercase tracking-tighter ${isDark ? 'text-[#888888]' : 'text-gray-400'}`}>MEM: {memory}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="opacity-40">{version}</span>
            </div>
        </div>
    );
};

