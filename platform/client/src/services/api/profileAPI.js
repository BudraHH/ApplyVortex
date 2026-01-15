// src/services/api/profileAPI.js
import apiClient from '@/services/axios.config';

export const profileAPI = {
    // GET /user/me/profile
    getProfile: async () => {
        const res = await apiClient.get('/users/me/profile');
        return res || null;
    },

    // POST /user/me/profile
    updateProfile: async (profileData) => {
        const res = await apiClient.post('/users/me/profile', profileData);
        return res || null;
    },

    // GET /profile/complete
    getCompleteProfile: async () => {
        return await apiClient.get('/profile/complete');
    },
};

export default profileAPI;
