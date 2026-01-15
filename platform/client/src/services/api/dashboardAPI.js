// src/services/api/dashboardAPI.js
import axiosInstance from '../axios.config';

const API_BASE = '/dashboard';

export const dashboardAPI = {
    // GET /dashboard/overview
    getOverview: () => axiosInstance.get(`${API_BASE}/overview`),

    // GET /dashboard/analytics
    getAnalytics: () => axiosInstance.get(`${API_BASE}/analytics`),

    // GET /intelligence/optimization
    getOptimization: () => axiosInstance.get('/intelligence/optimization'),
};
