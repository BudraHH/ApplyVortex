// src/routes/Router.jsx
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import Typed from 'typed.js';
import { ROUTES } from "./routes";

// Layouts
// import PublicLayout from "@/features/layout/PublicLayout";
import ProtectedLayout from "@/features/layout/ProtectedLayout.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { AdminRoute } from "./AdminRoute.jsx";
import AdminLayout from "@/features/layout/AdminLayout.jsx";
import AdminDashboardPage from "@/pages/protected/admin/AdminDashboardPage.jsx";
import AdminUsersPage from "@/pages/protected/admin/AdminUsersPage.jsx";
import AdminAddUserPage from "@/pages/protected/admin/AdminAddUserPage.jsx";
import AdminAuditLogsPage from "@/pages/protected/admin/AdminAuditLogsPage.jsx";
import AdminUserDetailsPage from "@/pages/protected/admin/AdminUserDetailsPage.jsx";
import AdminConfigPage from "@/pages/protected/admin/AdminConfigPage.jsx";
import AdminDangerZonePage from "@/pages/protected/admin/AdminDangerZonePage.jsx";

// Public Pages
import LandingPage from "@/pages/public/LandingPage";
import WatchDemoPage from "@/pages/public/WatchDemoPage";
import PaymentPage from "@/pages/public/PaymentPage";
import AboutPage from "@/pages/public/AboutPage";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";

// Protected Pages
import DashboardPage from "@/pages/protected/user/DashBoardPage.jsx";
import ProfileSetupPage from "@/pages/protected/user/ProfileSetupPage.jsx";
import ApplicationsPage from "@/pages/protected/user/ApplicationsPage.jsx";
import NotificationsPage from "@/pages/protected/user/NotificationsPage.jsx";
import SettingsPage from "@/pages/protected/user/SettingsPage.jsx";
import HelpPage from "@/pages/protected/user/HelpPage.jsx";
import WelcomePage from "@/pages/protected/user/WelcomePage.jsx";
import ApplyPage from "@/pages/protected/user/ApplyPage.jsx";
import JobsPage from "@/pages/protected/user/JobsPage.jsx";
import JobDetailAnalysis from "@/pages/protected/user/JobDetailAnalysis.jsx";
import OptimizationPage from "@/pages/protected/user/OptimizationPage.jsx";
import MyAgentsPage from "@/pages/protected/user/MyAgentsPage.jsx";
import PairingPage from "@/pages/protected/user/agent/PairingPage.jsx";
import DownloadAgentPage from "@/pages/protected/user/DownloadAgentPage.jsx";
import AgentInstructionsPage from "@/pages/protected/user/AgentInstructionsPage.jsx";
import AgentIntroPage from "@/pages/protected/user/AgentIntroPage.jsx";


import PersonalInfoForm from "@/pages/protected/user/profile-setup/ProfileInfoForm.jsx";
import ExperienceForm from "@/pages/protected/user/profile-setup/ExperienceForm.jsx";
import EducationForm from "@/pages/protected/user/profile-setup/EducationForm.jsx";
import ProjectForm from "@/pages/protected/user/profile-setup/ProjectForm.jsx";
import ResearchForm from "@/pages/protected/user/profile-setup/ResearchForm.jsx";
import SkillsLibraryForm from "@/pages/protected/user/profile-setup/SkillsLibraryForm.jsx";
import ResumeUploadPage from "@/pages/protected/user/profile-setup/ResumeUploadPage.jsx";
import CertificationForm from "@/pages/protected/user/profile-setup/CertificationForm.jsx";
import AccomplishmentForm from "@/pages/protected/user/profile-setup/AccomplishmentForm.jsx";

// Help Pages
import QuickStartGuide from "@/pages/protected/user/help/QuickStartGuide.jsx";
import ResumeBuilderDocs from "@/pages/protected/user/help/ResumeBuilderDocs.jsx";
import SecurityPrivacyDocs from "@/pages/protected/user/help/SecurityPrivacyDocs.jsx";

// Settings Pages
// Settings Pages are now consolidated into SettingsPage.jsx

import UnauthorizedPage from "@/pages/error/UnauthorizedPage.jsx";
import ErrorPage from "@/pages/error/ErrorPage.jsx";
import NotFoundPage from "@/pages/error/NotFoundPage.jsx";


