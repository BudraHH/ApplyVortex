import React, { useEffect, useState, useRef } from 'react';
import { agentTasksAPI } from '@/services/api/agentTasksAPI';
import {
    Loader2, CheckCircle2, Clock,
    AlertCircle, Play, XCircle,
    Zap, Search, Send, ShieldCheck,
    ArrowRight, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskStatus, AgentTaskType, Portal } from '@/constants/constants';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';

const TASK_STATUS_CONFIG = {
    [TaskStatus.PENDING]: {
        label: 'Queued',
        icon: Clock,
        color: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200'
    },
    [TaskStatus.IN_PROGRESS]: {
        label: 'Active',
        icon: Zap,
        color: 'text-brand-500',
        bgColor: 'bg-brand-50',
        borderColor: 'border-brand-100'
    },
    [TaskStatus.COMPLETED]: {
        label: 'Success',
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100'
    },
    [TaskStatus.FAILED]: {
        label: 'Failed',
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100'
    },
    [TaskStatus.CANCELLED]: {
        label: 'Stopped',
        icon: XCircle,
        color: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200'
    }
};

const PORTAL_LABELS = {
    [Portal.LINKEDIN]: 'LinkedIn',
    [Portal.NAUKRI]: 'Naukri',
    [Portal.INDEED]: 'Indeed',
    [Portal.GLASSDOOR]: 'Glassdoor',
};

