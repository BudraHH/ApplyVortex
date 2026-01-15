/**
 * Agent Status Indicator Component
 * Shows real-time heartbeat/connectivity status of Agent Forge instances
 * Uses global store to prevent redundant API calls
 */
import { Monitor, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgentStore } from '@/stores/agentStore';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/lib/utils';

export function AgentStatusIndicator({ variant = 'compact' }) {
    // Subscribe to store state
    const agents = useAgentStore((state) => state.agents);
    const isLoading = useAgentStore((state) => state.isLoading);
    const isOnline = useAgentStore((state) => state.isAnyAgentOnline());
    const onlineCount = useAgentStore((state) => state.getOnlineCount());

    if (variant === 'compact') {
        return (
            <Link
                to={ROUTES.MY_AGENTS}
                className="flex items-center rounded-lg border border-slate-200 bg-slate-50 group transition-all hover:bg-slate-100 hover:border-slate-300 shadow-sm gap-4 px-4 py-3"
            >
                <div className="relative">
                    <Monitor className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span className={cn(
                        "absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full border-2 border-white",
                        isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" : "bg-slate-300"
                    )} />
                </div>
                <div className="hidden sm:flex flex-row items-center gap-4">
                    <span className="text-sm font-medium text-slate-500">Agent Forge:</span>
                    <span className={cn(
                        "text-sm font-bold",
                        isOnline ? "text-green-600" : "text-slate-400"
                    )}>
                        {isOnline ? `Online` : 'Offline'}
                    </span>
                </div>
            </Link>
        );
    }

    // For full variant, we only want to show if offline (as per user request)
    if (variant === 'full' && isOnline) {
        return null;
    }

    return (
        <div className={cn(
            "rounded-lg border flex items-center justify-between transition-all shadow-sm p-4 gap-4",
            isOnline
                ? "bg-green-50 border-green-100"
                : "bg-amber-50 border-amber-100"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "rounded-xl shadow-sm p-3",
                    isOnline
                        ? "bg-white text-green-600 border border-green-100"
                        : "bg-white text-amber-600 border border-amber-100"
                )}>
                    <Monitor className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900">
                        Agent Operational Status
                    </h4>
                    <p className={cn(
                        "text-[11px] font-medium",
                        isOnline ? "text-green-600" : "text-amber-700"
                    )}>
                        {isOnline
                            ? `${onlineCount} active worker(s) ready to engage.`
                            : 'No active workers detected. Start an agent to begin.'}
                    </p>
                </div>
            </div>

            {isOnline ? (
                <Link
                    to={ROUTES.MY_AGENTS}
                    className="flex items-center text-xs font-bold text-green-600 hover:text-green-700 hover:underline bg-white rounded-lg border border-green-100 transition-colors shadow-sm gap-3 px-4 py-3"
                >
                    View Fleet <ArrowRight className="h-3 w-3" />
                </Link>
            ) : (
                <Link
                    to={ROUTES.DOWNLOAD_AGENT}
                    className="flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline bg-white rounded-lg border border-amber-100 transition-colors shadow-sm gap-3 px-4 py-3"
                >
                    Setup Agent <ArrowRight className="h-3 w-3" />
                </Link>
            )}
        </div>
    );
}
