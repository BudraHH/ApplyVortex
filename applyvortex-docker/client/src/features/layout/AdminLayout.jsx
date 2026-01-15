import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Activity,
    Server,
    DollarSign,
    Settings,
    ShieldAlert,
    Menu,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    Briefcase
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/routes/routes';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AgentStatusIndicator } from '@/components/agent/AgentStatusIndicator';
import { useAgentStore } from '@/stores/agentStore';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const userMenuRef = useRef(null);

    // Close user menu on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                // setUserMenuOpen(false); // If we add a user menu state
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        // Start polling for agent status globally for admins too
        useAgentStore.getState().startPolling();

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            useAgentStore.getState().stopPolling();
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const navItems = [
        {
            group: 'Management',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
                { label: 'Users', icon: Users, path: '/admin/user' },
                { label: 'Audit Logs', icon: Activity, path: '/admin/audit-logs' },
            ]
        },
        {
            group: 'Operations',
            items: [
                { label: 'Scraper Health', icon: Server, path: '/admin/scrapers' },
                { label: 'AI Queue', icon: Activity, path: '/admin/ai-queue' }, // Using Activity for now, maybe differ later
            ]
        },
        {
            group: 'Business',
            items: [
                { label: 'Financials', icon: DollarSign, path: '/admin/financials' },
            ]
        },
        {
            group: 'System',
            items: [
                { label: 'Configuration', icon: Settings, path: '/admin/config' },
                { label: 'Danger Zone', icon: ShieldAlert, path: '/admin/danger' },
            ]
        }
    ];

    const isActive = (path) => location.pathname === path;

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    return (
        <div className="h-screen max-h-screen overflow-hidden flex bg-slate-50 transition-colors duration-300 p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
            {/* Sidebar */}
            <aside
                className={`rounded-xl h-full fixed lg:static inset-y-0 left-0 z-50 bg-white  border border-brand-200  shadow-sm transform transition-all duration-300 ease-in-out 
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64 flex flex-col relative`}
            >
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Logo Section */}
                    <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-100  flex-shrink-0 transition-all duration-300`}>
                        <Link to="/admin/dashboard" className="flex items-center group overflow-hidden gap-2 md:gap-3 lg:gap-4">
                            <div className="rounded-lg bg-brand-100 text-brand-600 group-hover:bg-brand-200 transition-colors flex-shrink-0 p-2 md:p-3 lg:p-4">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            {!isCollapsed && <span className="text-xl font-bold text-brand-600  whitespace-nowrap transition-opacity duration-300">ApplyVortex</span>}
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden hover:bg-slate-100 rounded-lg transition-colors text-slate-500 p-2 md:p-3 lg:p-4"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 space-y-2 md:space-y-3 lg:space-y-4">
                        {navItems.map((group, groupIndex) => (
                            <div key={group.group}>
                                {!isCollapsed && (
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 md:px-3 lg:px-4 mb-2 md:mb-3 lg:mb-4">
                                        {group.group}
                                    </div>
                                )}
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            title={isCollapsed ? item.label : ''}
                                            className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer group border hover:shadow-sm relative ${isActive(item.path) ? 'bg-brand-500 text-white border-brand-600 shadow-md' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-600' } ${isCollapsed ? 'justify-center' : ''} gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}
                                        >
                                            <item.icon
                                                className={`h-5 w-5 flex-shrink-0 transition-all duration-200
                                                    ${isActive(item.path) ? 'text-white' : 'text-slate-400  group-hover:text-brand-500'}
                                                `}
                                            />
                                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Profile Section */}
                    <div className="border-t border-slate-100 flex-shrink-0 p-2 md:p-3 lg:p-4" ref={userMenuRef}>
                        <div className="relative flex flex-col gap-2 md:gap-3 lg:gap-4">
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className={`flex items-center rounded-lg w-full transition-all duration-200 cursor-pointer group bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600 ${isCollapsed ? 'justify-center' : ''} gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}
                            >
                                {isCollapsed ? <ChevronRight className="h-5 w-5 flex-shrink-0" /> : <ChevronLeft className="h-5 w-5 flex-shrink-0" />}
                                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">Collapse menu</span>}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center rounded-lg w-full transition-all duration-200 cursor-pointer group text-red-600 bg-red-50 hover:bg-red-100 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                            >
                                <LogOut className="h-4 w-4" />
                                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">Logout</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden h-full relative transition-all duration-300 gap-2 md:gap-3 lg:gap-4">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 flex-none bg-white border-b border-slate-200 flex items-center justify-between z-30 px-2 md:px-3 lg:px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="hover:bg-slate-100 rounded-lg transition-colors text-slate-600 p-2 md:p-3 lg:p-4"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-brand-600 ">ApplyVortex Admin</span>
                    <ThemeToggle />
                </header>

                {/* Desktop Top Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 hidden lg:flex h-16 shrink-0 items-center justify-end z-30 px-2 md:px-3 lg:px-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <TopBarClock />
                        <ThemeToggle />
                        <div className="h-9 w-9 rounded-full bg-brand-100  flex items-center justify-center text-brand-700  font-bold text-sm flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all">
                            {userInitials}
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar rounded-xl bg-white shadow-sm relative p-2 md:p-3 lg:p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function TopBarClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden xl:flex items-center text-sm font-medium text-slate-500 bg-slate-50 rounded-lg border border-slate-100 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
            <span className="text-slate-700 ">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <div className="h-4 w-px bg-slate-200 " />
            <span className="tabular-nums font-mono text-brand-600  font-bold">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}
