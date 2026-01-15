import { ChevronRight, LayoutDashboard, ClipboardList, Activity, Settings, Globe } from 'lucide-react';

export const Sidebar = ({ theme, selectedTab, onTabChange, isCollapsed, onToggleCollapse }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'portals', label: 'Portals', icon: Globe },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList },
        { id: 'logs', label: 'Activity Log', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className={`flex flex-col transition-all duration-300 ease-in-out border-r ${isDark ? 'bg-[#0A0A0A] border-slate-50/20' : 'bg-white border-[#EAEAEA]'
            } ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = selectedTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center rounded-lg transition-all duration-200 group relative
                                ${isCollapsed ? 'justify-center h-10' : 'px-3 py-2 gap-3 h-10'}
                                ${isActive
                                    ? isDark ? 'bg-white/5 text-white' : 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                                    : isDark
                                        ? 'text-[#666666] hover:bg-white/5 hover:text-white'
                                        : 'text-[#666666] hover:bg-gray-100 hover:text-black'
                                }`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={isCollapsed ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} className="min-w-[18px]" />

                            {!isCollapsed && <span className="font-bold text-sm truncate uppercase tracking-tight">{item.label}</span>}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className={`absolute left-14 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-black uppercase tracking-widest ${isDark ? 'bg-[#1A1A1A] text-white border border-white/5' : 'bg-black text-white'
                                    }`}>
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className={`p-2 border-t ${isDark ? 'border-slate-50/20' : 'border-[#EAEAEA]'}`}>
                <button
                    onClick={onToggleCollapse}
                    className={`w-full flex items-center rounded-lg transition-all duration-200 h-10
                        ${isDark ? 'text-[#666666] hover:bg-white/5 hover:text-white' : 'text-[#666666] hover:bg-gray-100 hover:text-black'}
                        ${isCollapsed ? `justify-center ${isDark ? 'text-brand-400' : 'text-brand-500'}` : 'px-3 gap-3'}`}
                >
                    <ChevronRight size={18} className={`transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`} />
                    {!isCollapsed && <span className="text-sm font-bold uppercase tracking-tight">Collapse</span>}
                </button>
            </div>
        </div>
    );
};
