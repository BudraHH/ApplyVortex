import apiClient from '@/services/axios.config';

export const scrapersAPI = {
    scrapeLinkedIn: async (keywords, location, experience = '', jobType = '', workMode = '', checkInterval = '24h', datePosted = '', blueprintId = '', taskType = 1) => {
        const query = new URLSearchParams({
            keywords,
            location,
            ...(experience && { experience }),
            ...(jobType && { job_type: jobType }),
            ...(workMode && { work_mode: workMode }),
            ...(datePosted && { date_posted: datePosted }),
            ...(blueprintId && { blueprint_id: blueprintId }),
            task_type: taskType,
            check_interval: checkInterval
        });
        return await apiClient.post(`/scrapers/linkedin?${query.toString()}`);
    },
    scrapeNaukri: async (keywords, location, experience = '', jobType = '', workMode = '', checkInterval = '24h', datePosted = '', blueprintId = '', minSalary = '', taskType = 1) => {
        const query = new URLSearchParams({
            keywords,
            location,
            ...(experience && { experience }),
            ...(jobType && { job_type: jobType }),
            ...(workMode && { work_mode: workMode }),
            ...(datePosted && { date_posted: datePosted }),
            ...(minSalary && { min_salary: minSalary }),
            ...(blueprintId && { blueprint_id: blueprintId }),
            task_type: taskType,
            check_interval: checkInterval
        });
        return await apiClient.post(`/scrapers/naukri?${query.toString()}`);
    },
    getScrapeStatus: async (scrapeId) => {
        return await apiClient.get(`/scrapers/status/${scrapeId}`);
    }
};

export default scrapersAPI;
