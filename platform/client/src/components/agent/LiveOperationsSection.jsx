import React from 'react';
import { Activity, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { TaskStatusList } from '@/components/agent/TaskStatusList.jsx';

export const LiveOperationsSection = React.forwardRef((props, ref) => {
    const [tasksRefreshTrigger, setTasksRefreshTrigger] = React.useState(0);
    const [isTasksLoading, setIsTasksLoading] = React.useState(true);
    const [isTasksRefreshing, setIsTasksRefreshing] = React.useState(false);

    const handleRefreshTasks = () => {
        setIsTasksRefreshing(true);
        setTasksRefreshTrigger(prev => prev + 1);
    };

    return (
        <div ref={ref} className="border-t border-slate-100 pt-4 lg:pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-6 mb-4 lg:mb-6">
                <div className="space-y-1">
                    <h2 className="text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2 lg:gap-3">
                        <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-brand-500" />
                        Live Operations
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-500">
                        Real-time monitoring of all active agent tasks and background processes.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefreshTasks}
                    disabled={isTasksLoading || isTasksRefreshing}
                    className="border-slate-200 hover:bg-slate-50 w-full md:w-auto lg:min-w-[140px] gap-2 text-xs lg:text-sm h-9 lg:h-10"
                >
                    <RotateCw className={cn("w-3.5 h-3.5 lg:w-4 lg:h-4", (isTasksLoading || isTasksRefreshing) && "animate-spin")} />
                    {isTasksLoading ? "Loading..." : isTasksRefreshing ? "Refreshing..." : "Refresh Intel"}
                </Button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <TaskStatusList
                    refreshTrigger={tasksRefreshTrigger}
                    onLoadingChange={(loading) => {
                        if (!loading) {
                            setIsTasksLoading(false);
                            setIsTasksRefreshing(false);
                        }
                    }}
                />
            </div>
        </div>
    );
});

LiveOperationsSection.displayName = "LiveOperationsSection";
