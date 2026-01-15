import apiClient from '@/services/axios.config';

export const jobsAPI = {
    getJobs: async (limit = 10, offset = 0) => {
        return await apiClient.get(`/jobs?limit=${limit}&offset=${offset}`);
    },
    getJob: async (jobId) => {
        return await apiClient.get(`/jobs/${jobId}`);
    },
    applyToJob: async (jobId, method = 'AUTO') => {
        return await apiClient.post(`/jobs/${jobId}/apply?method=${method}`);
    }
};

export default jobsAPI;
