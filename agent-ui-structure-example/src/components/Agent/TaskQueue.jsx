import { AgentTaskType, TaskPriority, getTaskTypeLabel } from './constants';

export const TaskQueue = ({ theme, tasks = [] }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case TaskPriority.CRITICAL: return isDark ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20' : 'bg-red-50 text-red-600 border-red-100';
            case TaskPriority.HIGH: return isDark ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20' : 'bg-amber-50 text-amber-600 border-amber-100';
            case TaskPriority.MEDIUM: return isDark ? 'bg-brand-400/10 text-brand-400 border-brand-400/20' : 'bg-brand-500/5 text-brand-500 border-brand-500/10';
            default: return isDark ? 'bg-white/5 text-[#666666] border-white/10' : 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'processing':
                return (
                    <div className="flex h-1.5 w-1.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDark ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isDark ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
                    </div>
                );
            case 'pending':
                return <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#222222]' : 'bg-gray-200'}`}></div>;
            case 'waiting':
                return <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#FFD700]' : 'bg-amber-400'}`}></div>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>Active Task Queue</h2>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight border transition-colors ${isDark ? 'bg-white/5 text-[#666666] border-white/10' : 'bg-[#FAFAFA] text-gray-500 border-[#EAEAEA]'
                    }`}>
                    {tasks.length} Operations
                </span>
            </div>

            {tasks.length === 0 ? (
                <div className={`border rounded-lg p-12 text-center shadow-sm transition-colors ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A]' : 'bg-[#FAFAFA] border-[#EAEAEA]'
                    }`}>
                    <svg className={`w-10 h-10 mx-auto mb-4 transition-colors ${isDark ? 'text-[#1A1A1A]' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue Empty</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`border rounded-lg p-5 flex items-center justify-between transition-all shadow-sm group ${isDark ? 'bg-[#0C0C0C] border-[#1A1A1A] hover:border-brand-400/30' : 'bg-white border-[#EAEAEA] hover:border-brand-500/30'
                                }`}
                        >
                            <div className="flex items-center gap-5">
                                <div>
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${isDark ? 'text-[#E5E5E5]' : 'text-black'}`}>
                                            {getTaskTypeLabel(task.taskType)}
                                        </h3>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md border font-black uppercase tracking-widest transition-colors ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] font-medium truncate max-w-[400px] transition-colors ${isDark ? 'text-[#666666]' : 'text-gray-500'}`}>
                                        {task.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-row items-center gap-4">
                                 <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${task.status === 'processing' ? isDark ? 'text-brand-400' : 'text-brand-500' : isDark ? 'text-[#444444]' : 'text-[#666666]'
                                            }`}>
                                        {task.status}
                                    </span>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                        {task.timeAdded}
                                    </div>
                                    <button className={`p-2 rounded-lg transition-all ${isDark ? 'text-[#444444] hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-black'
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
