// src/services/api/languagesAPI.js
import apiClient from '@/services/axios.config';

export const languagesAPI = {
    /**
     * Get all languages
     * GET /profile/languages
     * @returns {Promise} Languages data
     */
    getLanguages: async () => {
        return await apiClient.get('/profile/languages');
    },

    /**
     * Save ALL languages (bulk replace)
     * POST /profile/languages
     * Backend: DELETE ALL → INSERT NEW (atomic transaction)
     * @param {Object} payload - Complete list from form
     * @returns {Promise} Saved languages
     */
    saveLanguages: async (payload) => {
        return await apiClient.post('/profile/languages', payload);
    },
};
