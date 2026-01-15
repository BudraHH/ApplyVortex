import apiClient from '@/services/axios.config';

export const researchAPI = {
    /**
     * Get all research publications for the current user
     * @returns {Promise<{research: Array, total_count: number}>}
     */
    getResearch: async () => {
        const response = await apiClient.get('/profile/research');
        return response.data;
    },

    /**
     * Save/replace all research publications for the current user
     * @param {Object} data - { research: Array }
     * @returns {Promise<{research: Array, total_count: number}>}
     */
    saveResearch: async (data) => {
        const response = await apiClient.post('/profile/research', data);
        return response.data;
    },
};
