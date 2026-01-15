import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/Button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import {
    ArrowLeft, CheckCircle, Ban, Lock, FileText,
    DollarSign, Save, LogIn, Activity, Clock, Shield,
    MoreHorizontal, ChevronLeft, ChevronRight, Loader2, Trash2, RefreshCw
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";
import { userAPI } from '@/services/api/userAPI.js';

export default function UserRoleDetails({ user, stats, onUserUpdate }) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState(user.admin_notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Pagination State for Logs
    const [logs, setLogs] = useState([]);
    const [logsPage, setLogsPage] = useState(0);
    const [logsLimit, setLogsLimit] = useState(10);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [hasMoreLogs, setHasMoreLogs] = useState(true); // Optimistic initially

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await userAPI.updateUserNotes(user.id, notes);
        } catch (error) {
            console.error("Failed to save notes:", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const loadLogs = async (page = logsPage, limit = logsLimit) => {
        setIsLoadingLogs(true);
        try {
            const offset = page * limit;
            // Fetch one extra item to check if there is a next page
            const data = await userAPI.getUserLogs(user.id, { limit: limit + 1, offset });

            if (data.length > limit) {
                setHasMoreLogs(true);
                setLogs(data.slice(0, limit)); // Remove the extra check item
            } else {
                setHasMoreLogs(false);
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to load logs:", error);
            setLogs([]); // Reset on error
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // Trigger load when tab is clicked effectively (handled by onValueChange or manual click)
    // but better to have useEffect or call it manually.
    // For now, let's keep the manual call in TabsTrigger or use an effect if we want auto-refresh on page change.

    const handlePageChange = (newPage) => {
        if (newPage >= 0) {
            setLogsPage(newPage);
            loadLogs(newPage, logsLimit);
        }
    };



    const handleImpersonate = async () => {
        if (!window.confirm(`Are you sure you want to login as ${user.name || user.email}? This will log you out of your admin session.`)) return;

        setIsImpersonating(true);
        try {
            await userAPI.impersonateUser(user.id);
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Impersonation failed:", error);
            alert("Failed to impersonate user. Check console.");
            setIsImpersonating(false);
        }
    };

    const handleBanUser = async () => {
        const action = user.account_status === 'active' ? 'suspend' : 'activate';
        const newStatus = user.account_status === 'active' ? 'suspended' : 'active';

        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        setIsUpdatingStatus(true);
        try {
            await userAPI.updateUserStatus(user.id, newStatus);
            onUserUpdate({ ...user, account_status: newStatus });
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update user status.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/user');
    };

    // Helper for Initials
    const getInitials = () => {
        const name = user.name || user.email || '?';
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="h-full w-full bg-white text-zinc-950 font-sans">
            {/* Minimal Header */}
            <main className="w-full mx-auto space-y-12">
                {/* 1. Identity Section: Clean & Spacious */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border border-zinc-200 shadow-sm bg-white">
                            <AvatarImage src={user.profile_picture_url} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-zinc-50 text-zinc-900 border border-zinc-100">
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold tracking-tight text-black">{user.name || 'Unknown User'}</h2>
                                <Badge variant="outline" className={`
                                    capitalize px-2.5 py-0.5 text-xs font-semibold
                                    ${user.account_status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'}
                                `}>
                                    {user.account_status}
                                </Badge>
                                <Badge className={`
                                    capitalize px-2.5 py-0.5 text-xs font-semibold border-transparent
                                    ${user.subscription_plan === 'pro'
                                        ? 'bg-brand-600 hover:bg-brand-700 text-white'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}
                                `}>
                                    {user.subscription_plan || 'Free'} Plan User
                                </Badge>
                            </div>
                            <div className="flex items-center text-sm text-zinc-500">
                                <p className="font-mono">{user.email}</p>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 mx-2"></span>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black hover:border-zinc-300 transition-all font-medium"
                        onClick={handleBack}
                        disabled={isUpdatingStatus}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black hover:border-zinc-300 transition-all font-medium"
                        onClick={handleImpersonate}
                        disabled={isImpersonating}
                    >
                        <LogIn className="h-4 w-4 mr-2" /> Impersonate
                    </Button>
                    <Button
                        className={`
                            font-medium transition-all border
                            ${user.account_status === 'active'
                                ? 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                                : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700'}
                        `}
                        onClick={handleBanUser}
                        disabled={isUpdatingStatus}
                    >
                        {user.account_status === 'active' ? (
                            <><Ban className="h-4 w-4 mr-2" /> Suspend Access</>
                        ) : (
                            <><CheckCircle className="h-4 w-4 mr-2" /> Restore Access</>
                        )}
                    </Button>
                    <Button
                        className="font-medium transition-all border bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </div>

                {/* 2. Stats Grid: Minimalist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-1.5">Credits</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-black">{stats?.credits_remaining || 0}</span>
                            <span className="text-xs text-zinc-400 font-medium">/ {stats?.credits_limit || 0}</span>
                        </div>
                    </div>
                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-1.5">Resumes</p>
                        <span className="text-2xl font-bold text-black">{stats?.resumes_generated || 0}</span>
                    </div>
                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-1.5">Verification</p>
                        {user.email_verified ? (
                            <span className="inline-flex items-center text-emerald-600 font-medium text-xs bg-emerald-50 rounded border border-emerald-100 px-2 py-1">
                                <CheckCircle className="h-3 w-3 mr-1.5" /> Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center text-amber-600 font-medium text-xs bg-amber-50 rounded border border-amber-100 px-2 py-1">
                                <Clock className="h-3 w-3 mr-1.5" /> Pending
                            </span>
                        )}
                    </div>
                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-1.5">Last Active</p>
                        <p className="text-sm font-medium text-black">
                            {stats?.last_active ? new Date(stats.last_active).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {stats?.last_active ? new Date(stats.last_active).toLocaleTimeString() : '-'}
                        </p>
                    </div>
                </div>

                {/* 3. Detailed Tabs */}
                <div>
                    <Tabs defaultValue="overview" className="w-full">
                        <div className="border-b border-zinc-100 mb-8">
                            <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-6">
                                {['Overview', 'Activity', 'Billing', 'Logs'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase()}
                                        onClick={tab === 'Logs' ? () => loadLogs(logsPage, logsLimit) : undefined}
                                        className="rounded-none border-b-2 border-transparent text-sm font-medium text-zinc-500 hover:text-black transition-all data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Overview Content */}
                        <TabsContent value="overview" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-brand-600" /> Admin Notes
                                        </h3>
                                        {isSavingNotes && <span className="text-xs text-zinc-400 animate-pulse">Saving...</span>}
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            className="w-full h-80 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none transition-all duration-200 ease-in-out p-4"
                                            placeholder="Add internal notes about this user..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-black hover:bg-zinc-800 text-white shadow-sm">
                                                <Save className="h-3.5 w-3.5 mr-2" /> Save Note
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-black">Quick Details</h3>
                                    <div className="bg-white border border-zinc-100 rounded-lg shadow-sm space-y-4 p-4">
                                        <div>
                                            <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">User ID</span>
                                            <code className="text-xs bg-zinc-50 rounded block w-full overflow-hidden text-ellipsis text-zinc-600 select-all border border-zinc-100 p-2 mt-1">
                                                {user.id}
                                            </code>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">Last Known IP</span>
                                            <code className="text-xs text-zinc-600 block mt-1">{stats?.last_ip || 'N/A'}</code>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">Profile Status</span>
                                            <div className="mt-2 text-sm text-zinc-600 flex items-center gap-2">
                                                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-brand-500 h-full" style={{ width: `${user.profile_completeness || 0}%` }}></div>
                                                </div>
                                                <span className="font-medium text-brand-600">{user.profile_completeness}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Recent Activity */}
                        <TabsContent value="activity">
                            <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-black">Recent Actions</h3>
                                    <Badge variant="outline" className="bg-white text-zinc-500 font-normal">Last 10 events</Badge>
                                </div>
                                {stats?.recent_activity?.length > 0 ? (
                                    <div className="divide-y divide-zinc-100">
                                        {stats.recent_activity.map((activity, i) => (
                                            <div key={i} className="px-6 py-4 flex items-center hover:bg-zinc-50/80 transition-colors gap-4">
                                                <div className={`
                                                    h-8 w-8 rounded-full flex items-center justify-center border
                                                    ${activity.status === 'SUCCESS'
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                        : 'bg-red-50 border-red-100 text-red-600'}
                                                `}>
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-zinc-900">{activity.action}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{new Date(activity.timestamp).toLocaleString()}</p>
                                                </div>
                                                {activity.details && (
                                                    <div className="max-w-[200px] text-right">
                                                        <code className="text-[10px] text-zinc-400 bg-zinc-50 rounded border border-zinc-100 p-1">
                                                            {JSON.stringify(activity.details).substring(0, 30)}...
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-zinc-400">
                                        No recent activity recorded.
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Billing - Placeholder */}
                        <TabsContent value="billing">
                            <div className="border-2 border-dashed border-zinc-200 rounded-lg text-center p-12">
                                <div className="mx-auto h-12 w-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                    <DollarSign className="h-6 w-6 text-zinc-300" />
                                </div>
                                <h3 className="text-sm font-semibold text-black">No Billing History</h3>
                                <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2">This user has not made any transactions yet.</p>
                            </div>
                        </TabsContent>

                        {/* System Logs */}
                        <TabsContent value="logs">
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900 text-sm">System Logs</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2">
                                            <span className="text-xs text-zinc-500 mr-2">Rows:</span>
                                            <Select
                                                value={String(logsLimit)}
                                                onValueChange={(val) => {
                                                    const newLimit = Number(val);
                                                    setLogsLimit(newLimit);
                                                    setLogsPage(0);
                                                    loadLogs(0, newLimit);
                                                }}
                                                disabled={isLoadingLogs}
                                            >
                                                <SelectTrigger className="w-[60px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-8 text-xs">
                                                    <SelectValue placeholder="10" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => loadLogs(logsPage, logsLimit)} disabled={isLoadingLogs}>
                                            <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm bg-white min-h-[300px]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium">
                                                <tr>
                                                    <th className="px-6 py-4">Time</th>
                                                    <th className="px-6 py-4">Action</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">IP Address</th>
                                                    <th className="px-6 py-4">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 bg-white">
                                                {isLoadingLogs ? (
                                                    Array(5).fill(0).map((_, i) => (
                                                        <tr key={i} className="animate-pulse">
                                                            <td className="px-6 py-4"><div className="h-3 bg-zinc-100 rounded w-24"></div></td>
                                                            <td className="px-6 py-4"><div className="h-3 bg-zinc-100 rounded w-32"></div></td>
                                                            <td className="px-6 py-4"><div className="h-3 bg-zinc-100 rounded w-16"></div></td>
                                                            <td className="px-6 py-4"><div className="h-3 bg-zinc-100 rounded w-24"></div></td>
                                                            <td className="px-6 py-4"><div className="h-3 bg-zinc-100 rounded w-48"></div></td>
                                                        </tr>
                                                    ))
                                                ) : logs.length > 0 ? (
                                                    logs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                                                            <td className="px-6 whitespace-nowrap text-zinc-500 font-mono text-xs">
                                                                {new Date(log.created_at).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 font-medium text-zinc-900">
                                                                {log.action}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`
                                                                    inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                                    ${log.status === 'SUCCESS'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                        : 'bg-red-50 text-red-700 border border-red-100'}
                                                                `}>
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 text-zinc-500 font-mono text-xs">
                                                                {log.ip_address || '-'}
                                                            </td>
                                                            <td className="px-6 text-zinc-400 text-xs">
                                                                {log.details ? (
                                                                    <span title={JSON.stringify(log.details, null, 2)}>
                                                                        {JSON.stringify(log.details).substring(0, 50) + (JSON.stringify(log.details).length > 50 ? '...' : '')}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4 text-center text-zinc-400">
                                                            No logs found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination Footer */}
                                    <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                                        <Button
                                            onClick={() => handlePageChange(logsPage - 1)}
                                            disabled={logsPage === 0 || isLoadingLogs}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-xs font-medium text-zinc-500">
                                            Page {logsPage + 1}
                                        </span >
                                        <Button
                                            onClick={() => handlePageChange(logsPage + 1)}
                                            disabled={!hasMoreLogs || isLoadingLogs}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}