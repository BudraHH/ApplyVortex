import apiClient from '@/services/axios.config';

export const agentTasksAPI = {
    getTasks: async () => {
        return await apiClient.get('/agent-forge/tasks');
    },
    // In the future we might want a specific endpoint for checking status of a specific task
    // For now, the backend 'GET /tasks' returns pending tasks. 
    // We might need an endpoint to get history/status of tasks initiated by user.
    // The current backend implementation focuses on what the AGENT needs (pending tasks).
    // The USER needs to see their requested tasks. 
    // I should probably add an endpoint for 'my-tasks' in the backend first if it doesn't exist?
    // Wait, the backend has 'GET /tasks' which returns pending tasks for the user.
    // But once assigned, they are no longer pending. 
    // I need an endpoint to get ALL tasks for the user to show history.
    getHistory: async () => {
        return await apiClient.get('/agent-forge/history');
    }
};

export default agentTasksAPI;
