// src/services/tokenManager.js
// In-memory token storage (XSS-safe, cleared on page refresh)

class TokenManager {
    constructor() {
        this.accessToken = null;
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    getAccessToken() {
        return this.accessToken;
    }

    clearAccessToken() {
        this.accessToken = null;
    }

    hasAccessToken() {
        return !!this.accessToken;
    }
}

// Singleton instance
export const tokenManager = new TokenManager();
