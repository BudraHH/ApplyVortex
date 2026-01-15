export const AgentStatus = ({ status, tasks, uptime, banRisk }) => {
    const getStatusColor = () => {
        if (status === 'LIVE') return 'bg-green-500';
        if (status === 'PAUSED') return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getBanRiskColor = () => {
        if (banRisk < 5) return 'text-green-600 bg-green-50';
        if (banRisk < 15) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800">Agent Status</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
                    <span className="text-sm font-bold text-slate-700">{status}</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Current Time</span>
                    <span className="text-sm font-semibold text-slate-800">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Tasks</span>
                    <span className="text-sm font-semibold text-slate-800">{tasks}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Uptime</span>
                    <span className="text-sm font-semibold text-slate-800">{uptime}</span>
                </div>

                <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Ban Risk</span>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${getBanRiskColor()}`}>
                            {banRisk < 5 ? 'LOW' : banRisk < 15 ? 'MEDIUM' : 'HIGH'} ({banRisk}%)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
