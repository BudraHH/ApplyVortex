import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    Monitor,
    Cpu,
    Terminal,
    Clock,
    Zap,
    RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/routes';
import { AgentStatus } from '@/constants/constants';

export function ConnectedAgentsSection({ agents, isLoading, isRefreshing, onRefresh }) {

    const getStatusLabel = (status) => {
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



    return (
        <div className="space-y-4 lg:space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 gap-4 lg:gap-6 pb-4 lg:pb-6">
                <div className="space-y-1">
                    <h1 className="text-lg lg:text-2xl font-bold tracking-tight text-slate-900">
                        Connected Agents
                    </h1>
                    <p className="text-slate-500 text-xs lg:text-sm">
                        Manage your active workers and monitor their recurring tasks.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isLoading || isRefreshing}
                    className="border-slate-200 hover:bg-slate-50 w-full md:w-auto lg:min-w-[140px] gap-2 text-xs lg:text-sm h-9 lg:h-10"
                >
                    <RotateCw className={cn("w-3.5 h-3.5 lg:w-4 lg:h-4", (isLoading || isRefreshing) && "animate-spin")} />
                    {isLoading ? "Loading..." : isRefreshing ? "Refreshing..." : "Refresh Intel"}
                </Button>
            </header>

           

                {(isLoading || isRefreshing) ? (
                    <div className="space-y-4 lg:space-y-8">
                        {/* Header Skeleton */}


                        {/* Mobile Skeleton List (lg:hidden) */}
                        <div className="lg:hidden flex flex-col gap-3">
                           <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 w-full">
                                            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                                            <div className="space-y-1.5 flex-1 max-w-[60%]">
                                                <Skeleton className="h-3.5 w-24 rounded" />
                                                <Skeleton className="h-2.5 w-16 rounded" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded shrink-0" />
                                    </div>
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <div className="flex items-center justify-between pt-1">
                                        <Skeleton className="h-3 w-24 rounded" />
                                        <Skeleton className="h-3 w-16 rounded" />
                                    </div>
                                </div>
                        </div>

                        {/* Desktop Skeleton List (lg+) */}
                        <div className="hidden lg:flex flex-col gap-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48 rounded-lg" />
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-20 rounded" />
                                                <Skeleton className="h-4 w-12 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                    <Skeleton className="h-7 w-20 rounded-lg" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-32 rounded" />
                                        <Skeleton className="h-4 w-24 rounded" />
                                    </div>
                                    <Skeleton className="h-4 w-28 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-8 lg:py-12">
                        <div className="rounded-full bg-slate-100 ring-8 ring-slate-50 p-3 lg:p-4 mb-4 lg:mb-6">
                            <Monitor className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400" />
                        </div>
                        <h3 className="text-base lg:text-lg font-bold text-slate-900">No Agents Online</h3>
                        <p className="text-slate-500 max-w-sm text-xs lg:text-sm leading-relaxed mt-2 mb-6 lg:mb-8">
                            To start automating job applications, you need to download and run the local agent application.
                        </p>
                        <Link to={ROUTES.DOWNLOAD_AGENT}>
                            <Button className="font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-10 lg:h-12 shadow-[0_8px_16px_-6px_rgba(var(--brand-600-rgb),0.3)] transition-all hover:scale-[1.02] px-6 lg:px-8 gap-2 lg:gap-3 text-xs lg:text-sm">
                                <Terminal className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                Download Agent CLI
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Mobile Agent List (xs, sm, md) */}
                        <div className="lg:hidden flex flex-col gap-3">
                            {agents.map((agent) => {
                                const s = Number(agent.status);
                                const isOnline = s === AgentStatus.ONLINE;
                                return (
                                    <div key={agent.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <div className="p-3 pl-4 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                                                        {agent.platform?.toLowerCase().includes('linux') ? <Terminal className="w-4 h-4" /> :
                                                            agent.platform?.toLowerCase().includes('mac') ? <Cpu className="w-4 h-4" /> :
                                                                <Monitor className="w-4 h-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-slate-900 text-sm truncate">{agent.name || "Unnamed"}</h3>
                                                            {isOnline && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                                            <code className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100">{agent.agent_id.split('-')[0]}</code>
                                                            <span className="font-bold tracking-wider">v{agent.version}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`rounded text-[9px] uppercase tracking-wider font-bold border ${getStatusColor(s)} px-1.5 py-0.5`}>
                                                    {getStatusLabel(s)}
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Success</p>
                                                    <p className="text-sm font-black text-slate-900">{(agent.success_rate || 0).toFixed(0)}%</p>
                                                </div>
                                                <div className="text-center border-l border-slate-200">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Done</p>
                                                    <p className="text-sm font-black text-emerald-600">{agent.total_tasks_completed}</p>
                                                </div>
                                                <div className="text-center border-l border-slate-200">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Failed</p>
                                                    <p className="text-sm font-black text-red-500">{agent.total_tasks_failed}</p>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'never'}
                                                </span>
                                                <Link to={ROUTES.AGENT_PAIR} className="hidden lg:block text-brand-600 font-bold uppercase flex items-center gap-1 hover:underline">
                                                    config <Terminal className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Desktop Agent List (lg+) */}
                        <div className="hidden lg:flex flex-wrap gap-6">
                            {agents.map((agent) => {
                                const s = Number(agent.status);
                                const isOnline = s === AgentStatus.ONLINE;

                                return (
                                    <div
                                        key={agent.id}
                                        className="w-full group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-500/20 transition-all duration-300 overflow-hidden"
                                    >
                                        {/* Status Stripe */}
                                        <div className={`absolute top-0 left-0 w-1 lg:w-1.5 h-full transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                                        <div className="p-3 pl-5 lg:p-6 lg:pl-8">
                                            {/* Top Row: Identity & Status */}
                                            <div className="flex items-start justify-between mb-4 lg:mb-6">
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div className={`rounded-xl border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'} p-2 lg:p-3`}>
                                                        {agent.platform?.toLowerCase().includes('linux') ? <Terminal className="w-5 h-5 lg:w-6 lg:h-6" /> :
                                                            agent.platform?.toLowerCase().includes('mac') ? <Cpu className="w-5 h-5 lg:w-6 lg:h-6" /> :
                                                                <Monitor className="w-5 h-5 lg:w-6 lg:h-6" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 lg:gap-3">
                                                            <h3 className="font-bold text-slate-900 text-base lg:text-lg">
                                                                {agent.name || "Unnamed Agent"}
                                                            </h3>
                                                            {isOnline && (
                                                                <span className="flex h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-emerald-500 animate-pulse" />
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

                                                <div className={`rounded-lg text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(s)} px-2 py-1 lg:px-3 lg:py-1.5`}>
                                                    {getStatusLabel(s)}
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-2 lg:p-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
                                                    <p className="text-lg lg:text-xl font-black text-slate-900">
                                                        {(agent.success_rate || 0).toFixed(0)}%
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-2 lg:p-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                                                    <p className="text-lg lg:text-xl font-black text-emerald-600">
                                                        {agent.total_tasks_completed}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-2 lg:p-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Failed</p>
                                                    <p className="text-lg lg:text-xl font-black text-red-500">
                                                        {agent.total_tasks_failed}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer Meta */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 text-[10px] lg:text-xs text-slate-500 pt-3 lg:pt-4 gap-2 sm:gap-0">
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <span className="flex items-center gap-1.5 lg:gap-2">
                                                        <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-400" />
                                                        Last seen {agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'never'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 lg:gap-2">
                                                        <Zap className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-400" />
                                                        {agent.max_tasks_per_hour}/hr
                                                    </span>
                                                </div>

                                                <Link to={ROUTES.AGENT_PAIR} className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                    </div>
                )}
        </div>
    );
}
