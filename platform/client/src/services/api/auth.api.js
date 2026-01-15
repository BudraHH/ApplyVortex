// src/services/api/auth.api.js
import axiosInstance from '../axios.config';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const authAPI = {

    // POST /auth/login
    login: (credentials) => {
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);
        formData.append('remember_me', credentials.rememberMe); // Send flag
        return axiosInstance.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    },

    // POST /auth/register
    signup: (userData) =>
        axiosInstance.post('/auth/register', userData),

    // POST /auth/logout
    logout: () =>
        axiosInstance.post('/auth/logout'),

    // POST /auth/restore
    restore: (credentials) => {
        return axiosInstance.post('/auth/restore', {
            email: credentials.email,
            password: credentials.password,
        });
    },

    // POST /auth/refresh (uses HttpOnly cookie)
    refreshToken: () =>
        axiosInstance.post('/auth/refresh', {}, { withCredentials: true }),
};