export function TaskStatusList({ refreshTrigger, onLoadingChange }) {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState("10");
    const pollingTimerRef = useRef(null);
    const isMounted = useRef(false);

    const fetchTasks = async (isManual = false) => {
        // Prevent background polling if component unmounted
        if (!isMounted.current && !isManual) return;

        if (isManual && onLoadingChange) onLoadingChange(true);
        if (isManual) setIsLoading(true);

        try {
            const data = await agentTasksAPI.getHistory();
            const taskList = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (isMounted.current) {
                setTasks(taskList);
                const hasActiveTasks = taskList.some(task =>
                    [TaskStatus.PENDING, TaskStatus.IN_PROGRESS].includes(task.status)
                );

                if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);

                if (hasActiveTasks && isMounted.current) {
                    pollingTimerRef.current = setTimeout(() => fetchTasks(), 5000); // Relaxed interval
                }
            }
        } catch (error) {
            console.error("Failed to fetch task history:", error);
        } finally {
            if (isMounted.current) {
                if (isManual) setIsLoading(false);
                if (isManual && onLoadingChange) onLoadingChange(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchTasks(true);

        return () => {
            isMounted.current = false;
            if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
        };
    }, [refreshTrigger]);

    // Pagination Logic
    const size = parseInt(pageSize);
    const totalPages = Math.ceil(tasks.length / size) || 1;
    const paginatedTasks = tasks.slice((currentPage - 1) * size, currentPage * size);

    // Reset to page 1 if page size changes
    const handlePageSizeChange = (val) => {
        setPageSize(val);
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            <div className="divide-y divide-slate-50  flex-1">
                {isLoading ? (
                    <div className="flex flex-col flex-1 divide-y divide-slate-50">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex-1">
                                {/* Mobile Skeleton (lg:hidden) */}
                                <div className="lg:hidden p-3 flex gap-3 items-start border-b border-slate-50">
                                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Skeleton className="h-3 w-24 rounded" />
                                            <Skeleton className="h-4 w-12 rounded" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-3 w-32 rounded" />
                                            <Skeleton className="h-3 w-10 rounded-lg ml-auto" />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Skeleton (lg+) */}
                                <div className="hidden lg:flex items-center justify-between border-b border-slate-50 p-4">
                                    <div className="flex items-center flex-1 min-w-0 gap-4">
                                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-32 rounded" />
                                                <Skeleton className="h-4 w-16 rounded opacity-50" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-3 w-48 rounded" />
                                                <Skeleton className="h-3 w-12 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center flex flex-col items-center justify-center h-full min-h-[300px] p-2 md:p-3 lg:p-4">
                        <div className="rounded-full bg-slate-50 border border-slate-100 p-2 md:p-3 lg:p-4 mb-2 md:mb-3 lg:mb-4">
                            <Activity className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">Idle. No operations currently recorded.</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                        {paginatedTasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Pagination / Controls Footer */}
            <div className="border-t border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entries per page</span>
                    <Select value={pageSize} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[70px] h-8 text-[10px] font-black border-slate-200 ">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-[10px] font-bold text-slate-300  uppercase tracking-tight">
                        SHOWING {tasks.length > 0 ? ((currentPage - 1) * size) + 1 : 0}—{Math.min(currentPage * size, tasks.length)} OF {tasks.length}
                    </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 disabled:opacity-30 px-2 md:px-3 lg:px-4"
                    >
                        Prev
                    </Button>
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4 px-2 md:px-3 lg:px-4">
                        <span className="text-[10px] font-black text-brand-600">{currentPage}</span>
                        <span className="text-[10px] font-bold text-slate-300">/</span>
                        <span className="text-[10px] font-bold text-slate-400">{totalPages}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 disabled:opacity-30 px-2 md:px-3 lg:px-4"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function TaskItem({ task }) {
    const config = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG[TaskStatus.PENDING];
    const Icon = config.icon;

    const taskTypeInfo = getTaskTypeDetails(task);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-50 hover:bg-slate-100 transition-colors group border-b border-slate-100 last:border-0"
        >
            {/* Mobile / Tablet Layout (xs, sm, md) - Redesigned */}
            {/* Mobile / Tablet Layout (xs, sm, md) - Redesigned Row */}
            <div className="lg:hidden p-3 flex gap-3 items-start">
                {/* Icon Box */}
                <div className={cn(
                    "relative flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-all bg-white",
                    config.borderColor
                )}>
                    {task.status === TaskStatus.IN_PROGRESS && (
                        <div className="absolute inset-0 rounded-lg bg-brand-500/10 animate-ping" />
                    )}
                    <taskTypeInfo.icon className={cn("w-4 h-4", task.status === TaskStatus.IN_PROGRESS ? "text-brand-500" : "text-slate-400")} />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[36px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">
                                {taskTypeInfo.title}
                            </h4>
                            {task.payload?.portal && (
                                <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 uppercase tracking-wide shrink-0">
                                    {PORTAL_LABELS[task.payload.portal]}
                                </span>
                            )}
                        </div>
                        {/* Compact Status Pill */}
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ml-auto shrink-0",
                            config.bgColor, config.borderColor, config.color
                        )}>
                            {config.label}
                        </span>
                    </div>

                    <div className="flex items-center text-[11px] text-slate-500 gap-2">
                        <span className="truncate">
                            {taskTypeInfo.description}
                        </span>
                        <span className="text-slate-300 px-0.5">•</span>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400 uppercase">
                            {formatTimeAgo(task.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Desktop Layout (lg+) - Preserved */}
            <div className="hidden lg:flex items-center justify-between p-4">
                <div className="flex items-center flex-1 min-w-0 gap-4">
                    {/* Status Indicator / Icon */}
                    <div className={cn(
                        "relative flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                        config.bgColor, config.borderColor
                    )}>
                        {task.status === TaskStatus.IN_PROGRESS && (
                            <div className="absolute inset-0 rounded-xl bg-brand-500/10 animate-ping" />
                        )}
                        <taskTypeInfo.icon className={cn("w-5 h-5", task.status === TaskStatus.IN_PROGRESS ? "text-brand-500" : "text-slate-400")} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900  truncate uppercase tracking-tight">
                                {taskTypeInfo.title}
                            </span>
                            {task.payload?.portal && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded border border-slate-200 uppercase tracking-wider px-2 py-1">
                                    {PORTAL_LABELS[task.payload.portal] || 'External'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-slate-500  truncate max-w-[200px]">
                                {taskTypeInfo.description}
                            </p>
                            <span className="text-[8px] text-slate-300 ">•</span>
                            <p className="text-[10px] font-medium text-slate-300 ">
                                {formatTimeAgo(task.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center rounded-full border text-[10px] font-bold uppercase tracking-wider gap-2 px-2 py-1",
                        config.bgColor, config.borderColor, config.color
                    )}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function getTaskTypeDetails(task) {
    switch (task.task_type) {
        case AgentTaskType.PARSE_RESUME:
            return {
                title: 'Resume Parsing',
                description: 'Extracting profile data',
                icon: Activity
            };
        case AgentTaskType.SCRAPE:
            return {
                title: 'Data Acquisition',
                description: task.payload?.keywords ? `Exploring roles for "${task.payload.keywords}"` : 'Scanning for opportunities',
                icon: Search
            };
        case AgentTaskType.DEEP_SCRAPE:
            return {
                title: 'Deep Analysis',
                description: task.payload?.job_id ? 'Enriching specific job details' : 'Gathering comprehensive job data',
                icon: Search
            };
        case AgentTaskType.AUTO_APPLY:
            return {
                title: 'Cruise Mode',
                description: 'Autonomous Scrape & Apply Cycle',
                icon: ShieldCheck
            };
        case AgentTaskType.APPLY:
            return {
                title: 'Precision Apply',
                description: 'Processing individual application',
                icon: Send
            };
        default:
            return {
                title: 'Agent Workflow',
                description: 'Executing secondary protocols',
                icon: Activity
            };
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'JUST NOW';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}M AGO`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}H AGO`;
    return then.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
}
