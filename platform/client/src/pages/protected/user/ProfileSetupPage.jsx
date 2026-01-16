import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    User,
    Briefcase,
    Code,
    CheckCircle2,
    Menu,
    GraduationCap,
    SparklesIcon,
    FileIcon,
    ArrowLeft,
    Award,
    ChevronRight,
    ChevronLeft,
    Trophy,
    BookOpen
} from 'lucide-react';
import { ROUTES } from '@/routes/routes.js';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const STEPS = [
    {
        id: 'resume-upload',
        title: 'Resume',
        icon: FileIcon,
        path: ROUTES.PROFILE_SETUP.RESUME,
    },
    {
        id: 'personal',
        title: 'Personal Info',
        icon: User,
        path: ROUTES.PROFILE_SETUP.PERSONAL,
    },
    {
        id: 'education',
        title: 'Education',
        icon: GraduationCap,
        path: ROUTES.PROFILE_SETUP.EDUCATION,
    },
    {
        id: 'experience',
        title: 'Work Experience',
        icon: Briefcase,
        path: ROUTES.PROFILE_SETUP.EXPERIENCE,
    },
    {
        id: 'projects',
        title: 'Projects',
        icon: Code,
        path: ROUTES.PROFILE_SETUP.PROJECTS,
    },
    {
        id: 'research',
        title: 'Research',
        icon: BookOpen,
        path: ROUTES.PROFILE_SETUP.RESEARCH,
    },
    {
        id: 'certifications',
        title: 'Certifications',
        icon: Award,
        path: ROUTES.PROFILE_SETUP.CERTIFICATIONS,
    },
    {
        id: 'accomplishments',
        title: 'Accomplishments',
        icon: Trophy,
        path: ROUTES.PROFILE_SETUP.ACCOMPLISHMENTS,
    },
    {
        id: 'skills',
        title: 'Skills',
        icon: SparklesIcon,
        path: ROUTES.PROFILE_SETUP.SKILLS,
    },
];

export default function ProfileSetupPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isSidebarCollapsed: isCollapsed, toggleSidebar: setIsCollapsed } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const isActive = (path) => location.pathname === path;

    return (
        <div className="h-full overflow-hidden flex bg-transparent gap-0 lg:gap-4">
            {/* Mobile Sidebar (Drawer) */}
            <aside
                className={`fixed rounded-r-xl left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">Profile Sections</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {STEPS.map(({ id, title, icon: Icon, path }) => (
                        <div
                            key={id}
                            onClick={() => {
                                navigate(path);
                                setSidebarOpen(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive(path)
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon className={`h-4 w-4 ${isActive(path) ? 'text-brand-600' : 'text-slate-400'}`} />
                            {title}
                            {isActive(path) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Desktop Sidebar (Static) */}
            <aside
                className={`hidden lg:flex rounded-xl h-full bg-white border border-slate-100 hover:border-slate-200 flex-col transition-all duration-300 ease-in-out 
                    ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {STEPS.map(({ id, title, icon: Icon, path }) => (
                            <div
                                key={id}
                                className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer group border hover:shadow-sm ${isActive(path) ? 'bg-brand-500 text-white border-brand-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600'} ${isCollapsed ? 'justify-center' : ''} gap-3 p-3`}
                                onClick={() => navigate(path)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') navigate(path);
                                }}
                                aria-current={isActive(path) ? 'page' : undefined}
                            >
                                <Icon
                                    className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive(path)
                                        ? 'text-white'
                                        : 'text-slate-400 group-hover:text-slate-900'
                                        }`}
                                />
                                {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300">{title}</span>}
                            </div>
                        ))}
                    </nav>

                    {/* Collapse Button */}
                    <div className="border-t border-slate-200 flex-shrink-0 p-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCollapsed()}
                            className={`flex items-center text-slate-400 font-light hover:text-slate-600 w-full transition-all duration-200 cursor-pointer group   ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                        >
                            {isCollapsed ? <ChevronRight className="h-5 w-5 flex-shrink-0" /> : <ChevronLeft className="h-5 w-5 flex-shrink-0" />}
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300 font-bold">Collapse menu</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-h-0 h-full max-h-full overflow-hidden flex flex-col gap-2">
                {/* Mobile Top Bar (Toggle for Steps) */}
                <div className="rounded-lg lg:hidden flex items-center bg-white  border-b border-slate-200  py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-600"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="text-base font-bold text-slate-800 truncate max-w-[160px]">
                        {STEPS.find(s => s.path === location.pathname)?.title || 'Profile Setup'}
                    </h1>
                </div>

                {/* Page Content */}
                <div className="lg:m-0 rounded-lg  overflow-y-auto max-h-full custom-scrollbar border-t lg:border border-slate-100 hover:border-slate-200 lg:rounded-xl ">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
