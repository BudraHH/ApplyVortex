import apiClient from '@/services/axios.config';

export const experienceAPI = {
    // GET /profile/experiences
    getExperiences: async () => {
        const res = await apiClient.get('/profile/experiences');
        return res || null;
    },

    // POST /profile/experiences
    saveExperiences: async (payload) => {
        const response = await apiClient.post('/profile/experiences', payload);
        return response || null;
    },
};
