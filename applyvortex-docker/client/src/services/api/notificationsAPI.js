// src/services/api/notificationsAPI.js
import apiClient from '@/services/axios.config';

export const notificationsAPI = {
    /**
     * Get user notifications
     * GET /notifications
     * @param {Object} params - Query parameters
     * @param {number} params.skip - Pagination skip
     * @param {number} params.limit - Pagination limit
     * @param {boolean} params.unread_only - Filter unread only
     * @returns {Promise<Array>} List of notifications
     */
    getNotifications: async ({ skip = 0, limit = 20, unread_only = false } = {}) => {
        const res = await apiClient.get('/notifications', {
            params: { skip, limit, unread_only }
        });
        return res;
    },

    /**
     * Mark a notification as read
     * PATCH /notifications/{notification_id}/read
     * @param {string} notificationId - Notification ID
     * @returns {Promise<boolean>} Success status
     */
    markAsRead: async (notificationId) => {
        const res = await apiClient.patch(`/notifications/${notificationId}/read`);
        return res;
    },

    markAllAsRead: async () => {
        const res = await apiClient.patch('/notifications/read-all');
        return res;
    },

    /**
     * Mark multiple notifications as read
     * PATCH /notifications/bulk-read
     * @param {Array<string>} notificationIds - List of notification IDs
     * @returns {Promise<number>} Count of updated notifications
     */
    bulkMarkAsRead: async (notificationIds) => {
        const res = await apiClient.patch('/notifications/bulk-read', notificationIds);
        return res;
    },

    /**
     * Delete a single notification
     * DELETE /notifications/{notification_id}
     * @param {string} notificationId - Notification ID
     * @returns {Promise<boolean>} Success status
     */
    deleteNotification: async (notificationId) => {
        const res = await apiClient.delete(`/notifications/${notificationId}`);
        return res;
    },

    /**
     * Delete all notifications
     * DELETE /notifications
     * @returns {Promise<number>} Count of deleted notifications
     */
    deleteAll: async () => {
        const res = await apiClient.delete('/notifications');
        return res;
    }
};