function PublicRoute({ children, redirectTo = ROUTES.DASHBOARD }) {
    const { isAuthenticated, initAuth } = useAuthStore();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const el = useRef(null);

    // Initial Auth Check
    useEffect(() => {
        const verifyAuth = async () => {
            await initAuth();
            setIsCheckingAuth(false);
        };
        verifyAuth();
    }, [initAuth]);

    // Typed.js Animation
    useEffect(() => {
        if (isCheckingAuth && el.current) {
            const typed = new Typed(el.current, {
                strings: ['Loading ApplyVortex...'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 1000,
                startDelay: 100,
                loop: true,
                showCursor: true,
                cursorChar: '|',
            });

            return () => {
                typed.destroy();
            };
        }
    }, [isCheckingAuth]);

    // Render Loading State
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-2 md:p-3 lg:p-4">
                <div className="text-center">
                    <span ref={el} className="text-2xl font-bold text-black font-mono"></span>
                </div>
            </div>
        );
    }

    // Redirect if Authenticated
    if (isAuthenticated) {
        const urlParams = new URLSearchParams(location.search);
        const returnUrl = urlParams.get("return");
        let target = returnUrl ? decodeURIComponent(returnUrl) : redirectTo;

        // Force Admin Redirect if user is admin
        const { user } = useAuthStore.getState();
        if (user?.role === 'admin' || user?.role === 'super-admin') {
            target = '/admin/dashboard';
        }

        return <Navigate to={target} replace />;
    }

    return children;
}

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public-only routes */}
                <Route
                    path={ROUTES.HOME}
                    element={
                        <PublicRoute>
                            <LandingPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path={ROUTES.ABOUT}
                    element={
                        <PublicRoute>
                            <AboutPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path={ROUTES.WATCH_DEMO}
                    element={
                        <PublicRoute>
                            <WatchDemoPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path={ROUTES.PAYMENT}
                    element={
                        <PublicRoute>
                            <PaymentPage />
                        </PublicRoute>
                    }
                />

                <Route
                    path={ROUTES.LOGIN}
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path={ROUTES.SIGNUP}
                    element={
                        <PublicRoute redirectTo={ROUTES.AGENT_INTRO}>
                            <SignUpPage />
                        </PublicRoute>
                    }
                />

                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
                <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />


                {/* Protected Welcome page, NOT inside ProtectedLayout */}
                <Route
                    path={ROUTES.WELCOME}
                    element={
                        <ProtectedRoute>
                            <WelcomePage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={ROUTES.AGENT_INTRO}
                    element={
                        <ProtectedRoute>
                            <AgentIntroPage />
                        </ProtectedRoute>
                    }
                />

                {/* --- Admin Routes --- */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout />
                        </AdminRoute>
                    }
                >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />

                    {/* Placeholders for future routes */}
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="users/:userId" element={<AdminUserDetailsPage />} />
                    <Route path="users/new" element={<AdminAddUserPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                    <Route path="scrapers" element={<div className="p-2 md:p-3 lg:p-4">Scraper Health (Coming Soon)</div>} />
                    <Route path="ai-queue" element={<div className="p-2 md:p-3 lg:p-4">AI Queue (Coming Soon)</div>} />
                    <Route path="financials" element={<div className="p-2 md:p-3 lg:p-4">Financials (Coming Soon)</div>} />
                    <Route path="config" element={<AdminConfigPage />} />
                    <Route path="danger" element={<AdminDangerZonePage />} />
                </Route>
                {/* ------------------- */}

                <Route
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.SETTINGS.BASE} element={<SettingsPage />} />
                    <Route path={ROUTES.HELP} element={<HelpPage />} />
                    <Route path={`${ROUTES.HELP}/quick-start-guide`} element={<QuickStartGuide />} />
                    <Route path={`${ROUTES.HELP}/resume-builder`} element={<ResumeBuilderDocs />} />
                    <Route path={`${ROUTES.HELP}/security-privacy`} element={<SecurityPrivacyDocs />} />
                    <Route path={ROUTES.PROFILE_SETUP.BASE} element={<ProfileSetupPage />}>
                        <Route
                            index
                            element={<Navigate to={ROUTES.PROFILE_SETUP.SEGMENTS.PERSONAL} replace />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.RESUME}
                            element={<ResumeUploadPage />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.PERSONAL}
                            element={<PersonalInfoForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.EDUCATION}
                            element={<EducationForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.SKILLS}
                            element={<SkillsLibraryForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.EXPERIENCE}
                            element={<ExperienceForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.CERTIFICATIONS}
                            element={<CertificationForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.ACCOMPLISHMENTS}
                            element={<AccomplishmentForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.PROJECTS}
                            element={<ProjectForm />}
                        />
                        <Route
                            path={ROUTES.PROFILE_SETUP.SEGMENTS.RESEARCH}
                            element={<ResearchForm />}
                        />

                    </Route>

                    <Route path={ROUTES.APPLICATIONS} element={<ApplicationsPage />} />
                    <Route path={ROUTES.OPTIMIZATION} element={<OptimizationPage />} />
                    <Route path={ROUTES.JOBS} element={<JobsPage />} />
                    <Route path={ROUTES.JOB_DETAIL} element={<JobDetailAnalysis />} />
                    <Route path={ROUTES.MY_AGENTS} element={<MyAgentsPage />} />

                    <Route path={ROUTES.APPLY} element={<ApplyPage />} />
                    <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                    <Route path={ROUTES.DOWNLOAD_AGENT} element={<DownloadAgentPage />} />
                    <Route path={ROUTES.AGENT_INSTRUCTIONS} element={<AgentInstructionsPage />} />
                    <Route path={ROUTES.AGENT_PAIR} element={<PairingPage />} />
                </Route>

                {/* Error / fallback routes */}
                <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
                <Route path={ROUTES.ERROR} element={<ErrorPage />} />
                <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
