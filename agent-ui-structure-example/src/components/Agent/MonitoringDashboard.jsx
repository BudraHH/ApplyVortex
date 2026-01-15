export const MonitoringDashboard = ({ tasks }) => {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
                {/* Agent Stats */}
                <div className="col-span-2 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Performance Metrics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Sessions Alive</div>
                            <div className="text-2xl font-black text-slate-800">3 <span className="text-slate-400 font-normal">/ 3</span></div>
                            <div className="mt-2 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Jobs / Hour</div>
                            <div className="text-2xl font-black text-blue-600">42</div>
                            <div className="mt-2 text-[10px] font-bold text-green-600">↑ 12% vs last hr</div>
                        </div>
                        <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Avg Apply Time</div>
                            <div className="text-2xl font-black text-slate-800">2m 14s</div>
                            <div className="mt-2 text-[10px] font-bold text-slate-500">Efficient ⚡</div>
                        </div>
                    </div>
                </div>

                {/* Ban Risk Meter */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Security Heath</h3>
                    <div className="relative pt-4 pb-2">
                        <div className="flex items-end justify-center gap-1.5 h-16">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                <div
                                    key={i}
                                    className={`w-2.5 rounded-t-sm transition-all duration-500 ${i <= 2 ? 'bg-green-500 h-[20%]' :
                                        i <= 10 ? 'bg-slate-100 h-[10%]' : 'bg-slate-100 h-[5%]'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-center mt-3">
                            <div className="text-3xl font-black text-green-600 leading-none">2%</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">LOW RISK</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                {/* Task Queue */}
                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-700">Live Task Pipeline</h3>
                        <span className="text-[10px] font-black text-slate-400">QUEUE: {tasks.filter(t => t.status === 'PENDING').length}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {tasks.map((task) => (
                            <div key={task.id} className="px-5 py-3 hover:bg-slate-50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${task.status === 'DONE' ? 'bg-green-100 text-green-600' :
                                        task.status === 'WORKING' ? 'bg-blue-100 text-blue-600' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {task.status === 'DONE' ? '✅' : task.status === 'WORKING' ? '🔄' : '⏳'}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-800">#{task.id} {task.type}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{task.target}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono font-bold text-slate-400">
                                    {task.status === 'DONE' ? 'COMPLETED' : task.status === 'WORKING' ? 'RUNNING...' : 'QUEUED'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detection Log */}
                <div className="bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400">Detection Log (Stealth Events)</h3>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="p-4 font-mono text-[10px] text-blue-300 h-[240px] overflow-y-auto space-y-1">
                        <div className="text-slate-500">[12:01:45] <span className="text-green-500">INIT:</span> Sticky fingerprint applied (Session #1)</div>
                        <div className="text-slate-500">[12:02:12] <span className="text-green-500">HUMAN:</span> Simulated mouse jitter performed (LinkedIn)</div>
                        <div className="text-slate-500">[12:02:58] <span className="text-green-500">STEALTH:</span> Navigator.plugins spoofed successfully</div>
                        <div className="text-slate-500">[12:03:14] <span className="text-yellow-500">WATCH:</span> High scroll speed detected - Throttling...</div>
                        <div className="text-slate-500">[12:03:45] <span className="text-green-500">PROXY:</span> IP Rotated (US-East &rarr; US-West)</div>
                        <div className="text-slate-500">[12:04:02] <span className="text-green-500">STATUS:</span> 0 detections in past 60 minutes.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
