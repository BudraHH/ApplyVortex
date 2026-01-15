import apiClient from '@/services/axios.config';

export const projectsAPI = {
    // GET /profile/projects
    getProjects: async () => {
        return await apiClient.get('/profile/projects');
    },

    // POST /profile/projects
    saveProjects: async (payload) => {
        return await apiClient.post('/profile/projects', payload);
    },
};
