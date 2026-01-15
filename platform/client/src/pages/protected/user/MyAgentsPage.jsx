import React, { useEffect } from 'react';
import {
    Monitor,
    Zap,
    Activity,
    Clock,
    Shield,
    RotateCw,
    AlertCircle,
    Cpu,
    Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AgentStatus } from '@/constants/constants';
import { ROUTES } from '@/routes/routes';
import { formatDistanceToNow } from 'date-fns';
import { useAgentStore } from '@/stores/agentStore';
import { Link, useLocation } from 'react-router-dom';
import { TaskStatusList } from '@/components/agent/TaskStatusList.jsx';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyAgentsPage() {
    const [tasksRefreshTrigger, setTasksRefreshTrigger] = React.useState(0);
    const [isTasksLoading, setIsTasksLoading] = React.useState(true);
    const [isTasksRefreshing, setIsTasksRefreshing] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const location = useLocation();
    const liveOpsRef = React.useRef(null);

    useEffect(() => {
        if (location.state?.scrollTo === 'live-operations' && liveOpsRef.current) {
            liveOpsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [location]);

    const agents = useAgentStore((state) => state.agents);
    const isLoading = useAgentStore((state) => state.isLoading);
    const refreshAgents = useAgentStore((state) => state.refreshAgents);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshAgents();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefreshTasks = () => {
        setIsTasksRefreshing(true);
        setTasksRefreshTrigger(prev => prev + 1);
    };

    const getStatusLabel = (status) => {
        // Handle potential string vs int mismatches
        const s = Number(status);
        switch (s) {
            case AgentStatus.ONLINE: return 'Online';
            case AgentStatus.OFFLINE: return 'Offline';
            case AgentStatus.BUSY: return 'Busy';
            case AgentStatus.IDLE: return 'Idle';
            default: return 'Unknown';
        }
    };

    const getStatusColor = (status) => {
        const s = Number(status);
        switch (s) {
            case AgentStatus.ONLINE: return 'text-emerald-500 bg-emerald-50 border-emerald-200';
            case AgentStatus.OFFLINE: return 'text-slate-400 bg-slate-50 border-slate-200';
            case AgentStatus.BUSY: return 'text-amber-500 bg-amber-50 border-amber-200';
            case AgentStatus.IDLE: return 'text-blue-500 bg-blue-50 border-blue-200';
            default: return 'text-slate-400 bg-slate-50 border-slate-200';
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-72 rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 bg-white border border-slate-100 rounded-xl p-6 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-32 rounded" />
                                        <Skeleton className="h-4 w-24 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-20 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-16 w-full rounded-xl" />
                                <Skeleton className="h-16 w-full rounded-xl" />
                                <Skeleton className="h-16 w-full rounded-xl" />
                                <Skeleton className="h-16 w-full rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl flex-1 w-full h-full overflow-y-auto min-h-0 custom-scrollbar animate-in fade-in duration-500 p-6 space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 gap-6 pb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Connected Agents
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Manage your active workers and monitor their recurring tasks.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="border-slate-200 hover:bg-slate-50 min-w-[140px] gap-2"
                >
                    <RotateCw className={cn("w-4 h-4", (isLoading || isRefreshing) && "animate-spin")} />
                    {isLoading ? "Loading..." : isRefreshing ? "Refreshing..." : "Refresh Intel"}
                </Button>
            </header>

            {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-12">
                    <div className="rounded-full bg-slate-100 ring-8 ring-slate-50 p-4 mb-6">
                        <Monitor className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Agents Online</h3>
                    <p className="text-slate-500 max-w-sm text-sm leading-relaxed mt-2 mb-8">
                        To start automating job applications, you need to download and run the local agent application.
                    </p>
                    <Link to={ROUTES.DOWNLOAD_AGENT}>
                        <Button className="font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-12 shadow-[0_8px_16px_-6px_rgba(var(--brand-600-rgb),0.3)] transition-all hover:scale-[1.02] px-8 gap-3">
                            <Terminal className="w-4 h-4" />
                            Download Agent CLI
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {agents.map((agent) => {
                        const s = Number(agent.status);
                        const isOnline = s === AgentStatus.ONLINE;

                        return (
                            <div
                                key={agent.id}
                                className="w-full group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-500/20 transition-all duration-300 overflow-hidden"
                            >
                                {/* Status Stripe */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                                <div className="p-6 pl-8">
                                    {/* Top Row: Identity & Status */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-xl border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'} p-3`}>
                                                {agent.platform?.toLowerCase().includes('linux') ? <Terminal className="w-6 h-6" /> :
                                                    agent.platform?.toLowerCase().includes('mac') ? <Cpu className="w-6 h-6" /> :
                                                        <Monitor className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-slate-900 text-lg">
                                                        {agent.name || "Unnamed Agent"}
                                                    </h3>
                                                    {isOnline && (
                                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <code className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                        {agent.agent_id.split('-')[0]}...
                                                    </code>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">v{agent.version}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`rounded-lg text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(s)} px-3 py-1.5`}>
                                            {getStatusLabel(s)}
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
                                            <p className="text-xl font-black text-slate-900">
                                                {(agent.success_rate || 0).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                                            <p className="text-xl font-black text-emerald-600">
                                                {agent.total_tasks_completed}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Failed</p>
                                            <p className="text-xl font-black text-red-500">
                                                {agent.total_tasks_failed}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer Meta */}
                                    <div className="flex items-center justify-between border-t border-slate-100 text-xs text-slate-500 pt-4">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                Last seen {agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'never'}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Zap className="w-3.5 h-3.5 text-slate-400" />
                                                {agent.max_tasks_per_hour}/hr Limit
                                            </span>
                                        </div>

                                        <Link to={ROUTES.AGENT_PAIR} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-brand-600 font-bold hover:text-brand-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                Configure <Terminal className="w-3 h-3" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Task Monitoring Section */}
            <div ref={liveOpsRef} className="border-t border-slate-100 pt-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-brand-500" />
                            Live Operations
                        </h2>
                        <p className="text-sm text-slate-500">
                            Real-time monitoring of all active agent tasks and background processes.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefreshTasks}
                        disabled={isTasksLoading || isTasksRefreshing}
                        className="border-slate-200 hover:bg-slate-50 min-w-[140px] gap-2"
                    >
                        <RotateCw className={cn("w-4 h-4", (isTasksLoading || isTasksRefreshing) && "animate-spin")} />
                        {isTasksLoading ? "Loading..." : isTasksRefreshing ? "Refreshing..." : "Refresh Intel"}
                    </Button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <TaskStatusList
                        refreshTrigger={tasksRefreshTrigger}
                        onLoadingChange={(loading) => {
                            if (!loading) {
                                setIsTasksLoading(false);
                                setIsTasksRefreshing(false);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
