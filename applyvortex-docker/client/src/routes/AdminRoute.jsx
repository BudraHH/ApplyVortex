import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/routes/routes';

import { Briefcase } from 'lucide-react';
import { ReactTyped } from "react-typed";

export function AdminRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 ">
                <div className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
                    {/* Brand Logo Container */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-2 md:p-3 lg:p-4">
                        <Briefcase className="h-10 w-10 text-brand-600 " />
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-2 md:space-y-3 lg:space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900  tracking-tight">ApplyVortex Admin</h2>
                        <div className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4">
                            <ReactTyped
                                strings={["Verifying security clearance...", "Authenticating admin access...", "Loading dashboard resources..."]}
                                typeSpeed={40}
                                backSpeed={50}
                                loop
                                className="text-sm font-medium text-slate-500  min-h-[20px]"
                            />
                            {/* Static Progress Bar Indicator */}
                            <div className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden mt-2 md:mt-3 lg:mt-4">
                                <div className="h-full w-1/2 bg-brand-600  rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={`${ROUTES.LOGIN}?return=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return children;
}
