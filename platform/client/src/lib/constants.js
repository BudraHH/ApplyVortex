// src/lib/constants.js

// API Configuration
let BASE_URL = import.meta.env.VITE_API_URL;
// Force HTTPS for Hugging Face Spaces to avoid Mixed Content errors
if (BASE_URL && BASE_URL.includes('hf.space') && BASE_URL.startsWith('http:')) {
    BASE_URL = BASE_URL.replace('http:', 'https:');
}

export const API_BASE_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL.replace(/\/$/, '')}/api/v1`;
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Application
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ApplyVortex';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

// Authentication
export const JWT_TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token';
export const JWT_REFRESH_TOKEN_KEY = import.meta.env.VITE_JWT_REFRESH_TOKEN_KEY || 'refresh_token';

// Feature Flags
export const ENABLE_MOCK_API = import.meta.env.VITE_ENABLE_MOCK_API === 'true';
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_DEBUG_MODE = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';

// File Upload
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880; // 5MB
export const ALLOWED_FILE_TYPES = import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['.pdf', '.doc', '.docx'];

// Pagination
export const DEFAULT_PAGE_SIZE = parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20;
export const MAX_PAGE_SIZE = parseInt(import.meta.env.VITE_MAX_PAGE_SIZE) || 100;

// Job Portals
export const SUPPORTED_PORTALS = import.meta.env.VITE_SUPPORTED_PORTALS?.split(',') || ['LinkedIn', 'Naukri', 'Indeed'];

// External Links
export const EXTERNAL_LINKS = {
    linkedin: import.meta.env.VITE_LINKEDIN_URL || 'https://linkedin.com',
    naukri: import.meta.env.VITE_NAUKRI_URL || 'https://naukri.com',
    indeed: import.meta.env.VITE_INDEED_URL || 'https://indeed.co.in',
};

// Application Status
export const APPLICATION_STATUS = {
    SUBMITTED: 'submitted',
    SHORTLISTED: 'shortlisted',
    INTERVIEW: 'interview',
    REJECTED: 'rejected',
    OFFER: 'offer',
};

// Application Status Labels
export const APPLICATION_STATUS_LABELS = {
    [APPLICATION_STATUS.SUBMITTED]: 'Submitted',
    [APPLICATION_STATUS.SHORTLISTED]: 'Shortlisted',
    [APPLICATION_STATUS.INTERVIEW]: 'Interview',
    [APPLICATION_STATUS.REJECTED]: 'Rejected',
    [APPLICATION_STATUS.OFFER]: 'Offer',
};

// Locations
export const MAJOR_CITIES = [
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Gurgaon',
    'Noida',
    'Kochi',
    'Trivandrum',
    'Jaipur',
    'Chandigarh',
    'Indore',
    'Remote'
].sort();

export const APPLICATION_STATUS_COLORS = {
    [APPLICATION_STATUS.SUBMITTED]: 'bg-blue-500',
    [APPLICATION_STATUS.SHORTLISTED]: 'bg-yellow-500',
    [APPLICATION_STATUS.INTERVIEW]: 'bg-purple-500',
    [APPLICATION_STATUS.REJECTED]: 'bg-red-500',
    [APPLICATION_STATUS.OFFER]: 'bg-green-500',
};
