export const QuickActions = ({ onFindJobs, onAutoApply, onPauseAll }) => {
    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h3>

            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={onFindJobs}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-lg transition-all"
                >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-700">Find Jobs</span>
                </button>

                <button
                    onClick={onAutoApply}
                    className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-lg transition-all"
                >
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">Auto Apply</span>
                </button>

                <button
                    onClick={onPauseAll}
                    className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 rounded-lg transition-all"
                >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-orange-700">Pause All</span>
                </button>
            </div>
        </div>
    );
};
