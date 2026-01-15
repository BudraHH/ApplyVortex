import { create } from 'zustand';
import { dashboardAPI } from '@/services/api/dashboardAPI';
import { agentTasksAPI } from '@/services/api/agentTasksAPI';

export const useDashboardStore = create((set, get) => ({
    overview: {
        stats: {
            jobsFound24h: 0,
            autoApplications24h: 0,
        },
        priorityDiscoveries: [],
        isLoading: false,
        error: null,
    },
    analytics: {
        heatmapData: [],
        marketShare: [],
        isLoading: false,
        error: null,
    },
    operationalFeed: {
        activities: [],
        isLoading: false,
        error: null,
    },
    optimization: {
        score: 0,
        skillGaps: [],
        salaryBoost: "0%",
        isLoading: false,
        error: null,
    },

    fetchOverview: async () => {
        set((state) => ({ overview: { ...state.overview, isLoading: true, error: null } }));
        try {
            const response = await dashboardAPI.getOverview();
            // axios interceptor returns response.data directly
            set((state) => ({
                overview: {
                    ...state.overview,
                    stats: response.stats || state.overview.stats,
                    priorityDiscoveries: response.priorityDiscoveries || [],
                    isLoading: false
                }
            }));
        } catch (error) {
            set((state) => ({ overview: { ...state.overview, isLoading: false, error: error.message } }));
        }
    },

    fetchAnalytics: async () => {
        set((state) => ({ analytics: { ...state.analytics, isLoading: true, error: null } }));
        try {
            const response = await dashboardAPI.getAnalytics();
            // axios interceptor returns response.data directly
            set((state) => ({
                analytics: {
                    ...state.analytics,
                    heatmapData: response.heatmapData || [],
                    marketShare: response.marketShare || [],
                    isLoading: false
                }
            }));
        } catch (error) {
            set((state) => ({ analytics: { ...state.analytics, isLoading: false, error: error.message } }));
        }
    },

    fetchOperationalFeed: async () => {
        set((state) => ({ operationalFeed: { ...state.operationalFeed, isLoading: true, error: null } }));
        try {
            const response = await agentTasksAPI.getHistory();
            // Format tasks into activity items if necessary, or just take slice(0, 5)
            const rawTasks = response.data || response || [];
            const activities = rawTasks.slice(0, 5).map(task => ({
                id: task.id,
                type: task.task_type?.toLowerCase().includes('apply') ? 'auto-apply' :
                    task.task_type?.toLowerCase().includes('scrape') ? 'find' : 'other',
                title: task.task_type === 'AUTO_APPLY' ? 'Autonomous Cycle' :
                    task.task_type === 'APPLY' ? 'Precision Apply' :
                        task.task_type === 'SCRAPE' ? 'Scanned Marketplace' : 'Agent Protocol',
                detail: task.payload?.job_title ? `${task.payload.job_title} • ${task.payload.company || 'Direct'}` :
                    task.payload?.keywords ? `Keywords: ${task.payload.keywords}` : 'Executing background task',
                time: task.created_at
            }));

            set((state) => ({
                operationalFeed: {
                    ...state.operationalFeed,
                    activities,
                    isLoading: false
                }
            }));
        } catch (error) {
            set((state) => ({ operationalFeed: { ...state.operationalFeed, isLoading: false, error: error.message } }));
        }
    },

    fetchOptimization: async () => {
        set((state) => ({ optimization: { ...state.optimization, isLoading: true, error: null } }));
        try {
            const response = await dashboardAPI.getOptimization();
            // axios interceptor returns response.data directly
            set((state) => ({
                optimization: {
                    ...state.optimization,
                    ...response,
                    isLoading: false
                }
            }));
        } catch (error) {
            set((state) => ({ optimization: { ...state.optimization, isLoading: false, error: error.message } }));
        }
    },

    fetchAll: async () => {
        await Promise.all([
            get().fetchOverview(),
            get().fetchAnalytics(),
            get().fetchOperationalFeed(),
            get().fetchOptimization()
        ]);
    }
}));
