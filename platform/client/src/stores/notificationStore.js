import { create } from 'zustand';
import { notificationsAPI } from '@/services/api/notificationsAPI';
import { API_BASE_URL, WS_BASE_URL } from '@/lib/constants';

export const useNotificationStore = create((set, get) => ({
    unreadCount: 0,
    isLoading: false,
    socket: null,
    lastNotification: null,

    fetchUnreadCount: async () => {
        set({ isLoading: true });
        try {
            const res = await notificationsAPI.getNotifications({ unread_only: true });
            console.log('📊 Unread notifications API response:', res);
            console.log('📊 First notification:', res[0]);
            console.log('📊 Is array?', Array.isArray(res));
            const count = Array.isArray(res) ? res.length : 0;
            console.log('📊 Calculated unread count:', count);
            set({ unreadCount: count, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
            set({ isLoading: false });
        }
    },

    setUnreadCount: (count) => set({ unreadCount: count }),

    decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

    clearUnreadCount: () => set({ unreadCount: 0 }),

    connect: () => {
        const { socket } = get();

        // If already connected or connecting, don't do anything
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const wsUrl = `${WS_BASE_URL}/notifications/ws`;

        // Only log in development
        if (import.meta.env.DEV) {
            console.log('🔌 Connecting to Notification WebSocket:', wsUrl);
        }

        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            if (import.meta.env.DEV) console.log('✅ Notification WebSocket Connected');

            // Start heartbeat
            const pingInterval = setInterval(() => {
                if (newSocket.readyState === WebSocket.OPEN) {
                    newSocket.send('ping');
                }
            }, 30000);

            newSocket._pingInterval = pingInterval;
        };

        newSocket.onmessage = (event) => {
            if (event.data === 'pong') return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'NEW_NOTIFICATION') {
                    set((state) => ({
                        unreadCount: state.unreadCount + 1,
                        lastNotification: msg.data
                    }));
                }
            } catch (e) {
                console.error('❌ WS Message Parse Error:', e);
            }
        };

        newSocket.onclose = (event) => {
            if (import.meta.env.DEV) console.log('🔌 Notification WebSocket Disconnected', event.code, event.reason);
            if (newSocket._pingInterval) clearInterval(newSocket._pingInterval);

            if (get().socket === newSocket) {
                set({ socket: null });

                // Optional: Reconnect on unexpected close (not 1000/1001/1005)
                if (event.code !== 1000 && event.code !== 1001 && event.code !== 1005) {
                    setTimeout(() => get().connect(), 5000);
                }
            }
        };

        newSocket.onerror = (error) => {
            // Only log actual errors, not the "closed during handshake" which is common in dev
            if (newSocket.readyState !== WebSocket.CLOSED) {
                console.error('⚠️ Notification WebSocket Error:', error);
            }
        };

        set({ socket: newSocket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            // To avoid "WebSocket is closed before the connection is established" in React 18 Strict Mode,
            // we check if it's still connecting. If it is, and we're just remounting, 
            // the new mount's connect() call will find this existing socket and use it.
            // If the socket is OPEN, we close it normally.

            if (socket.readyState === WebSocket.CONNECTING) {
                // In development, we can log this to help debugging
                // if (import.meta.env.DEV) console.log('⏳ Preserving CONNECTING socket during re-mount');
                return;
            }

            if (socket._pingInterval) clearInterval(socket._pingInterval);

            if (socket.readyState === WebSocket.OPEN) {
                socket.close(1000, "Normal Closure");
            }

            set({ socket: null });
        }
    }
}));
