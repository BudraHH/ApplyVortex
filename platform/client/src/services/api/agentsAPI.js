/**
 * Agents API Service
 */
import apiClient from '../axios.config';

export const agentsAPI = {
    /**
     * List all registered agents for the current user
     */
    listAgents: async () => {
        return await apiClient.get('/agents/');
    },

    /**
     * Get details of a specific agent
     */
    getAgent: async (agentId) => {
        return await apiClient.get(`/agents/${agentId}`);
    },
};

export default agentsAPI;
