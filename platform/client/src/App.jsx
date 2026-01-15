// src/App.jsx
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import Router from '@/routes/Router';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/features/layout/ThemeProvider';
import BreakpointLogger from '@/components/shared/BreakpointLogger';

// Create React Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    const initAuth = useAuthStore((state) => state.initAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [authChecked, setAuthChecked] = useState(false);

    // Initialize auth on mount
    useEffect(() => {
        const initialize = async () => {
            await initAuth();
            setAuthChecked(true);
        };
        initialize();
    }, [initAuth]);


    return (
        <ThemeProvider defaultTheme="light" storageKey="applyvortex-theme">
            <QueryClientProvider client={queryClient}>
                {/* Pass auth info if needed via context or props */}
                <Router isAuthenticated={isAuthenticated} />
                <Toaster />
                <BreakpointLogger />
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
