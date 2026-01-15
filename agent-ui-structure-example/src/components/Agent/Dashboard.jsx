import { AgentStatus } from './AgentStatus';
import { QuickActions } from './QuickActions';
import { JobPipeline } from './JobPipeline';
import { LiveLogs } from './LiveLogs';
import { StatsGrid } from './StatsGrid';

export const Dashboard = () => {
    const agentData = {
        status: 'LIVE',
        tasks: '3/5',
        uptime: '4h 23m',
        banRisk: 2
    };

    const pipelineData = {
        pending: 3,
        scraped: 12,
        highMatch: 5,
        applied: 8,
        success: 3
    };

    const liveLogs = [
        { timestamp: '12:03:45', type: 'success', icon: '✅', message: 'Applied to Google - Senior Software Engineer' },
        { timestamp: '12:03:12', type: 'info', icon: '🔍', message: 'Scraping LinkedIn for Python Remote jobs' },
        { timestamp: '12:02:58', type: 'success', icon: '✅', message: 'Resume parsed - 15 skills extracted' },
        { timestamp: '12:02:34', type: 'warning', icon: '⚠️', message: 'Auto-apply paused - waiting for confirmation' },
        { timestamp: '12:02:15', type: 'info', icon: '📊', message: 'Deep scrape completed for Microsoft position' },
        { timestamp: '12:01:52', type: 'success', icon: '✅', message: 'Application submitted to TechCorp' },
        { timestamp: '12:01:28', type: 'info', icon: '🔄', message: 'Scanning Naukri.com - 47 jobs found' },
    ];

    const stats = [
        { label: 'Jobs Applied', value: '127', sublabel: 'Total applications', icon: '📊', color: 'blue' },
        { label: 'Success Rate', value: '92%', sublabel: '+5% from last week', icon: '✓', color: 'green' },
        { label: 'Active Tasks', value: '3', sublabel: 'Currently running', icon: '⚡', color: 'orange' },
        { label: 'Queue', value: '12', sublabel: 'Pending tasks', icon: '⏳', color: 'purple' },
    ];

    return (
        <div className="space-y-5">
            {/* Top Row: Agent Status + Quick Actions */}
            <div className="grid grid-cols-2 gap-5">
                <AgentStatus {...agentData} />
                <QuickActions
                    onFindJobs={() => console.log('Find Jobs')}
                    onAutoApply={() => console.log('Auto Apply')}
                    onPauseAll={() => console.log('Pause All')}
                />
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Job Pipeline */}
            <JobPipeline pipeline={pipelineData} />

            {/* Live Logs */}
            <LiveLogs logs={liveLogs} />
        </div>
    );
};
