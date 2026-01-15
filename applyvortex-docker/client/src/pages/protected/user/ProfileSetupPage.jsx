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
        <div className="h-full overflow-hidden flex bg-transparent gap-4">
            {/* Steps Sidebar */}
            <aside
                className={`rounded-xl h-full fixed lg:static inset-y-0 left-0 z-40 bg-white border border-slate-100 hover:border-slate-200 transform transition-all duration-300 ease-in-out 
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64 flex flex-col`}
            >
                <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="border-b border-slate-200 lg:hidden flex items-center justify-between p-4">
                        <h2 className="font-semibold text-lg text-slate-900">Profile Steps</h2>
                        <button onClick={() => setSidebarOpen(false)} className="hover:bg-slate-100 rounded text-slate-600 p-2">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </div>

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
            <main className="flex-1 min-h-0 h-full max-h-full overflow-hidden flex flex-col">
                {/* Mobile Top Bar (Toggle for Steps) */}
                <div className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                        <button
                            className="hover:bg-slate-100 rounded-md transition-colors text-slate-600 p-2"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <span className="font-semibold text-slate-900">Profile Setup</span>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 min-h-0 overflow-y-auto max-h-full custom-scrollbar border border-slate-100 hover:border-slate-200 rounded-xl bg-white">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
