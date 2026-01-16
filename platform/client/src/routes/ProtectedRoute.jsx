// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from './routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import TopBarClock from '@/components/shared/TopBarClock';
import {
    Briefcase,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';

import { AgentStatusIndicator } from '@/components/agent/AgentStatusIndicator';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, isSidebarCollapsed, toggleSidebar } = useAuthStore();

    if (isLoading) {
        return (
            <div className="h-screen max-h-screen overflow-hidden flex bg-slate-50 transition-colors duration-300 p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                {/* Sidebar Skeleton */}
                <aside
                    className={`hidden lg:flex h-full fixed lg:static inset-y-0 left-0 z-50 bg-white border border-slate-100 rounded-xl transform transition-all duration-300 ease-in-out 
                        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
                        w-64 flex-col relative`}
                >
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Logo Section Skeleton */}
                        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-100 flex-shrink-0 transition-all duration-300`}>
                            <div className="flex items-center group overflow-hidden gap-2 md:gap-3 lg:gap-4">
                                <div className="rounded-lg bg-brand-50 text-brand-600 flex-shrink-0 p-2 md:p-3 lg:p-4">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                {!isSidebarCollapsed && <span>ApplyVortex</span>}
                            </div>
                        </div>

                        {/* Navigation Skeletons */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 space-y-2 md:space-y-3 lg:space-y-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                <div key={i} className={`flex items-center rounded-lg border border-slate-100 ${isSidebarCollapsed ? 'justify-center' : ''} gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4`}>
                                    <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                                    {!isSidebarCollapsed && <Skeleton className="h-4 w-28 rounded" />}
                                </div>
                            ))}
                        </div>

                        {/* Bottom Controls Skeleton */}
                        <div className="border-t border-slate-100 flex-shrink-0 p-2 md:p-3 lg:p-4">
                            <div className="relative flex flex-col gap-2 md:gap-3 lg:gap-4">
                                {/* Logout Skeleton-like Button (Non-functional in skeleton usually, but keeping styling) */}
                                <div className={`flex items-center rounded-lg border border-transparent ${isSidebarCollapsed ? 'justify-center' : ''} gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4`}>
                                    <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                                    {!isSidebarCollapsed && <Skeleton className="h-4 w-28 rounded" />}
                                </div>

                                {/* REAL Functional Collapse Button */}
                                <Button
                                    variant="ghost"
                                    onClick={toggleSidebar}
                                    className={`flex items-center text-slate-400 font-light hover:text-slate-600 w-full transition-all duration-200 cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    {isSidebarCollapsed ? <ChevronRight className="h-5 w-5 flex-shrink-0" /> : <ChevronLeft className="h-5 w-5 flex-shrink-0" />}
                                    {!isSidebarCollapsed && <span className="font-bold">Collapse menu</span>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <div className="flex-1 flex flex-col overflow-hidden h-full transition-all duration-300 gap-2 md:gap-3 lg:gap-4">
                    {/* Top Bar Skeleton */}
                    <div className="bg-white border border-slate-100 rounded-xl h-16 shrink-0 flex items-center justify-between px-2 md:px-3 lg:px-4">
                        <Skeleton className="h-6 w-48 rounded" />
                        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                            <AgentStatusIndicator variant="compact" />
                            <TopBarClock />
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                    </div>

                    {/* Content Area Skeleton */}
                    <main className="flex-1 bg-white border border-slate-100 rounded-xl overflow-hidden p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">

                    </main>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated, preserving current path and query
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return children;
};
