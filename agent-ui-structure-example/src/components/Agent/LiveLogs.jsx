export const LiveLogs = ({ logs }) => {
    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b-2 border-slate-200">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Logs
                </h3>
            </div>

            <div className="bg-slate-900 p-4 font-mono text-xs h-[200px] overflow-y-auto">
                {logs.map((log, index) => (
                    <div key={index} className="mb-1 hover:bg-slate-800/50 px-2 py-1 rounded transition-colors">
                        <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                        <span className={
                            log.type === 'success' ? 'text-green-400 font-bold' :
                                log.type === 'warning' ? 'text-yellow-400 font-bold' :
                                    log.type === 'error' ? 'text-red-400 font-bold' :
                                        'text-blue-400 font-bold'
                        }>
                            {log.icon}
                        </span>{' '}
                        <span className="text-slate-300">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
