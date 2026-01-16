import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Briefcase,
    FileText,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    User,
    Menu,
    X,
    LayoutDashboard,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Zap,
    Monitor,
    AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/routes/routes';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/Button";

import { notificationsAPI } from '@/services/api/notificationsAPI';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAgentStore } from '@/stores/agentStore';
import { AgentStatusIndicator } from '@/components/agent/AgentStatusIndicator';
import { userAPI } from '@/services/api/userAPI';
import TopBarClock from '@/components/shared/TopBarClock';

export default function ProtectedLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { isSidebarCollapsed, toggleSidebar } = useAuthStore();
    const { unreadCount, fetchUnreadCount, connect, disconnect } = useNotificationStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user, updateUser } = useAuthStore();
    const { toast } = useToast();
    const userMenuRef = useRef(null);
    const [isRestoring, setIsRestoring] = useState(false);

    // Close user menu on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initialize Notifications (Fetch once + WebSocket)
    useEffect(() => {
        fetchUnreadCount();
        connect();

        // Start polling for agent status globally
        useAgentStore.getState().startPolling();

        return () => {
            disconnect();
            useAgentStore.getState().stopPolling();
        };
    }, [fetchUnreadCount, connect, disconnect]);

    // Refresh unread count when navigating between pages
    // This ensures the count updates after leaving notifications page where items may have been auto-marked as read
    useEffect(() => {
        fetchUnreadCount();
    }, [location.pathname, fetchUnreadCount]);

    // Auto-detect removed as per user request to only update settings manually.
    // useEffect(() => { ... }, [user, updateUser]);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await userAPI.restoreAccount();
            const freshUser = await userAPI.getProfile();
            const userData = freshUser?.data || freshUser;
            updateUser({ ...userData, deleted_at: null, is_active: true });
            toast({
                title: "Account Restored!",
                description: "Welcome back! Your account and all data have been restored."
            });
        } catch (error) {
            console.error("Restoration failed:", error);
            toast({
                title: "Error",
                description: "Failed to restore account. Please contact support.",
                variant: "destructive"
            });
        } finally {
            setIsRestoring(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const navItems = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: ROUTES.DASHBOARD,
        },
        {
            label: 'Profile',
            icon: User,
            path: ROUTES.PROFILE_SETUP.BASE,
        },
        {
            label: 'Apply',
            icon: Zap,
            path: ROUTES.APPLY,
        },
        {
            label: 'Jobs',
            icon: Briefcase,
            path: ROUTES.JOBS,
        },
        {
            label: 'Applications',
            icon: FileText,
            path: ROUTES.APPLICATIONS,
        },
        {
            label: 'Agent',
            icon: Monitor,
            path: ROUTES.MY_AGENTS,
        },
        {
            label: 'Notifications',
            icon: Bell,
            path: ROUTES.NOTIFICATIONS,
        },
        {
            label: 'Settings',
            icon: Settings,
            path: ROUTES.SETTINGS.BASE,
        },
        {
            label: 'Help',
            icon: HelpCircle,
            path: ROUTES.HELP,
        },
    ];

    const isActive = (path) => {
        // Optimization is semantically part of the Dashboard/Intelligence context
        if (path === ROUTES.DASHBOARD && location.pathname === ROUTES.OPTIMIZATION) {
            return true;
        }

        if (path === ROUTES.PROFILE_SETUP.BASE || path === ROUTES.SETTINGS.BASE || path === ROUTES.MY_AGENTS || path === ROUTES.JOBS || path === ROUTES.HELP) {
            return location.pathname.startsWith(path);
        }
        return location.pathname === path;
    };

    const getBreadcrumbTitle = () => {
        // Handle standalone agent pages that belong to the Agent categories
        if (location.pathname === ROUTES.DOWNLOAD_AGENT) {
            return "Agent / Download";
        }
        if (location.pathname.startsWith('/agent/download/')) {
            const os = location.pathname.split('/').pop();
            const osLabels = {
                'windows': 'Windows',
                'macos': 'macOS',
                'linux': 'Linux'
            };
            const osLabel = osLabels[os] || (os ? os.charAt(0).toUpperCase() + os.slice(1) : '');
            return `Agent / Download / ${osLabel}`;
        }
        if (location.pathname === ROUTES.AGENT_PAIR) {
            return "Agent / Pair Instance";
        }

        if (location.pathname === ROUTES.OPTIMIZATION) {
            return "Dashboard / Optimization";
        }

        const activeItem = navItems.find((item) => isActive(item.path));
        if (!activeItem) return 'Dashboard';

        // Specific sub-page mapping for Profile Setup
        if (activeItem.path === ROUTES.PROFILE_SETUP.BASE) {
            const segment = location.pathname.split('/').pop();
            const segmentLabels = {
                'resume-upload': 'Resume',
                'personal': 'Personal Information',
                'education': 'Education',
                'projects': 'Projects',
                'research': 'Research',
                'skills': 'Skills',
                'experience': 'Experience',
                'certifications': 'Certifications',
                'accomplishments': 'Accomplishments'
            };
            const subLabel = segmentLabels[segment] || (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : '');
            return subLabel ? `${activeItem.label} / ${subLabel}` : activeItem.label;
        }

        // Specific sub-page mapping for Settings
        if (activeItem.path === ROUTES.SETTINGS.BASE) {
            return activeItem.label;
        }

        // Main Agent Fleet page
        if (activeItem.path === ROUTES.MY_AGENTS) {
            return "Agent / Fleet Status";
        }

        // Job Detail Page
        if (activeItem.path === ROUTES.JOBS && location.pathname !== ROUTES.JOBS) {
            return "Jobs / Detail & Analysis";
        }

        // Help Subpages
        if (location.pathname === `${ROUTES.HELP}/quick-start-guide`) return "Help / Quick Start Guide";
        if (location.pathname === `${ROUTES.HELP}/resume-builder`) return "Help / Resume Builder";
        if (location.pathname === `${ROUTES.HELP}/security-privacy`) return "Help / Security & Privacy";

        return activeItem.label;
    };

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="h-screen overflow-hidden flex bg-slate-50 transition-colors duration-300 p-0 lg:p-4 gap-0 lg:gap-4">
            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 rounded-r-xl my-2  shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Mobile Logo Section */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
                        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3">
                            <div className="text-brand-600">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold text-brand-600">ApplyVortex</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 -mr-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mobile Navigation Links */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-2">
                        {navItems.map((item) => {
                            const isNotif = item.label === 'Notifications';
                            const count = isNotif ? (Number(unreadCount)) : 0;
                            const hasUnread = count > 0;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center rounded-lg transition-all duration-200 group border relative px-3 py-3 gap-3
                                        ${active
                                            ? 'bg-brand-500 text-white border-brand-200 shadow-sm'
                                            : 'border-transparent hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                                        {hasUnread && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border border-white"></span>
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile User Section */}
                    <div className="border-t border-slate-100 p-4 space-y-2">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleLogout}
                            className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-50 gap-3"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col relative h-full bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all duration-300
                    ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Desktop Logo Section */}
                    <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-100 flex-shrink-0 transition-all duration-300`}>
                        <Link to={ROUTES.DASHBOARD} className="flex flex-row items-center group overflow-hidden gap-4">
                            <div className="text-brand-600">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            {!isSidebarCollapsed && <span className="text-xl font-bold text-brand-600 whitespace-nowrap transition-opacity duration-300">ApplyVortex</span>}
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden px-4 py-4 space-y-2">
                        {navItems.map((item) => {
                            const isNotif = item.label === 'Notifications';
                            const count = isNotif ? (Number(unreadCount)) : 0;
                            const hasUnread = count > 0;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={isSidebarCollapsed ? item.label : ''}
                                    className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer group border hover:shadow-sm relative ${active ? 'bg-brand-500 text-white border-brand-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600'} ${isSidebarCollapsed ? 'justify-center' : ''} gap-4 p-3`}
                                >
                                    <div className="relative">
                                        <item.icon
                                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 fill-none
                                            ${active
                                                    ? 'text-white'
                                                    : hasUnread
                                                        ? 'animate-vibrate text-brand-600'
                                                        : 'text-slate-400 group-hover:text-slate-900'
                                                }
                                        `}
                                        />
                                        {hasUnread && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border border-white"></span>
                                            </span>
                                        )}
                                    </div>
                                    {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop User Section */}
                    <div className="border-t border-slate-100 flex-shrink-0 p-4" ref={userMenuRef}>
                        <div className="relative flex flex-col gap-2">
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={handleLogout}
                                className={`w-full transition-all duration-200 text-red-300 hover:bg-red-50 hover:text-red-500 border border-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3`}
                            >
                                <LogOut className="h-4 w-4 flex-shrink-0" />
                                <span className={isSidebarCollapsed ? "hidden" : "whitespace-nowrap overflow-hidden transition-all duration-300 font-light"}>Logout</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={toggleSidebar}
                                className={`text-slate-300 hover:text-slate-400 w-full transition-all duration-200    ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                            >
                                {isSidebarCollapsed ? <ChevronRight className="h-5 w-5 flex-shrink-0" /> : <ChevronLeft className="h-5 w-5 flex-shrink-0" />}
                                <span className={isSidebarCollapsed ? "hidden" : "whitespace-nowrap overflow-hidden transition-all duration-300 font-light "}>Collapse menu</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {
                sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )
            }

            {/* Main Content */}
            <div className="m-2 lg:m-0 flex-1 w-full flex flex-col rounded-none lg:rounded-xl overflow-hidden h-full relative transition-all duration-300 gap-2 lg:gap-4">
                {/* Mobile Header */}
                <header className="lg:hidden h-14 flex-none bg-white border-b border-slate-200 flex items-center justify-between z-30 py-2 rounded-lg ">
                    <div className="flex items-center ">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                            className="text-slate-600"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-base font-bold text-slate-800 truncate max-w-[160px]">
                            {getBreadcrumbTitle().split(' / ')[0]}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                        <AgentStatusIndicator />
                        <button
                            onClick={() => navigate(ROUTES.SETTINGS.BASE)}
                            className={`flex items-center rounded-xl hover:bg-slate-50 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} gap-3`}
                        >
                            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 border border-transparent hover:border-2 hover:border-slate-300 font-bold text-sm flex-shrink-0">
                                {userInitials}
                            </div>
                        </button>
                    </div>

                </header>

                {/* Desktop Top Bar */}
                <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl hidden lg:flex h-16 shrink-0 items-center justify-between z-30 px-6">
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        {getBreadcrumbTitle().split(' / ').map((text, i, arr) => (
                            <React.Fragment key={text}>
                                <span className={i === arr.length - 1 ? 'text-brand-500' : 'text-slate-500 font-medium'}>
                                    {text}
                                </span>
                                {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                            </React.Fragment>
                        ))}
                    </h1>


                    <div className="flex items-center justify-end gap-4">
                        <AgentStatusIndicator variant="compact" />
                        <TopBarClock />

                        <button
                            onClick={() => navigate(ROUTES.SETTINGS.BASE)}
                            className={`flex items-center rounded-xl hover:bg-slate-50 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} gap-3`}
                        >
                            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 border border-transparent hover:border-2 hover:border-slate-300 font-bold text-sm flex-shrink-0">
                                {userInitials}
                            </div>
                        </button>
                    </div>
                </div>


                {/* Page Content */}
                <main className=" flex-1 overflow-hidden shadow-none lg:shadow-sm relative flex flex-col">
                    <Outlet />
                </main>
            </div>
        </div >
    );
}
