import { getTaskTypeLabel } from './constants';

export const ActivityFeed = ({ theme, activities, onViewAll }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className={`border shadow-sm overflow-hidden transition-all duration-300 rounded-lg ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A]' : 'bg-white border-[#EAEAEA]'
            }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${isDark ? 'border-[#1A1A1A] bg-[#0D0D0D]' : 'border-[#EAEAEA] bg-[#FAFAFA]'
                }`}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>Recent Activity</h3>
                <button
                    onClick={onViewAll}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-brand-400 hover:text-brand-400/80' : 'text-brand-500 hover:text-brand-500/80'
                        }`}
                >
                    Expand
                </button>
            </div>
            <div className={`divide-y transition-colors ${isDark ? 'divide-[#1A1A1A]' : 'divide-[#EAEAEA]'}`}>
                {activities.slice(0, 4).map((activity) => (
                    <div
                        key={activity.id}
                        className={`px-5 py-3.5 transition-colors cursor-pointer group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-colors ${activity.type === 'success' ? isDark ? 'bg-[#00FFBB]' : 'bg-emerald-500' :
                                activity.type === 'warning' ? isDark ? 'bg-[#FFD700]' : 'bg-amber-500' :
                                    activity.type === 'error' ? isDark ? 'bg-[#FF453A]' : 'bg-red-500' :
                                        isDark ? 'bg-brand-400' : 'bg-brand-500'
                                }`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className={`text-sm font-medium leading-tight group-hover:text-brand-400 transition-colors ${isDark ? 'text-[#CCCCCC]' : 'text-gray-900 group-hover:text-brand-500'
                                        }`}>
                                        {activity.message}
                                    </p>
                                    <span className={`text-[10px] font-bold font-mono flex-shrink-0 transition-colors ${isDark ? 'text-[#444444]' : 'text-gray-300'
                                        }`}>
                                        {activity.timestamp}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#666666] uppercase tracking-wider">
                                        {getTaskTypeLabel(activity.taskType)}
                                    </span>
                                    <span className="text-[10px] text-gray-200 opacity-20">•</span>
                                    <span className="text-[10px] font-bold text-[#666666] uppercase tracking-widest">{activity.time}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
