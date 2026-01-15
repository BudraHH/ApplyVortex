import apiClient from '@/services/axios.config';

export const skillsAPI = {
    // GET /skills/search
    searchSkills: async (query = "", limit = 1000) => {
        const res = await apiClient.get('/skills/search', { params: { query, limit } });
        return res || null;
    },

    // GET /skills/popular
    getPopularSkills: async (category = null, limit = 20) => {
        return await apiClient.get('/skills/popular', { params: { category, limit } });
    },

    // GET /skills/profile/skills
    getUserSkills: async () => {
        const res = await apiClient.get('/skills/profile/skills');
        return res || null;
    },

    // POST /skills/profile/skills
    replaceUserSkills: async (payload) => {
        return await apiClient.post('/skills/profile/skills', payload);
    },

    // GET /skills/profile/skills/primary
    getPrimarySkills: async () => {
        return await apiClient.get('/skills/profile/skills/primary');
    },

    // POST /skills/profile/skills/add
    addUserSkill: async (skillData) => {
        return await apiClient.post('/skills/profile/skills/add', skillData);
    },
};
