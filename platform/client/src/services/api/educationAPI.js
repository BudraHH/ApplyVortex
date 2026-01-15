// src/services/api/educationAPI.js
import apiClient from '@/services/axios.config';

export const educationAPI = {
    /**
     * Get all education entries
     * GET /profile/educations
     * @returns {Promise} Education data
     */
    getEducation: async () => {
        const res = await apiClient.get('/profile/educations');
        return res;
    },

    /**
     * Save ALL education entries (bulk replace)
     * POST /profile/educations
     * Backend: DELETE ALL → INSERT NEW (atomic transaction)
     * @param {Object} payload - Complete list from form
     * @returns {Promise} Saved education entries
     */
    saveEducation: async (payload) => {
        return await apiClient.post('/profile/educations', payload);
    },
};
