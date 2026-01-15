import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { userAPI } from '@/services/api/userAPI.js';
import { Button } from "@/components/ui/Button.jsx"; // Import shared button
import {
    Search,
    Filter,
    MoreVertical,
    Shield,
    User,
    Plus,
    Activity,
    Ban,
    CheckCircle,
    XCircle,
    Eye,
    Key,
    Trash2,
    CreditCard,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Restricted } from "@/components/auth/Restricted.jsx";


export default function AdminUsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [subscriptionFilter, setSubscriptionFilter] = useState('');

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'joined', direction: 'desc' });

    // Reset subscription filter when role changes from 'user'
    useEffect(() => {
        if (roleFilter !== 'user') {
            setSubscriptionFilter('');
        }
    }, [roleFilter]);

    // Simple debounce for search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        fetchUsers();
    }, [page, limit, roleFilter, statusFilter, subscriptionFilter, sortConfig, debouncedSearchQuery]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * limit;
            const params = {
                limit,
                offset,
                ...(roleFilter && { role: roleFilter }),
                ...(statusFilter === 'active' && { is_active: true }),
                ...(statusFilter === 'inactive' && { is_active: false }),
                ...(subscriptionFilter && { subscription_tier: subscriptionFilter }),
                ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
                sort_by: sortConfig.key,
                sort_desc: sortConfig.direction === 'desc'
            };

            const data = await userAPI.getAllUsers(params);
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1) return; // Basic guard
        setPage(newPage);
        setSearchParams({ page: newPage });
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 lg:gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 ">User Management</h1>
                    <p className="text-slate-500 ">View and manage system users</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <Button
                        onClick={() => navigate('/admin/user/new')}
                        variant="primary"
                    >
                        <Plus className="h-4 w-4 mr-2 md:mr-3 lg:mr-4" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm border border-slate-200 focus:border-brand-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed pl-2 md:pl-3 lg:pl-4 pr-2 md:pr-3 lg:pr-4 py-2 md:py-3 lg:py-4"
                    />
                </div>

                <div className="flex items-center w-full sm:w-auto overflow-x-auto gap-2 md:gap-3 lg:gap-4">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                        <Select
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                        >
                            <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-2 md:gap-3 lg:gap-4">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_roles">All Roles</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super-admin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subscription Filter (User only) */}
                    {roleFilter === 'user' && (
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-left-2 duration-200 gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                            <Select
                                value={subscriptionFilter}
                                onValueChange={setSubscriptionFilter}
                            >
                                <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-2 md:gap-3 lg:gap-4">
                                    <SelectValue placeholder="All Tiers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_tiers">All Tiers</SelectItem>
                                    <SelectItem value="free_tier">Free Tier</SelectItem>
                                    <SelectItem value="pro_tier">Pro Tier</SelectItem>
                                    <SelectItem value="max_tier">Max Tier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-2 md:gap-3 lg:gap-4">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_status">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white  rounded-xl border border-slate-200  shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50  text-slate-500  font-medium uppercase text-xs">
                            <tr>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">User</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Status</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Role</th>
                                {roleFilter === 'user' && <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Plan</th>}
                                <th
                                    className="cursor-pointer hover:bg-slate-100 transition-colors select-none px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"
                                    onClick={() => handleSort('joined')}
                                >
                                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                        Joined
                                        {sortConfig.key === 'joined' && (
                                            sortConfig.direction === 'asc'
                                                ? <ArrowUp className="h-3 w-3 text-brand-300" />
                                                : <ArrowDown className="h-3 w-3 text-brand-300" />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 ">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-10 w-40 bg-slate-100  rounded-lg"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-6 w-20 bg-slate-100  rounded-full"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-6 w-16 bg-slate-100  rounded-full"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-4 w-24 bg-slate-100  rounded"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-slate-500 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                        className="hover:bg-slate-50  transition-colors group cursor-pointer"
                                    >
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-100  flex items-center justify-center text-slate-500  font-bold uppercase">
                                                    {user.name ? user.name.substring(0, 2) : user.email.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 ">{user.name || 'No Name'}</div>
                                                    <div className="text-slate-500  text-xs">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className={`inline-flex items-center rounded-full text-xs font-medium border ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200' } gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                                                {user.is_active ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                                {user.account_status}
                                            </div>
                                        </td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                                                <span className={`capitalize ${user.role === 'super-admin' ? 'text-brand-500 font-semibold' :
                                                    user.role === 'admin' ? 'text-brand-400 font-medium' : 'text-slate-600'
                                                    }`}>
                                                    {user.role.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        {roleFilter === 'user' && (
                                            <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                                <span className={`inline-flex items-center rounded-full text-xs font-medium ${user.subscription_plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : user.subscription_plan === 'max' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600' } px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                                                    {user.subscription_plan ? user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1) : 'Free'}
                                                </span>
                                            </td>
                                        )}

                                        <td className="text-slate-500 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simple) */}
                <div className="border-t border-slate-100 flex items-center justify-between px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                    <Button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-slate-500 ">
                        Page {page}
                    </span>
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Select
                            value={String(limit)}
                            onValueChange={(val) => {
                                setLimit(Number(val));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="10 per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="20">20 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                                <SelectItem value="500">500 per page</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={users.length < limit}
                            variant="outline"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}
