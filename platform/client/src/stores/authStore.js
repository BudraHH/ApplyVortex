import { create } from 'zustand';
import { authAPI } from '@/services/api/auth.api';
import { userAPI } from '@/services/api/userAPI';

export const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    dateFormat: localStorage.getItem('applyvortex-date-format') || 'YYYY-MM-DD',
    isSidebarCollapsed: localStorage.getItem('applyvortex-sidebar-collapsed') === 'true',

    toggleSidebar: () => {
        const newState = !get().isSidebarCollapsed;
        localStorage.setItem('applyvortex-sidebar-collapsed', newState);
        set({ isSidebarCollapsed: newState });
    },

    // Check if onboarding is NOT completed
    shouldShowWelcome: () => {
        const user = get().user;
        return !user?.onboardingCompleted;
    },

    login: (user) => {
        // Tokens are in HttpOnly cookies (set by backend)
        // No need to store them in frontend
        localStorage.setItem('logged_in', 'true');
        set({
            user,
            isAuthenticated: true,
            isLoading: false
        });
    },

    logout: async () => {
        try {
            // Disconnect notifications
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().disconnect();

            await authAPI.logout();
        } catch (e) {
            console.error(e);
        }

        // Backend clears HttpOnly cookies
        localStorage.removeItem('logged_in');
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false
        });
    },

    updateUser: (userData) => {
        set((state) => ({
            user: { ...state.user, ...userData },
        }));
    },

    setDateFormat: (format) => {
        localStorage.setItem('applyvortex-date-format', format);
        set({ dateFormat: format });
    },

    fetchUser: async () => {
        try {
            const user = await userAPI.getProfile();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    initAuth: async () => {
        const hasLoginInfo = localStorage.getItem('logged_in') === 'true';

        if (hasLoginInfo) {
            try {
                const user = await userAPI.getProfile();
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });
            } catch (error) {
                console.error("Init auth failed:", error);
                // If fetch fails (401), clear the flag
                localStorage.removeItem('logged_in');
                set({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null
                });
            }
        } else {
            set({
                isAuthenticated: false,
                isLoading: false,
                user: null
            });
        }
    },
}));