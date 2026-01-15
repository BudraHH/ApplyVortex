import { useEffect } from 'react';
import { useAgentStore } from '../../store/useStore';
import { Sidebar } from './Sidebar';
import { StatsGrid } from './StatsGrid';
import { ActivityFeed } from './ActivityFeed';
import { TaskQueue } from './TaskQueue';
import { ActivityLog } from './ActivityLog';
import { Settings } from './Settings';
import { Terminal, StatusBar, AllActivitiesModal, Portals } from './index';

export const Agent = () => {
    // Get state from Zustand store
    const {
        theme,
        setTheme,
        selectedTab,
        setSelectedTab,
        isSidebarCollapsed,
        toggleSidebar,
        isTerminalOpen,
        toggleTerminal,
        showAllActivities,
        setShowAllActivities,
        stats,
        activities,
        terminalLogs,
        portals,
        tasks,
        system,
        startPolling,
        connectPortal,
        disconnectPortal,
        updateSetting
    } = useAgentStore();

    // Start polling for updates when component mounts
    useEffect(() => {
        const cleanup = startPolling();
        return cleanup;
    }, [startPolling]);

    // Build stats array from store data
    const statsArray = [
        {
            label: 'Jobs Found',
            value: String(stats.jobs_found),
            sublabel: 'Found on LinkedIn',
            color: 'brand'
        },
        {
            label: 'Applied',
            value: String(stats.applied),
            sublabel: 'Auto-applied',
            color: 'green'
        },
        {
            label: 'Tasks',
            value: String(stats.tasks),
            sublabel: 'In queue',
            color: 'orange'
        },
        {
            label: 'Success',
            value: stats.success_rate,
            sublabel: 'Match rate',
            color: 'brand'
        },
    ];

    const getThemeClasses = () => {
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            return 'bg-[#050505] border-[#1A1A1A] text-white';
        }
        return 'bg-white border-[#EAEAEA] text-black';
    };

    // Handle portal actions
    const handlePortalAction = (portalId, action) => {
        if (action === 'connect') {
            connectPortal(portalId);
        } else {
            disconnectPortal(portalId);
        }
    };

    return (
        <div
            className={`relative overflow-hidden transition-all duration-300 w-full h-screen ${getThemeClasses()}`}
        >
            <div className="flex h-full">
                <Sidebar
                    theme={theme}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedTab === 'dashboard' && (
                            <div className="space-y-6">
                                <StatsGrid theme={theme} stats={statsArray} />
                                <ActivityFeed
                                    theme={theme}
                                    activities={activities}
                                    onViewAll={() => setShowAllActivities(true)}
                                />
                            </div>
                        )}

                        {selectedTab === 'portals' && (
                            <Portals
                                theme={theme}
                                portals={portals}
                                onPortalAction={handlePortalAction}
                            />
                        )}

                        {selectedTab === 'tasks' && (
                            <TaskQueue theme={theme} tasks={tasks} />
                        )}

                        {selectedTab === 'logs' && (
                            <ActivityLog theme={theme} activities={activities} />
                        )}

                        {selectedTab === 'settings' && (
                            <Settings
                                theme={theme}
                                currentTheme={theme}
                                onThemeChange={setTheme}
                                onSettingChange={updateSetting}
                            />
                        )}
                    </div>

                    <Terminal
                        theme={theme}
                        isOpen={isTerminalOpen}
                        onToggle={toggleTerminal}
                        logs={terminalLogs}
                    />

                    <StatusBar theme={theme} system={system} />
                </div>
            </div>

            <AllActivitiesModal
                theme={theme}
                activities={activities}
                isOpen={showAllActivities}
                onClose={() => setShowAllActivities(false)}
            />
        </div>
    );
};
