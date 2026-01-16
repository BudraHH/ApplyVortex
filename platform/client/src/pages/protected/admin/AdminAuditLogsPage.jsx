import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '@/services/api/adminAPI.js';
import { Button } from "@/components/ui/Button.jsx";
import { SearchBar } from "@/components/ui/SearchBar.jsx";
import {
    Search,
    Filter,
    Activity,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select.jsx";

export default function AdminAuditLogsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(50);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [page, limit, actionFilter, statusFilter]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * limit;
            const params = {
                limit,
                offset,
                ...(actionFilter && { action: actionFilter }),
                ...(statusFilter && { status: statusFilter }),
            };

            const data = await adminAPI.getAuditLogs(params);
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1) return;
        setPage(newPage);
        setSearchParams({ page: newPage });
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'FAILURE': return 'text-red-600 bg-red-50 border-red-200';
            case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return <CheckCircle className="h-3 w-3" />;
            case 'FAILURE': return <XCircle className="h-3 w-3" />;
            case 'WARNING': return <AlertTriangle className="h-3 w-3" />;
            default: return <Activity className="h-3 w-3" />;
        }
    };

    return (
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 lg:gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 ">Audit Logs</h1>
                    <p className="text-slate-500 ">System-wide activity trails and security logs</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <div className="text-xs text-slate-500 bg-slate-100 rounded-full flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 gap-2 md:gap-3 lg:gap-4">
                        <Clock className="h-3 w-3" />
                        Retention: 90 Days
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                <div className="relative w-full sm:flex-1">
                    <SearchBar
                        placeholder="Search actions..."
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-slate-50 border-slate-200"
                    />
                </div>

                <div className="flex items-center w-full sm:w-auto overflow-x-auto gap-2 md:gap-3 lg:gap-4">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[140px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-2 md:gap-3 lg:gap-4">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_status">All Status</SelectItem>
                                <SelectItem value="SUCCESS">Success</SelectItem>
                                <SelectItem value="FAILURE">Failure</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                        <span className="text-xs text-slate-500">Rows:</span>
                        <Select
                            value={String(limit)}
                            onValueChange={(val) => {
                                setLimit(Number(val));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[70px] border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-2 md:gap-3 lg:gap-4">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="500">500</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white  rounded-xl border border-slate-200  shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50  text-slate-500  font-medium uppercase text-xs">
                            <tr>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Result</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Action</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">User</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Details</th>
                                <th className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 ">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-6 w-20 bg-slate-100  rounded-full"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-6 w-32 bg-slate-100  rounded"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-6 w-24 bg-slate-100  rounded"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-4 w-48 bg-slate-100  rounded"></div></td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4"><div className="h-4 w-24 bg-slate-100  rounded"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-slate-500 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50  transition-colors">
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className={`inline-flex items-center rounded-full text-xs font-medium border ${getStatusColor(log.status)} gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4`}>
                                                {getStatusIcon(log.status)}
                                                {log.status}
                                            </div>
                                        </td>
                                        <td className="font-mono text-xs text-slate-600 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            {log.action}
                                        </td>
                                        <td className="px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className="flex items-center text-slate-600 gap-2 md:gap-3 lg:gap-4">
                                                <User className="h-3 w-3 text-slate-400" />
                                                <span title={log.user_id}>
                                                    {log.user_email || (log.user_id ? 'Unknown User' : 'System/Guest')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-slate-500 max-w-xs truncate px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            <div className="flex flex-col gap-2 md:gap-3 lg:gap-4">
                                                <div className="flex items-center text-xs gap-2 md:gap-3 lg:gap-4">
                                                    <span className="font-mono bg-slate-100 rounded text-slate-600 px-2 md:px-3 lg:px-4">
                                                        {log.duration_ms}ms
                                                    </span>
                                                    {log.ip_address && <span className="opacity-70">{log.ip_address}</span>}
                                                </div>
                                                <span className="text-xs truncate opacity-80" title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-slate-500 whitespace-nowrap px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
                    <Button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={logs.length < limit}
                        variant="outline"
                        size="sm"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
