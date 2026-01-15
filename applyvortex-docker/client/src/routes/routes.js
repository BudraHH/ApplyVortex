// src/routes/routes.js
export const ROUTES = {
    // Public
    HOME: '/',
    ABOUT: '/about',

    // Auth
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',

    // Protected (nested under /app)
    WELCOME: '/welcome/instructions',
    AGENT_INTRO: '/welcome/agent-intro',
    DASHBOARD: '/dashboard',
    PROFILE_SETUP: {
        BASE: '/profile-setup',

        // absolute paths (for Link/navigate)
        RESUME: '/profile-setup/resume-upload',
        PERSONAL: '/profile-setup/personal',
        EDUCATION: '/profile-setup/education',
        PROJECTS: '/profile-setup/projects',
        RESEARCH: '/profile-setup/research',
        SKILLS: '/profile-setup/skills',
        EXPERIENCE: '/profile-setup/experience',
        CERTIFICATIONS: '/profile-setup/certifications',
        ACCOMPLISHMENTS: '/profile-setup/accomplishments',

        // relative segments (for nested Route path="")
        SEGMENTS: {
            RESUME: 'resume-upload',
            PERSONAL: 'personal',
            EDUCATION: 'education',
            PROJECTS: 'projects',
            RESEARCH: 'research',
            SKILLS: 'skills',
            EXPERIENCE: 'experience',
            CERTIFICATIONS: 'certifications',
            ACCOMPLISHMENTS: 'accomplishments',
        },
    },
    APPLICATIONS: '/applications',
    OPTIMIZATION: '/optimization',
    JOBS: '/jobs',
    JOB_DETAIL: '/jobs/:jobId',
    APPLY: '/apply',
    NOTIFICATIONS: '/notifications',
    SETTINGS: {
        BASE: '/settings',
        ACCOUNT: '/settings',
        SECURITY: '/settings',
        NOTIFICATIONS: '/settings',
    },
    HELP: '/help',
    MY_AGENTS: '/agent',
    DOWNLOAD_AGENT: '/agent/download',
    AGENT_INSTRUCTIONS: '/agent/download/:os',
    AGENT_PAIR: '/agent/pair',

    // Errors
    UNAUTHORIZED: '/unauthorized',
    ERROR: '/error',
    NOT_FOUND: '/not-found',
};
