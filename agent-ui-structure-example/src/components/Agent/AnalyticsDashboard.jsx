export const AnalyticsDashboard = () => {
    return (
        <div className="grid grid-cols-2 gap-5">
            {/* Success Trends (Visual Chart Representation) */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Application Trends</h3>
                        <p className="text-xs text-slate-500">Weekly growth and success rate</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-black text-green-600">92%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SUCCESS RATE</div>
                    </div>
                </div>

                <div className="flex items-end justify-between h-40 gap-2 px-2">
                    {[32, 45, 28, 56, 42, 68, 75].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full">
                                <div
                                    className="bg-blue-500/20 group-hover:bg-blue-500/40 transition-all rounded-t-lg w-full"
                                    style={{ height: `${val}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded">
                                        {val}
                                    </div>
                                    <div className="h-1 bg-blue-600 rounded-t-lg w-full"></div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">D{i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Funnel Tracker */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6 font-display">Response Pipeline</h3>
                <div className="space-y-4">
                    <div className="relative">
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 px-2">
                            <span>APPLIED</span>
                            <span>47</span>
                        </div>
                        <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border-2 border-slate-100">
                            <div className="bg-slate-500 h-full w-[100%] rounded-l-md shadow-inner"></div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex justify-between text-xs font-bold text-blue-600 mb-1.5 px-2">
                            <span>RESPONSES (17%)</span>
                            <span>8</span>
                        </div>
                        <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border-2 border-slate-100 flex justify-center">
                            <div className="bg-blue-500 h-full w-[80%] rounded-md shadow-inner"></div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex justify-between text-xs font-bold text-purple-600 mb-1.5 px-2">
                            <span>INTERVIEWS (6%)</span>
                            <span>3</span>
                        </div>
                        <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border-2 border-slate-100 flex justify-center">
                            <div className="bg-purple-500 h-full w-[40%] rounded-md shadow-inner"></div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex justify-between text-xs font-bold text-green-600 mb-1.5 px-2">
                            <span>OFFERS</span>
                            <span>1</span>
                        </div>
                        <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border-2 border-slate-100 flex justify-center">
                            <div className="bg-green-500 h-full w-[20%] rounded-md shadow-inner"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="col-span-2 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm mt-5">
                <h3 className="text-base font-bold text-slate-800 mb-4">Company Leaderboard (Best Targets)</h3>
                <div className="grid grid-cols-3 gap-5">
                    {[
                        { name: 'Google', applied: 10, matched: 8, color: 'blue' },
                        { name: 'Microsoft', applied: 8, matched: 6, color: 'green' },
                        { name: 'Amazon', applied: 18, matched: 12, color: 'orange' }
                    ].map((company, i) => (
                        <div key={i} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl hover:bg-white hover:border-blue-200 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">#{i + 1} {company.name}</span>
                                <span className="text-xs font-bold text-blue-600">{Math.round((company.matched / company.applied) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${company.color}-500 transition-all duration-1000`}
                                        style={{ width: `${(company.matched / company.applied) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-bold text-slate-500">APPLIED: {company.applied}</span>
                                <span className="text-[10px] font-bold text-slate-500">MATCH: {company.matched}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
