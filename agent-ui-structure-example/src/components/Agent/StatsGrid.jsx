export const StatsGrid = ({ theme, stats = [] }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`border transition-all duration-300 rounded-lg p-4 shadow-sm ${isDark
                        ? 'bg-[#0C0C0C] border-[#1A1A1A] hover:border-brand-400/30'
                        : 'bg-white border-[#EAEAEA] hover:border-brand-500/30'
                        }`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <span className={`text-2xl font-black transition-colors tracking-tight ${stat.color === 'brand' ? isDark ? 'text-brand-400' : 'text-brand-500' :
                                stat.color === 'emerald' ? isDark ? 'text-[#00FFBB]' : 'text-emerald-600' :
                                    stat.color === 'orange' ? isDark ? 'text-[#FFD700]' : 'text-orange-600' :
                                        isDark ? 'text-brand-400' : 'text-brand-500'
                            }`}>
                            {stat.value}
                        </span>
                    </div>
                    <div>
                        <div className={`text-[11px] font-black uppercase tracking-tight mb-0.5 transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                            {stat.label}
                        </div>
                        <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wide">{stat.sublabel}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
