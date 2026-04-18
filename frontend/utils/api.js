// Central API Configuration for easy Environment Switching
const isProd = process.env.NODE_ENV === 'production';

// Use environment variable for production, fallback to production Render URL if on a live domain, otherwise localhost
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return 'https://beacon-e8uk.onrender.com';
    }
    return 'http://localhost:5001';
};

export const API_BASE_URL = getBaseUrl();

// Clean helper to construct API endpoints
export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// Socket URL usually matches API URL
export const SOCKET_URL = API_BASE_URL;
