/**
 * Agent API Keys API Service
 */
import apiClient from '../axios.config';

export const agentKeysAPI = {
    /**
     * Generate a new API key for agent authentication
     */
    generateKey: async (name) => {
        return await apiClient.post('/agent-keys/', { name });
    },

    /**
     * List all API keys for the current user
     */
    listKeys: async () => {
        return await apiClient.get('/agent-keys/');
    },

    /**
     * Revoke (delete) an API key
     */
    revokeKey: async (keyId) => {
        await apiClient.delete(`/agent-keys/${keyId}`);
    }
};

export default agentKeysAPI;
