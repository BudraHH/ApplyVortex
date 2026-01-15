import { create } from 'zustand';

/**
 * PyWebView API Bridge
 * When running in PyWebView, window.pywebview.api is available
 * This provides fallback mock data for development
 */
const getApi = () => {
    if (typeof window !== 'undefined' && window.pywebview && window.pywebview.api) {
        return window.pywebview.api;
    }
    return null;
};

const isPyWebView = () => {
    return typeof window !== 'undefined' && window.pywebview && window.pywebview.api;
};

// Mock data for development (when not running in PyWebView)
const mockData = {
    stats: {
        jobs_found: 142,
        applied: 47,
        tasks: 12,
        success_rate: '89%',
        uptime: '2h 15m',
        is_online: true
    },
    activities: [
        { id: 1, taskType: 0, priority: 3, type: 'success', message: 'Resume parsed successfully - extracted 15 skills, 3 experiences', time: '2m ago', timestamp: '14:32:15' },
        { id: 2, taskType: 2, priority: 2, type: 'info', message: 'Scraping job details for: Senior Frontend Developer at TechCorp', time: 'Just now', timestamp: '14:34:02' },
        { id: 3, taskType: 3, priority: 3, type: 'warning', message: 'Application blocked by Captcha - human intervention required', time: '5m ago', timestamp: '14:29:10' },
        { id: 4, taskType: 1, priority: 1, type: 'success', message: 'Found 12 new matching jobs on LinkedIn', time: '12m ago', timestamp: '14:22:45' },
    ],
    terminalLogs: [
        { id: 1, timestamp: '19:53:10', level: 'info', message: 'Agent initialized successfully.' },
        { id: 2, timestamp: '19:53:12', level: 'success', message: 'Session #42 started (Stealth Mode: Enabled)' },
        { id: 3, timestamp: '19:53:15', level: 'info', message: 'Navigating to linkedin.com/jobs...' },
        { id: 4, timestamp: '19:53:22', level: 'warning', message: 'Scrolling detected as high speed. Throttling mouse movements.' },
        { id: 5, timestamp: '19:53:30', level: 'info', message: 'Found match: "Senior Frontend Engineer" - Match Score: 94%' },
    ],
    portals: [
        { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', status: 'connected', lastSync: '2m ago', successRate: '94%', color: 'bg-brand' },
        { id: 'naukri', name: 'Naukri', url: 'https://naukri.com', status: 'connected', lastSync: '15m ago', successRate: '88%', color: 'bg-orange-500' },
        { id: 'indeed', name: 'Indeed', url: 'https://indeed.com', status: 'disconnected', lastSync: '2d ago', successRate: '-', color: 'bg-brand' },
        { id: 'glassdoor', name: 'Glassdoor', url: 'https://glassdoor.com', status: 'warning', lastSync: '1h ago', successRate: '42%', color: 'bg-emerald-600' },
    ],
    tasks: [
        { id: 'T1', taskType: 4, priority: 4, status: 'processing', description: 'Applying to Senior Software Engineer at Google', timeAdded: '2m ago' },
        { id: 'T2', taskType: 2, priority: 3, status: 'pending', description: 'Extracting technical requirements for Meta - Frontend Lead', timeAdded: '5m ago' },
        { id: 'T3', taskType: 1, priority: 2, status: 'pending', description: 'Scanning LinkedIn for Python Remote roles', timeAdded: '12m ago' },
        { id: 'T4', taskType: 0, priority: 1, status: 'waiting', description: 'Updating base profile with latest GitHub projects', timeAdded: '25m ago' },
    ],
    system: {
        status: 'ready',
        cpu: '12%',
        memory: '245 MB',
        version: 'REL_2.0.1'
    }
};

export const useAgentStore = create((set, get) => ({
    // Theme
    theme: 'dark',

    // UI State
    selectedTab: 'dashboard',
    isSidebarCollapsed: false,
    isTerminalOpen: true,
    showAllActivities: false,

    // Data State
    stats: mockData.stats,
    activities: mockData.activities,
    terminalLogs: mockData.terminalLogs,
    portals: mockData.portals,
    tasks: mockData.tasks,
    system: mockData.system,

    // Loading states
    isLoading: false,
    isConnected: !isPyWebView(), // True in dev mode, false until connected in pywebview

    // Actions
    setTheme: (theme) => {
        set({ theme });
        // Call Python API if available
        const api = getApi();
        if (api) {
            api.update_setting('theme', theme);
        }
    },

    setSelectedTab: (tab) => set({ selectedTab: tab }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
    setShowAllActivities: (show) => set({ showAllActivities: show }),

    // Connect portal
    connectPortal: async (portalId) => {
        const api = getApi();
        if (api) {
            await api.connect_portal(portalId);
        } else {
            // Mock: toggle connection
            set((state) => ({
                portals: state.portals.map(p =>
                    p.id === portalId
                        ? { ...p, status: p.status === 'connected' ? 'disconnected' : 'connected' }
                        : p
                )
            }));
        }
    },

    disconnectPortal: async (portalId) => {
        const api = getApi();
        if (api) {
            await api.disconnect_portal(portalId);
        }
        set((state) => ({
            portals: state.portals.map(p =>
                p.id === portalId
                    ? { ...p, status: 'disconnected', lastSync: 'Just now' }
                    : p
            )
        }));
    },

    // Update setting
    updateSetting: async (key, value) => {
        const api = getApi();
        if (api) {
            await api.update_setting(key, value);
        }
    },

    // Fetch updates from Python backend
    fetchUpdates: async () => {
        const api = getApi();
        if (api && typeof api.poll_updates === 'function') {
            try {
                // PyWebView methods return promises
                const updates = await api.poll_updates();
                if (updates) {
                    set({
                        stats: updates.stats || get().stats,
                        activities: updates.activities || get().activities,
                        terminalLogs: updates.terminal_logs || get().terminalLogs,
                        portals: updates.portals || get().portals,
                        tasks: updates.tasks || get().tasks,
                        system: updates.system || get().system,
                        isConnected: true
                    });
                }
            } catch (error) {
                console.error('Failed to fetch updates:', error);
            }
        }
    },


    // Initialize polling
    startPolling: () => {
        const fetchUpdates = get().fetchUpdates;

        // Initial fetch
        fetchUpdates();

        // Poll every 2 seconds
        const interval = setInterval(fetchUpdates, 2000);

        // Return cleanup function
        return () => clearInterval(interval);
    }
}));

// Export legacy hook for compatibility
export const useStore = useAgentStore;
