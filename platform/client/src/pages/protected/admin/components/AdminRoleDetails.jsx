import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/Button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import {
    ArrowLeft, Ban, Shield, Key, CheckCircle, Trash2, Loader2
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";
import { userAPI } from '@/services/api/userAPI.js';
import apiClient from '@/services/axios.config.js';

export default function AdminRoleDetails({ user, stats, onUserUpdate }) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState(user.admin_notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Pagination State for Logs
    const [logs, setLogs] = useState([]);
    const [logsPage, setLogsPage] = useState(0);
    const [logsLimit, setLogsLimit] = useState(10);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [hasMoreLogs, setHasMoreLogs] = useState(true);

    // Action States
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isResetting2FA, setIsResetting2FA] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

    const loadLogs = async (page = 0, limit = 10) => {
        setIsLoadingLogs(true);
        try {
            const offset = page * limit;
            const data = await userAPI.getUserLogs(user.id, { limit: limit + 1, offset });

            const hasMore = data.length > limit;
            const displayLogs = hasMore ? data.slice(0, limit) : data;

            setLogs(displayLogs);
            setHasMoreLogs(hasMore);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handlePageChange = (newPage) => {
        setLogsPage(newPage);
        loadLogs(newPage, logsLimit);
    };

    const handleBanUser = async () => {
        const action = user.account_status === 'active' ? 'suspend' : 'activate';
        const newStatus = user.account_status === 'active' ? 'suspended' : 'active';
        const confirmMsg = `⚠️ REVOKE ACCESS: Are you sure you want to immediately BAN this Admin? This will kill their active sessions.`;

        if (!window.confirm(confirmMsg)) return;

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

    const handleReset2FA = async () => {
        if (!window.confirm("Are you sure you want to reset 2FA for this user? They will need to set it up again.")) return;
        setIsResetting2FA(true);
        try {
            await apiClient.post(`/api/v1/users/${user.id}/reset-2fa`);
            alert("2FA has been disabled for this user.");
            onUserUpdate({ ...user, two_factor_enabled: false });
        } catch (error) {
            console.error("Failed to reset 2FA:", error);
            alert("Failed to reset 2FA.");
        } finally {
            setIsResetting2FA(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmMsg = `⚠️ PERMANENT DELETE: Are you sure you want to permanently delete ${user.name || user.email}'s account? This action CANNOT be undone and will remove all associated data.`;

        if (!window.confirm(confirmMsg)) return;

        if (!window.confirm('Final confirmation: Type DELETE in the next prompt to proceed.')) return;

        setIsDeletingAccount(true);
        try {
            alert('Delete user endpoint not yet implemented. Please implement DELETE /api/v1/user/{user_id}');
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user account.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/user');
    };

    return (
        <div className="h-full w-full bg-white text-zinc-950 font-sans">
            <main className="w-full mx-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                {/* Admin Identity Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 lg:gap-4">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Avatar className="h-24 w-24 border border-zinc-200 shadow-sm bg-white">
                            <AvatarImage src={user.profile_picture_url} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-brand-50 text-brand-700 border border-brand-100">
                                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                <h2 className="text-3xl font-bold tracking-tight text-black">{user.name || 'Unknown Admin'}</h2>
                                <Badge className="capitalize text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white border-transparent px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    ADMINISTRATOR
                                </Badge>
                                <Badge variant="outline" className={`capitalize text-xs font-semibold ${user.account_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                                    {user.account_status}
                                </Badge>
                            </div>

                            <div className="flex items-center text-sm text-zinc-500 gap-2 md:gap-3 lg:gap-4">
                                <p className="font-mono">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black hover:border-zinc-300 transition-all font-medium"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4 text-zinc-400 mr-2 md:mr-3 lg:mr-4" />
                        Back
                    </Button>
                </div>

                {/* Security Actions */}
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <Button
                        variant="outline"
                        className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black hover:border-zinc-300 transition-all font-medium"
                        onClick={handleReset2FA}
                        disabled={isResetting2FA}
                    >
                        <Key className="h-4 w-4 text-zinc-400 mr-2 md:mr-3 lg:mr-4" />
                        Reset 2FA
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
                            <><Ban className="h-4 w-4 mr-2 md:mr-3 lg:mr-4" /> Revoke Access</>
                        ) : (
                            <><CheckCircle className="h-4 w-4 mr-2 md:mr-3 lg:mr-4" /> Restore Access</>
                        )}
                    </Button>
                    <Button
                        className="font-medium transition-all border bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                    >
                        <Trash2 className="h-4 w-4 mr-2 md:mr-3 lg:mr-4" />
                        {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </div>

                {/* Session Intelligence Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-2 md:p-3 lg:p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-2 md:mb-3 lg:mb-4">Last Active</p>
                        <p className="text-sm font-medium text-black">
                            {stats?.last_active ? new Date(stats.last_active).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-2 md:mt-3 lg:mt-4">
                            {stats?.last_active ? new Date(stats.last_active).toLocaleTimeString() : '-'}
                        </p>
                    </div>

                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-2 md:p-3 lg:p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-2 md:mb-3 lg:mb-4">Last IP</p>
                        <span className="text-sm font-mono text-black">{stats?.last_ip || 'N/A'}</span>
                    </div>

                    <div className="bg-white group hover:bg-zinc-50 transition-colors p-2 md:p-3 lg:p-4">
                        <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase mb-2 md:mb-3 lg:mb-4">2FA Status</p>
                        {user.two_factor_enabled ? (
                            <span className="inline-flex items-center text-emerald-600 font-medium text-xs bg-emerald-50 rounded border border-emerald-100 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                <CheckCircle className="h-3 w-3" /> Enabled
                            </span>
                        ) : (
                            <span className="inline-flex items-center text-amber-600 font-medium text-xs bg-amber-50 rounded border border-amber-100 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                <Ban className="h-3 w-3" /> Disabled
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <Tabs defaultValue="access" className="w-full">
                        <div className="border-b border-zinc-100 mb-2 md:mb-3 lg:mb-4">
                            <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-2 md:gap-3 lg:gap-4">
                                {['Access', 'Audit', 'History'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase()}
                                        onClick={tab === 'Audit' ? () => loadLogs(logsPage, logsLimit) : undefined}
                                        className="rounded-none border-b-2 border-transparent text-sm font-medium text-zinc-500 hover:text-black transition-all data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    >
                                        {tab === 'Access' && 'Access & Permissions'}
                                        {tab === 'Audit' && 'Activity Audit'}
                                        {tab === 'History' && 'History'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Access Tab */}
                        <TabsContent value="access" className="mt-0 space-y-2 md:space-y-3 lg:space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                {/* Permissions */}
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <h3 className="font-semibold text-black flex items-center text-sm gap-2 md:gap-3 lg:gap-4">
                                        <Key className="h-4 w-4 text-brand-500" /> Current Privileges
                                    </h3>
                                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                        {['Manage Users', 'View System Logs', 'Manage Billing', 'Delete Data'].map((perm) => (
                                            <div key={perm} className="flex items-center bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm font-medium text-zinc-700">{perm}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                    <h3 className="font-semibold text-black text-sm">Internal Notes</h3>
                                    <textarea
                                        className="w-full h-40 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none placeholder:text-zinc-400 p-2 md:p-3 lg:p-4"
                                        placeholder="Confidential notes about this admin..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={handleSaveNotes}
                                            disabled={isSavingNotes}
                                            className="bg-brand-600 hover:bg-brand-700 text-white"
                                        >
                                            {isSavingNotes ? 'Saving...' : 'Save Note'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Audit Tab */}
                        <TabsContent value="audit" className="mt-0">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 md:mb-3 lg:mb-4 gap-2 md:gap-3 lg:gap-4">
                                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                    <h3 className="font-semibold text-black text-sm">Recent Actions</h3>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                    <div className="flex items-center bg-white border border-zinc-200 rounded-lg gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        <span className="text-xs text-zinc-500">Rows:</span>
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
                                            <SelectTrigger className="w-[70px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto text-xs gap-2 md:gap-3 lg:gap-4">
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
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium">
                                            <tr>
                                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Time</th>
                                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Action</th>
                                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 bg-white">
                                            {isLoadingLogs ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-3 bg-zinc-100 rounded w-24"></div></td>
                                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-3 bg-zinc-100 rounded w-32"></div></td>
                                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-3 bg-zinc-100 rounded w-48"></div></td>
                                                    </tr>
                                                ))
                                            ) : logs.length > 0 ? logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                                                    <td className="whitespace-nowrap text-zinc-500 font-mono text-xs px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="font-medium text-zinc-900 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                                        {log.action}
                                                    </td>
                                                    <td className="text-zinc-400 text-xs px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                                        <div className="font-mono text-zinc-400 mb-2 md:mb-3 lg:mb-4">{log.ip_address}</div>
                                                        {log.details ? JSON.stringify(log.details).substring(0, 60) + '...' : '-'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-zinc-400 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                                        No audit logs found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer */}
                                <div className="border-t border-zinc-100 flex items-center justify-between bg-zinc-50/30 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
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
                                    </span>
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
                        </TabsContent>

                        {/* History Tab */}
                        <TabsContent value="history" className="mt-0">
                            <div className="border-l-2 border-zinc-200 ml-2 md:ml-3 lg:ml-4 pl-2 md:pl-3 lg:pl-4 space-y-2 md:space-y-3 lg:space-y-4 py-2 md:py-3 lg:py-4">
                                <div className="relative">
                                    <div className="absolute -left-[39px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white"></div>
                                    <p className="font-medium text-black">Role Updated to Admin</p>
                                    <p className="text-sm text-zinc-500">Action performed by Super Admin on {new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[39px] top-1 h-3 w-3 rounded-full bg-zinc-200 ring-4 ring-white"></div>
                                    <p className="font-medium text-black">Account Created</p>
                                    <p className="text-sm text-zinc-500">Joined via Invitation on {new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
