import { useState, useEffect, useRef, useCallback } from "react";
import {
    Bell,
    CheckCheck,
    Trash2,
    MoreVertical,
    Briefcase,
    Clock,
    Settings,
    Zap,
    RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";
import { formatDistanceToNow } from "date-fns";
import { notificationsAPI } from "@/services/api/notificationsAPI.js";
import { useNotificationStore } from "@/stores/notificationStore.js";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NotificationType } from "@/constants/constants";
import { cn } from "@/lib/utils";

/* ======================================================
   NOTIFICATION HELPERS
====================================================== */


const NotificationLabels = {
    [NotificationType.APPLICATION]: "Application",
    [NotificationType.JOB_ALERT]: "Job alert",
    [NotificationType.REMINDER]: "Reminder",
    [NotificationType.SYSTEM]: "System",
    [NotificationType.ANNOUNCEMENT]: "Announcement",
};

const getNotificationIcon = (type) => {
    const defaultStyle = { color: "text-slate-500", bg: "bg-slate-50" };

    const iconMap = {
        [NotificationType.APPLICATION]: { icon: Briefcase, color: "text-brand-600", bg: "bg-brand-50" },
        [NotificationType.JOB_ALERT]: { icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
        [NotificationType.REMINDER]: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        [NotificationType.SYSTEM]: { icon: Settings, color: "text-slate-600", bg: "bg-slate-100" },
        [NotificationType.ANNOUNCEMENT]: { icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
    };

    if (typeof type === "string") {
        const key = type.toUpperCase();
        if (NotificationType[key]) {
            return iconMap[NotificationType[key]];
        }
    }

    return iconMap[type] || defaultStyle;
};

/* ======================================================
   NOTIFICATION CARD
====================================================== */
function NotificationCard({ notification, onMarkAsRead, onDelete, onClick, onVisible }) {
    const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const cardRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Intersection Observer to track if the notification is seen
    useEffect(() => {
        if (notification.read || !onVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible(notification.id);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 } // Must be 50% visible to count as "seen"
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [notification.id, notification.read, onVisible]);

    const label =
        NotificationLabels[notification.type] ||
        (typeof notification.type === "string"
            ? notification.type.replace("_", " ")
            : "System");

    return (
        <div
            ref={cardRef}
            onClick={() => onClick(notification)}
            className={`group relative flex items-start rounded-xl border cursor-pointer transition-colors duration-200 focus-within:ring-1 focus-within:ring-slate-400 overflow-y-auto max-h-full custom-scrollbar ${!notification.read ? "border-brand-200 bg-brand-50/20" : "border-slate-100 bg-white hover:border-brand-200 transition-all"} gap-3 p-3 lg:gap-4 lg:p-4`}
        >
            {!notification.read && (
                <span className="absolute right-3 top-3 lg:right-4 lg:top-4 h-2 w-2 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50" />
            )}

            <div
                className={`
          flex h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0 items-center justify-center rounded-lg
          ${bg}
        `}
            >
                <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${color}`} />
            </div>

            <div className="flex w-full items-start justify-between gap-2 lg:gap-4">
                <div className="flex-1 space-y-0.5 lg:space-y-1">
                    <h4
                        className={`
              text-sm font-semibold leading-snug line-clamp-1
              ${!notification.read
                                ? "text-slate-900 "
                                : "text-slate-700 "
                            }
            `}
                    >
                        {notification.title}
                    </h4>

                    <p
                        className={`
              text-xs lg:text-sm leading-relaxed line-clamp-2
              ${!notification.read
                                ? "text-slate-600 "
                                : "text-slate-500 "
                            }
            `}
                    >
                        {notification.message}
                    </p>
                </div>

                <div ref={menuRef} className="relative flex self-start lg:self-center pt-1 lg:pt-0">
                    <div className="flex flex-col-reverse lg:flex-row items-end lg:items-center text-[10px] lg:text-[11px] text-slate-400 gap-1 lg:gap-3">
                        <Badge variant="secondary" className="py-0 text-[9px] lg:text-[10px] uppercase font-bold tracking-wider rounded-md px-1 lg:px-2">
                            {label}
                        </Badge>
                        <span className="hidden lg:inline text-slate-300 ">•</span>
                        <span className="text-[10px] lg:text-[11px] whitespace-nowrap">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                        }}
                        className="
              flex h-8 w-8 items-center justify-center rounded-md
              text-slate-400 hover:bg-slate-100 hover:text-slate-700
                
              opacity-0 group-hover:opacity-100 transition-opacity
            "
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 z-20 w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg mt-2"
                        >
                            {!notification.read && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsRead(notification.id);
                                        setMenuOpen(false);
                                    }}
                                    className="flex w-full items-center text-sm text-slate-700 hover:bg-slate-50 gap-2 px-4 py-2"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    Mark as read
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(notification.id);
                                    setMenuOpen(false);
                                }}
                                className="flex w-full items-center text-sm text-red-600 hover:bg-slate-50 gap-2 px-4 py-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ======================================================
   MAIN PAGE
====================================================== */
export default function NotificationsPage() {
    const { toast } = useToast();
    const { fetchUnreadCount, decrementUnreadCount, setUnreadCount } = useNotificationStore();

    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Track notifications that are being "viewed"
    const pendingReadSet = useRef(new Set());

    const syncPendingReads = async () => {
        if (pendingReadSet.current.size === 0) return;

        const idsToSync = Array.from(pendingReadSet.current);
        pendingReadSet.current.clear(); // Clear immediately to avoid redundant calls

        try {
            await notificationsAPI.bulkMarkAsRead(idsToSync);
            fetchUnreadCount();
        } catch (error) {
            console.error("Failed to sync pending notifications:", error);
        }
    };

    // Synchronous version for cleanup (uses fetch with keepalive)
    const syncPendingReadsSync = () => {
        if (pendingReadSet.current.size === 0) {
            console.log('🔄 syncPendingReadsSync: No pending reads to sync');
            return;
        }

        const idsToSync = Array.from(pendingReadSet.current);
        console.log('🔄 syncPendingReadsSync: Syncing IDs:', idsToSync);
        pendingReadSet.current.clear();

        // Use fetch with keepalive flag to ensure request completes even during page unload
        const url = `${API_BASE_URL}/notifications/bulk-read`;
        console.log('🔄 syncPendingReadsSync: Sending request to:', url);

        fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            keepalive: true, // Keep request alive during page transition
            body: JSON.stringify(idsToSync)
        })
            .then(response => {
                console.log('🔄 syncPendingReadsSync: Response status:', response.status);
                return response.json();
            })
            .then((data) => {
                console.log('🔄 syncPendingReadsSync: Success! Updated count:', data);
                // Schedule a delayed refresh of the global unread count
                // This ensures the sidebar icon updates after navigation
                setTimeout(() => {
                    fetchUnreadCount();
                }, 500);
            })
            .catch(err => console.error("🔄 syncPendingReadsSync: Error:", err));
    };

    const fetchNotifications = useCallback(async (showSkeleton = true) => {
        if (showSkeleton) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await notificationsAPI.getNotifications({ limit: 20 });
            setNotifications(
                res.map((n) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    read: n.is_read,
                    timestamp: new Date(n.created_at),
                    actionUrl: n.action_url,
                })).sort((a, b) => b.timestamp - a.timestamp)
            );
        } catch {
            toast({
                title: "Error",
                description: "Failed to load notifications",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchNotifications(true);
    }, [fetchNotifications]);

    // Cleanup logic: Synchronize pending reads when leaving the page 
    // or when the tab is closed/hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                syncPendingReadsSync();
            }
        };

        window.addEventListener('beforeunload', syncPendingReadsSync);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            syncPendingReadsSync(); // Use sync version in cleanup
            window.removeEventListener('beforeunload', syncPendingReadsSync);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleVisible = (id) => {
        console.log('👁️ Notification became visible, queueing for mark as read:', id);
        pendingReadSet.current.add(id);
        console.log('👁️ Current pending set size:', pendingReadSet.current.size);
        // Visual indicator: Mark as read in local state immediately for UX
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        // Optimistically update global store
        decrementUnreadCount();
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const filtered = notifications.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return !n.read;
        if (typeof filter === 'number') return n.type === filter;
        const filterKey = filter.toUpperCase();
        if (NotificationType[filterKey]) return n.type === NotificationType[filterKey];
        return n.type === filter;
    });

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
            pendingReadSet.current.delete(id); // Remove from pending if explicitly marked
            decrementUnreadCount(); // Optimistic update
            fetchUnreadCount();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            // Check if item was unread before deleting
            const item = notifications.find(n => n.id === id);
            const wasUnread = item && !item.read;

            await notificationsAPI.deleteNotification(id);
            setNotifications((p) => p.filter((n) => n.id !== id));
            pendingReadSet.current.delete(id);

            if (wasUnread) decrementUnreadCount();
            fetchUnreadCount();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications((p) => p.map((n) => ({ ...n, read: true })));
            pendingReadSet.current.clear();
            setUnreadCount(0); // Optimistic clear
            fetchUnreadCount();
            toast({ title: "All caught up!", description: "All notifications marked as read." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Clear all notifications? This cannot be undone.")) return;
        try {
            await notificationsAPI.deleteAll();
            setNotifications([]);
            pendingReadSet.current.clear();
            setUnreadCount(0); // Optimistic clear
            fetchUnreadCount();
            toast({ title: "Clean slate!", description: "All notifications cleared." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
        }
    };

    const handleClick = (n) => {
        if (!n.read) handleMarkAsRead(n.id);
    };

    const tabs = [
        { id: "all", label: "All", count: notifications.length },
        { id: "unread", label: "Unread", count: unreadCount },
        { id: NotificationType.APPLICATION, label: "Apps" },
        { id: NotificationType.SYSTEM, label: "System" },
    ];

    return (
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl h-full w-full flex-1 overflow-y-auto min-h-0 custom-scrollbar text-slate-900 p-3 lg:p-6">
            <div className="flex flex-col justify-between md:flex-row md:items-end gap-3 lg:gap-6 mb-3 lg:mb-6">
                <div className="space-y-1">
                    <h1 className="text-lg lg:text-2xl font-semibold tracking-tight">Activity</h1>
                    <p className="text-xs lg:text-sm text-slate-500 ">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""
                            }.`
                            : "You're all caught up."}
                    </p>
                </div>

                <div className="w-full lg:w-auto flex justify-between flex-wrap items-center gap-2 lg:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchNotifications(false)}
                        disabled={isLoading || isRefreshing}
                        className="gap-2 h-8 px-3 text-xs lg:h-10 lg:px-4 lg:text-sm"
                    >
                        <RefreshCw className={cn("h-3 w-3 lg:h-3.5 lg:w-3.5", (isLoading || isRefreshing) && "animate-spin")} />
                        {isLoading ? 'Loading' : isRefreshing ? 'Refreshing...' : 'Refresh Intel'}
                    </Button>
                    <Button
                            onClick={handleMarkAllAsRead}
                            variant="primary"
                            disabled={notifications.length === 0 || unreadCount === 0}
                            className="gap-2 h-8 px-3 text-xs lg:h-10 lg:px-4 lg:text-sm"
                        >
                           Mark all read
                        </Button>
                    <Button
                            onClick={handleDeleteAll}
                            variant="danger"
                            disabled={notifications.length === 0}
                            className="gap-2 h-8 px-3 text-xs lg:h-10 lg:px-4 lg:text-sm"
                        >
                            Clear all
                        </Button>
                    
                </div>
            </div>

            <div className="flex overflow-x-auto border-b border-slate-200 text-sm mt-4 gap-2 pb-2 mb-6">
                {tabs.map((t) => (
                    <Button
                        key={t.id}
                        variant="ghost"
                        onClick={() => setFilter(t.id)}
                        className={`h-9 text-xs font-semibold rounded-none lg:rounded-lg transition-all border-b lg:border ${filter === t.id ? 'lg:bg-brand-50 text-brand-700 border-brand-500 lg:border-brand-200' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50'} px-4`}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span className={`text-[10px] rounded-full ${filter === t.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'} ml-2 px-2 py-0.5`}>
                                {t.count}
                            </span>
                        )}
                    </Button>
                ))}
            </div>


            <div className="space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} className={`group relative flex items-start border rounded-xl overflow-hidden transition-all ${i % 2 === 0 ? 'bg-brand-50/20 border-brand-200' : 'bg-white border-slate-100'} gap-4 p-4`}>
                                {i % 2 === 0 && (
                                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50" />
                                )}
                                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                                <div className="flex-1 flex items-start justify-between min-w-0 gap-4">
                                    <div className="flex-1 space-y-2 py-1">
                                        <Skeleton className="h-4 w-32 rounded" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3.5 w-full rounded" />
                                            <Skeleton className="h-3.5 w-2/3 rounded" />
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center shrink-0 self-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-5 w-16 rounded-md" />
                                            <div className="h-1 w-1 rounded-full bg-slate-100" />
                                            <Skeleton className="h-3.5 w-16 rounded" />
                                        </div>
                                        <Skeleton className="h-8 w-8 rounded-md opacity-20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-sm text-slate-500 py-12">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
                                <Bell className="h-8 w-8" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-2">No notifications</h3>
                            <p className="max-w-xs text-slate-400">
                                {filter === "all"
                                    ? "You’re all caught up! Check back later for updates."
                                    : `No ${NotificationLabels[filter] || filter} notifications found.`}
                            </p>
                        </div>
                    ) : (
                        filtered.map((n) => (
                            <NotificationCard
                                key={n.id}
                                notification={n}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                                onClick={handleClick}
                                onVisible={handleVisible}
                            />
                        ))
                    )
                )}
            </div>
        </div>
    );
}
