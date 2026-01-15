import axiosInstance from '../axios.config';

export const adminAPI = {
    /**
     * Get aggregated dashboard statistics (Admin only)
     */
    getStats: async () => {
        const response = await axiosInstance.get('/admin/stats');
        return response; // response is already data due to response interceptor
    },

    /**
     * Get paginated audit logs
     */
    getAuditLogs: async (params = {}) => {
        const response = await axiosInstance.get('/admin/audit-logs', { params });
        return response || [];
    }
};
