import React from 'react';

export function DashboardSkeleton() {
    return (
        <div className="flex flex-col min-h-full bg-slate-50/30 animate-pulse gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-3 lg:gap-4">
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <div className="h-10 w-48 bg-slate-200 rounded-xl" />
                    <div className="h-5 w-72 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-12 w-40 bg-slate-200 rounded-2xl" />
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between p-2 md:p-3 lg:p-4">
                        <div className="flex justify-between">
                            <div className="space-y-2 md:space-y-3 lg:space-y-4">
                                <div className="h-3 w-20 bg-slate-100 rounded" />
                                <div className="h-10 w-16 bg-slate-200 rounded-lg" />
                            </div>
                            <div className="h-14 w-14 bg-slate-100 rounded-2xl" />
                        </div>
                        <div className="h-4 w-24 bg-slate-50 rounded" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3 lg:gap-4">
                {/* Activity Feed Skeleton */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl h-[600px] overflow-hidden">
                    <div className="border-b border-slate-50 space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="h-4 w-48 bg-slate-100 rounded" />
                    </div>
                    <div className="p-0 space-y-px">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex border-b border-slate-50 px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4 gap-2 md:gap-3 lg:gap-4">
                                <div className="h-12 w-12 bg-slate-100 rounded-2xl shrink-0" />
                                <div className="flex-1 space-y-2 md:space-y-3 lg:space-y-4">
                                    <div className="flex justify-between">
                                        <div className="h-4 w-1/3 bg-slate-200 rounded" />
                                        <div className="h-3 w-16 bg-slate-100 rounded" />
                                    </div>
                                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="lg:col-span-4 flex flex-col gap-2 md:gap-3 lg:gap-4">
                    <div className="bg-white border border-slate-200 rounded-3xl space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                        <div className="h-6 w-32 bg-slate-200 rounded" />
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-50 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-3xl h-64 space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4">
                        <div className="h-6 w-40 bg-slate-800 rounded" />
                        <div className="space-y-2 md:space-y-3 lg:space-y-4">
                            <div className="h-4 w-full bg-slate-800 rounded" />
                            <div className="h-8 w-full bg-slate-800 rounded" />
                            <div className="h-12 w-full bg-slate-700 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
