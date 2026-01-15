import apiClient from '@/services/axios.config';

export const targetingAPI = {
    /**
     * Get all targeting profiles for the current user
     */
    getTargetingProfiles: async () => {
        return await apiClient.get('/targeting');
    },

    /**
     * Get the active targeting profile
     */
    getActiveProfile: async () => {
        return await apiClient.get('/targeting/active');
    },

    /**
     * Create a new targeting profile
     */
    createProfile: async (profileData) => {
        return await apiClient.post('/targeting', profileData);
    },

    /**
     * Update an existing targeting profile
     */
    updateProfile: async (profileId, profileData) => {
        return await apiClient.put(`/targeting/${profileId}`, profileData);
    },

    /**
     * Delete a targeting profile
     */
    deleteProfile: async (profileId) => {
        return await apiClient.delete(`/targeting/${profileId}`);
    },

    /**
     * Get relocation context (willingness and current location)
     */
    getRelocationContext: async () => {
        return await apiClient.get('/targeting/relocation-context');
    }
};

export default targetingAPI;
