import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '@/services/api/userAPI.js';
import { Button } from "@/components/ui/Button.jsx";
import AdminRoleDetails from './components/AdminRoleDetails.jsx';
import UserRoleDetails from './components/UserRoleDetails.jsx';

export default function AdminUserDetailsPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [userData, statsData] = await Promise.all([
                    userAPI.getUserById(userId),
                    userAPI.getUserStats(userId)
                ]);

                setUser(userData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    if (isLoading) {
        return (
            <div className="h-full w-full bg-white text-zinc-950 font-sans">
                <main className="w-full mx-auto animate-pulse space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                    {/* Identity Section Skeleton */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 lg:gap-4">
                        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                            {/* Avatar Skeleton */}
                            <div className="h-24 w-24 rounded-full bg-zinc-100 border border-zinc-200"></div>

                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                {/* Name + Badges */}
                                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                    <div className="h-8 w-48 bg-zinc-100 rounded"></div>
                                    <div className="h-6 w-20 bg-zinc-100 rounded-full"></div>
                                    <div className="h-6 w-24 bg-zinc-100 rounded-full"></div>
                                </div>
                                {/* Email + Meta */}
                                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                    <div className="h-4 w-40 bg-zinc-100 rounded"></div>
                                    <div className="h-4 w-32 bg-zinc-100 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Back Button Skeleton */}
                        <div className="h-10 w-24 bg-zinc-100 rounded-lg"></div>
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <div className="h-10 w-32 bg-zinc-100 rounded-lg"></div>
                        <div className="h-10 w-36 bg-zinc-100 rounded-lg"></div>
                        <div className="h-10 w-36 bg-zinc-100 rounded-lg"></div>
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white p-2 md:p-3 lg:p-4">
                                <div className="h-3 w-20 bg-zinc-100 rounded mb-2 md:mb-3 lg:mb-4"></div>
                                <div className="h-8 w-24 bg-zinc-100 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs Skeleton */}
                    <div>
                        <div className="border-b border-zinc-100 mb-2 md:mb-3 lg:mb-4">
                            <div className="flex gap-2 md:gap-3 lg:gap-4 pb-2 md:pb-3 lg:pb-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-4 w-20 bg-zinc-100 rounded"></div>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content Skeleton */}
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className="h-6 w-32 bg-zinc-100 rounded"></div>
                            <div className="border border-zinc-200 rounded-lg space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                                <div className="h-4 w-full bg-zinc-100 rounded"></div>
                                <div className="h-4 w-5/6 bg-zinc-100 rounded"></div>
                                <div className="h-4 w-4/6 bg-zinc-100 rounded"></div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center p-2 md:p-3 lg:p-4">
                <h2 className="text-xl font-bold text-slate-900 ">User Not Found</h2>
                <Button onClick={() => navigate('/admin/user')} variant="outline" className="mt-2 md:mt-3 lg:mt-4">
                    Back to Users
                </Button>
            </div>
        );
    }

    const isAdminView = user.role === 'admin' || user.role === 'super-admin';

    if (isAdminView) {
        return <AdminRoleDetails user={user} stats={stats} onUserUpdate={handleUserUpdate} />;
    }

    return <UserRoleDetails user={user} stats={stats} onUserUpdate={handleUserUpdate} />;
}
