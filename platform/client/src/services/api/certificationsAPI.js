// src/services/api/certificationsAPI.js
import apiClient from '@/services/axios.config';

export const certificationsAPI = {
    /**
     * Get all certifications
     * GET /profile/certifications
     * @returns {Promise} Certifications data
     */
    getCertifications: async () => {
        const res = await apiClient.get('/profile/certifications');
        return res;
    },

    /**
     * Save ALL certifications (bulk replace)
     * POST /profile/certifications
     * Backend: DELETE ALL → INSERT NEW (atomic transaction)
     * @param {Object} payload - Complete list from form
     * @returns {Promise} Saved certifications
     */
    saveCertifications: async (payload) => {
        const res = await apiClient.post('/profile/certifications', payload);
        return res;
    },
};
