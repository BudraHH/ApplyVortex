export const ResumeManager = ({ resumes, onUpload, onGenerateAI }) => {
    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Resume Manager</h3>
                    <p className="text-xs text-slate-500">Manage tailored resumes for different roles</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onGenerateAI}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Tailor
                    </button>
                    <button
                        onClick={onUpload}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {resumes.map((resume) => (
                    <div
                        key={resume.id}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${resume.primary
                                ? 'bg-blue-50/30 border-blue-200'
                                : 'bg-white border-slate-100 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${resume.primary ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">{resume.filename}</span>
                                    {resume.primary && (
                                        <span className="bg-blue-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Primary</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-slate-400">Uploaded: {resume.date}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-green-600">{resume.matchScore}% match hint</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            {!resume.primary && (
                                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-all">
                                    Set Primary
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-start gap-3">
                    <div className="text-purple-600 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-[10px] text-purple-700 leading-relaxed font-medium">
                        <span className="font-bold">Pro Tip:</span> Using the <span className="font-bold">AI Tailor</span> increases your match score by an average of 34% by optimizing keywords for specific blueprints.
                    </p>
                </div>
            </div>
        </div>
    );
};
