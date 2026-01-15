import { useEffect, useState } from 'react';
import {
    Users,
    Activity,
    Server,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    FileText,
    Briefcase,
    Clock,
    Zap,
    Bug
} from 'lucide-react';
import { adminAPI } from '@/services/api/adminAPI.js';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const metrics = [
        {
            label: 'Total Users',
            value: stats?.total_users ?? '-',
            trend: 'Registered accounts',
            icon: Users,
            color: 'text-brand-600',
            borderColor: 'border-brand-600',
            bgColor: 'bg-brand-50'
        },
        {
            label: 'Active Users (24h)',
            value: stats?.active_users_24h ?? '-',
            trend: 'Daily engagement',
            icon: Activity,
            color: 'text-brand-600',
            borderColor: 'border-brand-600',
            bgColor: 'bg-brand-50'
        },
        {
            label: 'Total Resumes',
            value: stats?.total_resumes_generated ?? '-',
            trend: 'Core output volume',
            icon: FileText,
            color: 'text-brand-600',
            borderColor: 'border-brand-600',
            bgColor: 'bg-brand-50'
        },
        {
            label: 'Jobs Analyzed',
            value: stats?.jobs_analyzed ?? '-',
            trend: 'Scraping throughput',
            icon: Briefcase,
            color: 'text-brand-600',
            borderColor: 'border-brand-600',
            bgColor: 'bg-brand-50'
        },
        {
            label: 'Avg. Generation Time',
            value: stats ? `${stats.avg_generation_time_seconds}s` : '-',
            trend: 'User Experience',
            icon: Clock,
            color: 'text-brand-600',
            borderColor: 'border-brand-600',
            bgColor: 'bg-brand-50'
        },
        {
            label: 'Success Rate',
            value: stats ? `${stats.success_rate_percent}%` : '-',
            trend: 'Reliability',
            icon: TrendingUp,
            color: 'text-emerald-600',
            borderColor: 'border-emerald-500',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Avg. API Latency',
            value: stats ? `${stats.avg_api_latency_ms}ms` : '-',
            trend: 'Provider speed',
            icon: Zap,
            color: 'text-amber-600',
            borderColor: 'border-amber-500',
            bgColor: 'bg-amber-50'
        },
        {
            label: 'System Errors (24h)',
            value: stats?.system_errors_24h ?? '-',
            trend: 'Critical incidents',
            icon: Bug,
            color: 'text-red-600',
            borderColor: 'border-red-500',
            bgColor: 'bg-red-50'
        }
    ];

    return (
        <div className="space-y-2 md:space-y-3 lg:space-y-4 pb-2 md:pb-3 lg:pb-4">
            <div className="flex flex-col gap-2 md:gap-3 lg:gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 ">Overview</h1>
                <p className="text-slate-500  text-lg">System performance and health at a glance.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                {metrics.map((stat, index) => (
                    <div key={index} className={`relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden p-2 md:p-3 lg:p-4`}>
                        {/* Accent Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.borderColor.replace('border-', 'bg-')}`}></div>

                        <div className="flex justify-between items-center mb-2 md:mb-3 lg:mb-4">
                            <div className="flex-1">
                                {isLoading ? (
                                    <div className="h-9 w-24 bg-slate-200 rounded animate-pulse mb-2 md:mb-3 lg:mb-4"></div>
                                ) : (
                                    <h3 className="text-3xl font-bold text-slate-900  tracking-tight">{stat.value}</h3>
                                )}
                                <p className="text-sm font-semibold text-slate-600 mt-2 md:mt-3 lg:mt-4">{stat.label}</p>
                            </div>
                            <div className={`rounded-lg ${stat.bgColor} ${stat.color} flex-shrink-0 p-2 md:p-3 lg:p-4 ml-2 md:ml-3 lg:ml-4`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mt-2 md:mt-3 lg:mt-4">{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Alerts (Real Data) */}
            <div className="bg-white  rounded-lg border border-slate-200  shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 p-2 md:p-3 lg:p-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 md:gap-3 lg:gap-4">
                        <Activity className="h-5 w-5 text-slate-500" />
                        System Alerts
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 ">
                    {(stats?.recent_alerts?.length > 0) ? (
                        stats.recent_alerts.map((alert) => (
                            <div key={alert.id} className="flex items-start hover:bg-slate-50 transition-colors p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4">
                                <div className="flex-shrink-0 mt-2 md:mt-3 lg:mt-4">
                                    {(alert.type === 'warning') && <div className="rounded-full bg-amber-100 text-amber-600 p-2 md:p-3 lg:p-4"><AlertTriangle className="h-5 w-5" /></div>}
                                    {(alert.type === 'critical' || alert.type === 'fatal') && <div className="rounded-full bg-red-100 text-red-600 p-2 md:p-3 lg:p-4"><Bug className="h-5 w-5" /></div>}
                                    {alert.type === 'info' && <div className="rounded-full bg-slate-100 text-slate-600 p-2 md:p-3 lg:p-4"><Activity className="h-5 w-5" /></div>}
                                    {alert.type === 'success' && <div className="rounded-full bg-emerald-100 text-emerald-600 p-2 md:p-3 lg:p-4"><Users className="h-5 w-5" /></div>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 ">{alert.message}</p>
                                    <p className="text-xs text-slate-500 flex items-center mt-2 md:mt-3 lg:mt-4 gap-2 md:gap-3 lg:gap-4">
                                        <Clock className="h-3 w-3" />
                                        {alert.time}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 p-2 md:p-3 lg:p-4">
                            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-2 md:mb-3 lg:mb-4" />
                            <p>No recent system alerts</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
