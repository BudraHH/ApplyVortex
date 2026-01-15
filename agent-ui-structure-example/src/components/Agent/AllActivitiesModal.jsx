import { getTaskTypeLabel } from './constants';

export const AllActivitiesModal = ({ theme, activities, isOpen, onClose }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 ${isDark ? 'bg-black/80' : 'bg-black/20'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-2xl max-h-[85vh] overflow-hidden border transition-all duration-300 shadow-2xl rounded-xl ${isDark ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-[#EAEAEA]'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-[#0D0D0D] border-[#1A1A1A]' : 'bg-[#FAFAFA] border-[#EAEAEA]'
                    }`}>
                    <div>
                        <h2 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Audit Log History</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">Full execution history for current session</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'text-[#666666] hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-black'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className={`p-0 overflow-y-auto max-h-[calc(85vh-70px)] scrollbar-thin ${isDark ? 'scrollbar-thumb-gray-800' : 'scrollbar-thumb-gray-200'
                    }`}>
                    <div className={`divide-y transition-colors ${isDark ? 'divide-[#1A1A1A]' : 'divide-[#EAEAEA]'}`}>
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className={`px-6 py-4 transition-colors group ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#FAFAFA]'
                                    }`}
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse ${activity.type === 'success' ? isDark ? 'bg-[#00FFBB]' : 'bg-emerald-500' :
                                            activity.type === 'warning' ? isDark ? 'bg-[#FFD700]' : 'bg-amber-500' :
                                                activity.type === 'error' ? isDark ? 'bg-[#FF453A]' : 'bg-red-500' :
                                                    isDark ? 'bg-brand-400' : 'bg-brand-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <p className={`text-sm font-medium leading-tight transition-colors ${isDark ? 'text-[#CCCCCC] group-hover:text-white' : 'text-gray-900 group-hover:text-black'
                                                }`}>
                                                {activity.message}
                                            </p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase tracking-widest shrink-0 transition-colors ${activity.type === 'success' ? isDark ? 'text-[#00FFBB] bg-[#00FFBB]/5 border-[#00FFBB]/10' : 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                                    activity.type === 'warning' ? isDark ? 'text-[#FFD700] bg-[#FFD700]/5 border-[#FFD700]/10' : 'text-amber-700 bg-amber-50 border-amber-100' :
                                                        activity.type === 'error' ? isDark ? 'text-[#FF453A] bg-[#FF453A]/5 border-[#FF453A]/10' : 'text-red-700 bg-red-50 border-red-100' :
                                                            isDark ? 'text-brand-400 bg-brand-400/5 border-brand-400/10' : 'text-brand-500 bg-brand-500/5 border-brand-500/10'
                                                }`}>
                                                {activity.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tight">
                                            <span className={isDark ? 'text-brand-400' : 'text-brand-500'}>
                                                {getTaskTypeLabel(activity.taskType)}
                                            </span>
                                            <span className={isDark ? 'text-[#222222]' : 'text-gray-200'}>•</span>
                                            <span className={`font-mono ${isDark ? 'text-[#666666]' : 'text-gray-400'}`}>{activity.timestamp}</span>
                                            <span className={isDark ? 'text-[#222222]' : 'text-gray-200'}>•</span>
                                            <span className={isDark ? 'text-[#666666]' : 'text-gray-400'}>{activity.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
