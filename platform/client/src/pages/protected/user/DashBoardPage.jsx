import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    Send,
    Zap,
    Briefcase,
    CheckCircle2,
    ArrowRight,
    LayoutDashboard,
    AlertCircle,
    RefreshCw,
    Bot,
    Sparkles,
    ShieldCheck,
    Compass,
    Activity,
    Cpu,
    Target,
    Building2,
    Star
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/routes/routes.js';
import { ApplicationStatus } from '@/constants/constants';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAgentStore } from '@/stores/agentStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashBoardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        overview,
        analytics,
        operationalFeed,
        optimization: dashOptimization,
        fetchAll,
        fetchOverview
    } = useDashboardStore();

    const { agents } = useAgentStore();

    // Use loading states from the store directly
    const isOverviewLoading = overview.isLoading;
    const isAnalyticsLoading = analytics.isLoading;
    const isOperationalFeedLoading = operationalFeed.isLoading;
    const isOptimizationLoading = dashOptimization.isLoading;

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const stats = {
        ...overview.stats,
        activeAgents: agents.filter(a => Number(a.status) === 1).length, // 1 = ONLINE
        successRate: agents.length > 0
            ? (agents.reduce((acc, a) => acc + (a.success_rate || 0), 0) / agents.length).toFixed(0)
            : 0
    };

    const activities = operationalFeed.activities;
    const highValueTargets = overview.priorityDiscoveries;
    const heatmapData = analytics.heatmapData.length > 0 ? analytics.heatmapData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sourceData = analytics.marketShare.length > 0 ? analytics.marketShare : [
        { label: 'LinkedIn', value: 0, color: 'bg-brand-500' },
        { label: 'Naukri', value: 0, color: 'bg-slate-500' },
        { label: 'Direct', value: 0, color: 'bg-slate-400' },
    ];

    const handleSyncClick = async () => {
        setIsRefreshing(true);
        // fetchAll runs all individual API calls for the dashboard modules
        await fetchAll();
        setIsRefreshing(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'find': return <Search className="h-4 w-4 text-brand-500" />;
            case 'apply': return <Send className="h-4 w-4 text-emerald-500" />;
            case 'auto-apply': return <Zap className="h-4 w-4 text-amber-500" />;
            default: return <Briefcase className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-white border border-slate-100 hover:border-slate-200 transition-colors rounded-xl overflow-y-auto custom-scrollbar gap-2 p-2 md:gap-6 md:p-6">
            {/* Header: Command Block */}
            <div className="flex flex-row justify-between items-center bg-slate-50/50 rounded-xl border border-slate-100 p-4 md:p-6 gap-4">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-black">Control Center</h1>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                        <span className="md:hidden">ID: AF-90210</span>
                        <span className="hidden md:inline">Active System ID: AF-90210</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Worker Pulse</span>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-xl bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-900">Synchronized</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleSyncClick}
                        disabled={isRefreshing}
                        className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                    >
                        <RefreshCw className={`h-3 w-3 md:h-3.5 md:w-3.5 ${isRefreshing ? 'animate-spin' : ''} mr-2`} />
                        {isRefreshing ? 'Syncing...' : 'Sync Data'}
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <MetricCard
                    title="Total Detections"
                    value={stats.jobsFound24h}
                    label="Last 24h"
                    icon={<Compass />}
                    color="brand"
                    isLoading={isOverviewLoading}
                    onClick={() => navigate(ROUTES.JOBS, { state: { recency: '24h' } })}
                />
                <MetricCard
                    title="Auto Applied"
                    value={stats.autoApplications24h}
                    label="Last 24h"
                    icon={<Zap />}
                    color="amber"
                    isLoading={isOverviewLoading}
                    onClick={() => navigate(ROUTES.JOBS, { state: { recency: '24h', status: String(ApplicationStatus.APPLIED) } })}
                />
                <MetricCard
                    title="Parallel Agents"
                    value={stats.activeAgents}
                    label="Live Workers"
                    icon={<Bot />}
                    color="slate"
                    isLoading={false}
                    onClick={() => navigate(ROUTES.MY_AGENTS)}
                />
            </div>

            {/* Main Operational Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-6">

                {/* Primary Column (Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-2 md:gap-6">

                    {/* Heatmap block */}
                    <Card className="border-slate-100 bg-slate-50/30 rounded-xl shadow-none hover:border-slate-200 transition-colors">
                        <CardHeader className="border-b border-white flex flex-row items-center justify-between p-4 md:p-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Efficiency Pulse</span>
                                {!isAnalyticsLoading && heatmapData.every(v => v === 0) && (
                                    <span className="text-[9px] font-medium text-slate-400">• No data found</span>
                                )}
                            </div>
                            <Badge variant="outline" className="border-slate-200 text-slate-500 rounded-xl font-bold text-[9px] px-3">14D RECAP</Badge>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <ActivityHeatmap data={heatmapData} isLoading={isAnalyticsLoading} />
                        </CardContent>
                    </Card>

                    {/* Priority Matches */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Priority Discoveries</h2>
                                {!isOverviewLoading && highValueTargets.length === 0 && (
                                    <span className="text-[9px] font-medium text-slate-400">• No data found</span>
                                )}
                            </div>
                            {!isOverviewLoading && highValueTargets.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-[9px] font-black text-brand-600 hover:text-brand-700 p-0 hover:bg-transparent tracking-widest uppercase transition-colors shadow-none"
                                    onClick={() => navigate(ROUTES.JOBS, { state: { sort: 'high-to-low' } })}
                                >
                                    See More
                                </Button>
                            )}
                        </div>
                        {/* Conditional container: scrollable for loading/data, static grid for empty */}
                        {highValueTargets.length === 0 && !isOverviewLoading ? (
                            /* Empty state: 2 static cards in a grid (non-scrollable) */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-slate-50 border border-slate-100 rounded-xl flex flex-col p-4 gap-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="bg-slate-100 rounded-xl p-3">
                                                <Building2 className="h-5 w-5 text-slate-300" />
                                            </div>
                                            <div className="h-7 w-20 bg-slate-100 rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                            <div className="h-3 w-1/2 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Loading or Data present: Horizontal scrollable carousel */
                            <div className="flex overflow-x-auto no-scrollbar snap-x gap-4 pb-4">
                                {isOverviewLoading ? (
                                    /* Loading state: 4 skeleton cards */
                                    [1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="flex-none w-[85%] sm:w-[calc(50%-12px)] bg-white border border-slate-100 rounded-xl flex flex-col snap-start p-4 gap-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <div className="h-5 w-5 bg-slate-100 rounded" />
                                                </div>
                                                <Skeleton className="h-7 w-20 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                <Skeleton className="h-3 w-1/2 rounded" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    highValueTargets.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex-none w-[85%] sm:w-[calc(50%-12px)] bg-white border border-slate-100 rounded-xl flex flex-col hover:border-slate-200 transition-all cursor-pointer group shadow-none snap-start p-4 gap-4"
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="bg-slate-50 rounded-xl group-hover:bg-brand-50 transition-colors p-3">
                                                    <Building2 className="h-5 w-5 text-slate-400 group-hover:text-brand-500" />
                                                </div>
                                                <Badge className="bg-emerald-50 text-emerald-600 border-0 flex items-center h-7 font-bold text-[10px] rounded-xl gap-1.5 px-3">
                                                    <Star className="h-3 w-3 fill-emerald-600" />
                                                    {job.score}% MATCH
                                                </Badge>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-black text-sm">{job.role}</h4>
                                                <p className="text-[11px] text-slate-500 font-medium mt-2">{job.company} • {job.location}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Operation Stream (Top 5) */}
                    <Card className="border-slate-100 hover:border-slate-200 transition-colors bg-white rounded-xl flex-1 flex flex-col shadow-none">
                        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between p-4 md:p-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Feed</span>

                            {!isOperationalFeedLoading && activities.length > 0 && (<Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(ROUTES.MY_AGENTS, { state: { scrollTo: 'live-operations' } })}
                            >
                                VIEW FULL LOGS
                            </Button>)}
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            {isOperationalFeedLoading ? (
                                /* Loading state: 5 skeleton rows */
                                <div className="divide-y divide-slate-50">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-start p-4 gap-4">
                                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-2">
                                                <Skeleton className="h-5 w-5 rounded" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <Skeleton className="h-4 w-40 rounded" />
                                                    <Skeleton className="h-3 w-12 rounded shrink-0" />
                                                </div>
                                                <Skeleton className="h-3 w-3/4 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {activities.slice(0, 5).map((activity) => (
                                        <div key={activity.id} className="flex items-start hover:bg-slate-50/50 transition-all group p-4 gap-4">
                                            <div className="bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors p-2">
                                                {getIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-black text-sm truncate">{activity.title}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-auto">{activity.time}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate font-medium mt-1">{activity.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-full py-6 px-6">
                                    <h4 className="font-bold text-slate-500 mb-2">No Feed Found</h4>
                                    <p className="text-sm text-slate-400 font-medium max-w-[200px]">
                                        Start your agent to begin discovering jobs and automating applications.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Secondary Column (Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-2 md:gap-6">

                    {/* Market Distribution */}
                    <Card className="border-slate-100 hover:border-slate-200 transition-colors bg-white rounded-xl overflow-hidden shadow-none">
                        <CardHeader className="border-b border-slate-50 p-4 md:p-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Market Share</span>
                                {!isAnalyticsLoading && sourceData.every(item => item.value === 0) && (
                                    <span className="text-[9px] font-medium text-slate-400">• No data found</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <SourceBreakdown data={sourceData} isLoading={isAnalyticsLoading} />
                        </CardContent>
                    </Card>

                    {/* Optimization Engine: Diagnostic UI */}
                    <Card className="border border-slate-100 hover:border-slate-200 transition-colors bg-white rounded-xl relative flex-1 shadow-none overflow-hidden group p-4 md:p-6">

                        <div className="relative z-10 flex flex-col h-full gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block leading-none">Intelligence Engine</span>
                                    {dashOptimization.score === 0 && !isOptimizationLoading && (
                                        <span className="text-[9px] font-medium text-slate-400">• No Data</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">Optimization</h3>
                            </div>

                            {isOptimizationLoading ? (
                                /* Loading State UI */
                                <>
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <Skeleton className="h-3 w-20 rounded" />
                                                <Skeleton className="h-8 w-16 rounded" />
                                            </div>
                                            <Skeleton className="h-5 w-16 rounded-lg" />
                                        </div>
                                        <Skeleton className="h-1.5 w-full rounded-xl" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-center px-0">
                                            <Skeleton className="h-3 w-32 rounded" />
                                            <Skeleton className="h-5 w-12 rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center p-3">
                                                    <Skeleton className="h-3 w-24 rounded" />
                                                    <Skeleton className="h-3 w-10 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                        <Skeleton className="h-3 w-full rounded mt-4" />
                                    </div>

                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </>
                            ) : dashOptimization.score === 0 && dashOptimization.skillGaps?.length === 0 ? (
                                /* Empty State UI */
                                <>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <div className="h-3 w-20 bg-slate-100 rounded" />
                                                <div className="h-8 w-16 bg-slate-100 rounded" />
                                            </div>
                                            <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-xl" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-center px-0">
                                            <div className="h-3 w-32 bg-slate-100 rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center p-3">
                                                    <div className="h-3 w-24 bg-slate-100 rounded" />
                                                    <div className="h-3 w-10 bg-slate-100 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium px-0 mt-4">
                                            Sync jobs to get personalized optimization insights.
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => navigate(ROUTES.APPLY)}
                                    >
                                        Sync Jobs First
                                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                    </Button>
                                </>
                            ) : (
                                /* Data Present UI */
                                <>
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Quality</span>
                                                <div className="text-3xl font-bold flex items-baseline text-slate-900 gap-2">
                                                    {dashOptimization.score}<span className="text-brand-600 text-lg">%</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {dashOptimization.skillGaps?.length > 0 ? (
                                                    <Badge className="bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black rounded-lg h-5 tracking-tighter shadow-none">ACTION REQUIRED</Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black rounded-lg h-5 tracking-tighter shadow-none">OPTIMIZED</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200/50 rounded-xl overflow-hidden mt-4">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${dashOptimization.score}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-brand-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className={`h-3.5 w-3.5 ${dashOptimization.skillGaps?.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                                                {dashOptimization.skillGaps?.length > 0 ? 'Detected Profile Gaps' : 'No Gaps Detected'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 text-[9px] font-black text-brand-600 hover:text-brand-700 p-0 hover:bg-transparent tracking-widest uppercase transition-colors shadow-none"
                                                onClick={() => navigate(ROUTES.OPTIMIZATION)}
                                            >
                                                See More
                                            </Button>
                                        </div>
                                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                            {dashOptimization.skillGaps?.length > 0 ? (
                                                dashOptimization.skillGaps.slice(0, 3).map((gap, idx) => (
                                                    <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center group/item hover:bg-white transition-all p-3">
                                                        <span className="text-[11px] text-slate-600 font-bold tracking-tight">{gap.skill}</span>
                                                        <span className="text-[10px] text-emerald-600 font-black tracking-widest">{gap.impact}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-slate-50/50 border border-slate-100 rounded-xl text-center p-3">
                                                    <span className="text-[11px] text-slate-500 font-medium">
                                                        Your profile is well optimized!
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium px-0 mt-4">
                                            {dashOptimization.skillGaps?.length > 0
                                                ? 'Resolving these nexus points will significantly elevate your market positioning.'
                                                : `Estimated salary boost: ${dashOptimization.salaryBoost}`}
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => navigate(ROUTES.OPTIMIZATION)}
                                    >
                                        {dashOptimization.skillGaps?.length > 0 ? 'START OPTIMIZATION' : 'VIEW DETAILS'}
                                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform ml-2" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, label, icon, color, isLoading, onClick }) {
    const variants = {
        brand: 'text-brand-600 bg-brand-50 border-brand-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100',
    };
    return (
        <Card
            className={`bg-white border border-slate-100 rounded-xl flex items-center shadow-none transition-all ${onClick ? 'cursor-pointer hover:border-slate-200' : ''} p-3 md:p-6 gap-3 md:gap-4`}
            onClick={onClick}
        >
            <div className={`rounded-xl ${variants[color]} border shrink-0 p-3`}>
                {React.cloneElement(icon, { className: 'h-6 w-6' })}
            </div>
            <div className="min-w-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">{title}</span>
                <div className="flex items-baseline gap-2">
                    {isLoading ? (
                        <Skeleton className="h-6 w-6 rounded" />
                    ) : (
                        <h3 className="text-2xl font-bold text-black tracking-tight leading-none">{value}</h3>
                    )}
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
                </div>
            </div>
        </Card>
    );
}

function ActivityHeatmap({ data, isLoading }) {
    if (isLoading) {
        return (
            <div className="flex justify-between gap-1">
                {[...Array(14)].map((_, idx) => (
                    <Skeleton key={idx} className="flex-1 h-10 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex justify-between gap-1">
            {data.map((val, idx) => {
                const opacity = val === 0 ? 0.05 : val < 5 ? 0.3 : val < 10 ? 0.6 : 1;
                return (
                    <div key={idx} className="flex-1 h-10 rounded-xl bg-brand-500 relative group" style={{ opacity }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-none py-1 px-2">
                            {val} Cycles
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SourceBreakdown({ data, isLoading }) {
    // Calculate cumulative offsets for each segment
    const circumference = 100; // Using 100 for easy percentage math
    let cumulativeOffset = 0;

    // Map colors to Tailwind stroke colors
    const colorToStroke = {
        'bg-brand-500': '#6366f1',    // brand/indigo
        'bg-slate-500': '#64748b',    // slate
        'bg-slate-400': '#94a3b8',    // slate-400
        'bg-blue-500': '#3b82f6',     // blue
        'bg-emerald-500': '#10b981',  // emerald
    };

    // Check if there's any data
    const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
    const hasData = totalValue > 0;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center py-4">
                    <Skeleton className="h-28 w-28 rounded-full" />
                </div>
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50/50 rounded-xl border border-slate-50 p-3">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-2 w-2 rounded-xl" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                            <Skeleton className="h-3 w-8 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center py-4">
                <div className="relative h-28 w-28">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        {/* Background circle */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        {/* Dynamic segments based on data */}
                        {hasData ? (
                            data.map((item, idx) => {
                                if (item.value <= 0) return null;
                                const strokeColor = colorToStroke[item.color] || '#94a3b8';
                                const dashArray = `${item.value} ${circumference - item.value}`;
                                const dashOffset = -cumulativeOffset;

                                // Update cumulative offset for next segment
                                const element = (
                                    <circle
                                        key={idx}
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth="4"
                                        strokeDasharray={dashArray}
                                        strokeDashoffset={dashOffset}
                                    />
                                );

                                cumulativeOffset += item.value;
                                return element;
                            })
                        ) : (
                            /* Empty state - full gray circle */
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-[10px] font-black tracking-tighter uppercase ${hasData ? 'text-black' : 'text-slate-400'}`}>
                            {hasData ? 'Market' : 'No Data'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {hasData ? (
                    data.map((item) => (
                        <div key={item.label} className="flex justify-between items-center bg-slate-50/50 rounded-xl border border-slate-50 p-3">
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-xl ${item.color}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{item.label}</span>
                            </div>
                            <span className="text-[10px] font-black text-black leading-none">{item.value}%</span>
                        </div>
                    ))
                ) : (
                    /* Empty state: skeleton rows */
                    [1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl border border-slate-100 p-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-xl bg-slate-200" />
                                <div className="h-3 w-16 bg-slate-100 rounded" />
                            </div>
                            <div className="h-3 w-8 bg-slate-100 rounded" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}