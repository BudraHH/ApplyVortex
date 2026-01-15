import { create } from 'zustand';
import { agentsAPI } from '@/services/api/agentsAPI';
import { AgentStatus } from '@/constants/constants';

export const useAgentStore = create((set, get) => ({
    agents: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    pollingInterval: null,

    // Fetch agents from API
    fetchAgents: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await agentsAPI.listAgents();
            set({
                agents: data || [],
                isLoading: false,
                lastFetched: new Date()
            });
        } catch (error) {
            console.error('Agent Store: Failed to fetch agents', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Silent update for polling (doesn't trigger global loading state)
    refreshAgents: async () => {
        try {
            const data = await agentsAPI.listAgents();
            set({
                agents: data || [],
                lastFetched: new Date()
            });
        } catch (error) {
            console.error('Agent Store: Silent refresh failed', error);
            // Don't set error state on silent refresh to avoid UI flickering
        }
    },

    // Start polling for agent status
    startPolling: (intervalMs = 30000) => {
        // Clear existing interval if any
        const currentInterval = get().pollingInterval;
        if (currentInterval) clearInterval(currentInterval);

        // Fetch immediately
        get().fetchAgents();

        // set up new interval
        const interval = setInterval(() => {
            get().refreshAgents();
        }, intervalMs);

        set({ pollingInterval: interval });
    },

    // Stop polling
    stopPolling: () => {
        const currentInterval = get().pollingInterval;
        if (currentInterval) {
            clearInterval(currentInterval);
            set({ pollingInterval: null });
        }
    },

    // Computed selectors (helpers)
    getOnlineCount: () => {
        const { agents } = get();
        return agents.filter(a => a.status === AgentStatus.ONLINE).length;
    },

    isAnyAgentOnline: () => {
        const { agents } = get();
        return agents.some(a => a.status === AgentStatus.ONLINE);
    }
}));
