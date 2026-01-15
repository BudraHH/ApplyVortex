// src/services/api/userAPI.js

import apiClient from "../axios.config";

export const userAPI = {
    // GET /user/me
    getProfile: async () => {
        const res = await apiClient.get('/users/me');
        return res || null;
    },

    // PATCH /user/me
    updateProfile: async (userData) => {
        const res = await apiClient.patch('/users/me', userData);
        return res || null;
    },

    // GET /user/me/profile
    getUserProfileInfo: async () => {
        const res = await apiClient.get('/users/me/profile');
        return res || null;
    },

    // POST /user/me/profile
    updateUserProfileInfo: async (profileData) => {
        const res = await apiClient.post('/users/me/profile', profileData);
        return res || null;
    },

    // GET /user/me/completeness
    getProfileCompleteness: async () => {
        const res = await apiClient.get('/users/me/completeness');
        return res || null;
    },

    // GET /user/me/account-settings
    getAccountSettings: async () => {
        const res = await apiClient.get('/users/me/account-settings');
        return res || null;
    },

    // PATCH /user/me/account-settings
    updateAccountSettings: async (settingsData) => {
        const res = await apiClient.patch('/users/me/account-settings', settingsData);
        return res || null;
    },

    // POST /user/me/password
    updatePassword: async (passwordData) => {
        const res = await apiClient.post('/users/me/password', passwordData);
        return res || null;
    },

    // GET /user/me/sessions
    getUserSessions: async () => {
        const res = await apiClient.get('/users/me/sessions');
        return res || null;
    },

    // DELETE /user/me/sessions/{session_id}
    revokeSession: async (sessionId) => {
        const res = await apiClient.delete(`/users/me/sessions/${sessionId}`);
        return res || null;
    },

    // POST /user/me/sessions/revoke-all-others
    revokeAllOtherSessions: async () => {
        const res = await apiClient.post('/users/me/sessions/revoke-all-others');
        return res || null;
    },

    // GET /user/all-user (Admin only)
    getAllUsers: async (params = {}) => {
        const res = await apiClient.get('/users/all-users', { params });
        return res || [];
    },

    // GET /user/{id} (Admin only)
    getUserById: async (userId) => {
        const res = await apiClient.get(`/users/${userId}`);
        return res || null;
    },

    // POST /user (Admin only)
    createUser: async (userData) => {
        const res = await apiClient.post('/users', userData);
        return res || null;
    },

    // GET /user/{id}/stats (Admin only)
    getUserStats: async (userId) => {
        const res = await apiClient.get(`/users/${userId}/stats`);
        return res || null;
    },

    // POST /user/{id}/notes (Admin only)
    updateUserNotes: async (userId, notes) => {
        const res = await apiClient.post(`/users/${userId}/notes`, { notes });
        return res || null;
    },

    // POST /user/{id}/impersonate (Admin only)
    impersonateUser: async (userId) => {
        const res = await apiClient.post(`/users/${userId}/impersonate`);
        return res || null;
    },

    // PATCH /user/{id}/status (Admin only)
    updateUserStatus: async (userId, accountStatus) => {
        const res = await apiClient.patch(`/users/${userId}/status`, { account_status: accountStatus });
        return res || null;
    },

    // GET /user/{id}/logs (Admin only)
    getUserLogs: async (userId, params = {}) => {
        const res = await apiClient.get(`/users/${userId}/logs`, { params });
        return res || [];
    },

    // DELETE /users/account
    deleteAccount: async () => {
        const res = await apiClient.delete('/users/account');
        return res || null;
    },

    // POST /users/account/restore
    restoreAccount: async () => {
        const res = await apiClient.post('/users/account/restore');
        return res || null;
    },
};
