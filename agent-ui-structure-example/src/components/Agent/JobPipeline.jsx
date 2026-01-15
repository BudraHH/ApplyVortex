export const JobPipeline = ({ pipeline }) => {
    const stages = [
        { key: 'pending', label: 'Pending', color: 'slate' },
        { key: 'scraped', label: 'Scraped', color: 'blue' },
        { key: 'highMatch', label: 'High Match', color: 'purple' },
        { key: 'applied', label: 'Applied', color: 'orange' },
        { key: 'success', label: 'Success', color: 'green' },
    ];

    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-slate-800 mb-4">Job Pipeline</h3>

            <div className="flex items-center justify-between gap-2">
                {stages.map((stage, index) => (
                    <div key={stage.key} className="flex items-center flex-1">
                        <div className="flex-1">
                            <div className={`bg-${stage.color}-50 border-2 border-${stage.color}-200 rounded-lg p-3 text-center hover:border-${stage.color}-400 transition-colors`}>
                                <div className={`text-2xl font-bold text-${stage.color}-700 mb-1`}>
                                    {pipeline[stage.key] || 0}
                                </div>
                                <div className={`text-xs font-semibold text-${stage.color}-600`}>
                                    {stage.label}
                                </div>
                            </div>
                        </div>

                        {index < stages.length - 1 && (
                            <div className="px-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
