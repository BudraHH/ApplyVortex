// src/services/api/accomplishmentsAPI.js
import apiClient from '@/services/axios.config';

export const accomplishmentsAPI = {
    /**
     * Get all accomplishments
     * GET /profile/accomplishments
     * @returns {Promise} Accomplishments data
     */
    getAccomplishments: async () => {
        const res = await apiClient.get('/profile/accomplishments');
        return res;
    },

    /**
     * Save ALL accomplishments (bulk replace)
     * POST /profile/accomplishments
     * @param {Object} payload - Complete list from form
     * @returns {Promise} Saved accomplishments
     */
    saveAccomplishments: async (payload) => {
        const res = await apiClient.post('/profile/accomplishments', payload);
        return res;
    },
};
