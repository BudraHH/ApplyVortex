import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/constants';

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: API_BASE_URL, // http://localhost:8000/api/v1
    timeout: API_TIMEOUT,   // 30000ms
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
    withCredentials: true, // Send HttpOnly cookies automatically
});

// Request Interceptor - No need to add Authorization header, cookies handle it
axiosInstance.interceptors.request.use(
    (config) => {
        // Cookies are sent automatically by browser
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Token expired
        // Try to refresh using HttpOnly cookie
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') && // Prevent infinite loop
            !originalRequest.url?.includes('/auth/login')      // Prevent login failure from triggering refresh logic
        ) {
            originalRequest._retry = true;

            try {
                // Refresh tokens using HttpOnly cookie
                // Backend updates cookies automatically
                await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Retry original request with updated cookies
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed - redirect to login
                if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                    window.location.href = '/';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        if (error.response?.status === 403) {
            window.location.href = '/unauthorized';
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
