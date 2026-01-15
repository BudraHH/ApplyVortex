// src/services/api/applicationsAPI.js

import axiosInstance from '../axios.config';

export const applicationsAPI = {
    /**
     * Get all applications for the current user
     * @param {Object} params - Query parameters
     * @param {string} params.status - Filter by status (optional)
     * @param {number} params.limit - Limit results (optional)
     * @param {number} params.offset - Offset for pagination (optional)
     * @returns {Promise<Array>} List of applications
     */
    getUserApplications: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);
        if (params.limit) queryParams.append("limit", params.limit);
        if (params.offset) queryParams.append("offset", params.offset);

        const queryString = queryParams.toString();
        const url = `/applications${queryString ? `?${queryString}` : ""}`;

        return await axiosInstance.get(url);
    },

    /**
     * Get a single application by ID
     * @param {string} applicationId - Application ID
     * @returns {Promise<Object>} Application details
     */
    getApplication: async (applicationId) => {
        return await axiosInstance.get(`/applications/${applicationId}`);
    },

    /**
     * Create a new application
     * @param {Object} applicationData - Application data
     * @returns {Promise<Object>} Created application
     */
    createApplication: async (applicationData) => {
        return await axiosInstance.post("/applications", applicationData);
    },

    /**
     * Update an application
     * @param {string} applicationId - Application ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated application
     */
    updateApplication: async (applicationId, updateData) => {
        return await axiosInstance.put(`/applications/${applicationId}`, updateData);
    },

    /**
     * Update application status
     * @param {string} applicationId - Application ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated application
     */
    updateApplicationStatus: async (applicationId, status) => {
        return await axiosInstance.patch(`/applications/${applicationId}/status`, { status });
    },

    /**
     * Delete an application
     * @param {string} applicationId - Application ID
     * @returns {Promise<void>}
     */
    deleteApplication: async (applicationId) => {
        await axiosInstance.delete(`/applications/${applicationId}`);
    },

    /**
     * Get application statistics
     * @returns {Promise<Object>} Application stats
     */
    getApplicationStats: async () => {
        return await axiosInstance.get("/applications/stats");
    },

    /**
     * Trigger bulk autonomous application
     * POST /applications/auto-apply
     * @param {Array<string>} jobIds
     * @param {string} baseResumeId
     */
    bulkAutoApply: async (jobIds, baseResumeId) => {
        return await axiosInstance.post("/applications/auto-apply", {
            job_ids: jobIds,
            base_resume_id: baseResumeId,
            auto_tailor: true
        });
    },
};
