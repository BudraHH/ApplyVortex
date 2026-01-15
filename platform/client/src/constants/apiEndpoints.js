// src/constants/apiEndpoints.js

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
        RESTORE: '/auth/restore',
        ME: '/user/me',
    },

    // Profile
    PROFILE: {
        GET: '/profile',
        UPDATE: '/profile',
        UPLOAD_RESUME: '/profile/resume',
        DELETE_RESUME: '/profile/resume',
    },

    // Experience
    EXPERIENCE: {
        LIST: '/profile/experience',
        CREATE: '/profile/experience',
        UPDATE: (id) => `/profile/experience/${id}`,
        DELETE: (id) => `/profile/experience/${id}`,
    },

    // Skills
    SKILLS: {
        LIST: '/profile/skills',
        UPDATE: '/profile/skills',
    },

    // Education
    EDUCATION: {
        LIST: '/profile/education',
        CREATE: '/profile/education',
        UPDATE: (id) => `/profile/education/${id}`,
        DELETE: (id) => `/profile/education/${id}`,
    },

    // Jobs
    JOBS: {
        LIST: '/jobs',
        DETAILS: (id) => `/jobs/${id}`,
        RECOMMENDED: '/jobs/recommended',
        SAVED: '/jobs/draft',
        SAVE: (id) => `/jobs/${id}/save`,
        UNSAVE: (id) => `/jobs/${id}/unsave`,
    },

    // Applications
    APPLICATIONS: {
        LIST: '/applications',
        CREATE: '/applications',
        DETAILS: (id) => `/applications/${id}`,
        UPDATE_STATUS: (id) => `/applications/${id}/status`,
        DELETE: (id) => `/applications/${id}`,
        ANALYTICS: '/applications/analytics',
        BULK_APPLY: '/applications/bulk',
    },

    // Notifications
    NOTIFICATIONS: {
        LIST: '/notifications',
        MARK_READ: (id) => `/notifications/${id}/read`,
        MARK_ALL_READ: '/notifications/read-all',
        DELETE: (id) => `/notifications/${id}`,
    },

    // Settings
    SETTINGS: {
        GET: '/settings',
        UPDATE: '/settings',
        CHANGE_PASSWORD: '/settings/password',
    },
};
