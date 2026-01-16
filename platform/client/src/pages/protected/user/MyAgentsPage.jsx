import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgentStore } from '@/stores/agentStore';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectedAgentsSection } from '@/components/agent/ConnectedAgentsSection';
import { LiveOperationsSection } from '@/components/agent/LiveOperationsSection';

export default function MyAgentsPage() {
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

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl flex-1 w-full h-full overflow-y-auto min-h-0 custom-scrollbar animate-in fade-in duration-500 p-3 lg:p-6 space-y-4 lg:space-y-8">
            <ConnectedAgentsSection
                agents={agents}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
            />
            <LiveOperationsSection ref={liveOpsRef} />
        </div>
    );
}
