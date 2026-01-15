// Agent Task Types
export const AgentTaskType = {
    PARSE_RESUME: 0,
    SCRAPE: 1,
    DEEP_SCRAPE: 2,
    AUTO_APPLY: 3,
    APPLY: 4
};

export const TaskPriority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
};

export const getTaskTypeLabel = (taskType) => {
    const labels = {
        [AgentTaskType.PARSE_RESUME]: 'Parse Resume',
        [AgentTaskType.SCRAPE]: 'Scrape',
        [AgentTaskType.DEEP_SCRAPE]: 'Deep Scrape',
        [AgentTaskType.AUTO_APPLY]: 'Auto Apply',
        [AgentTaskType.APPLY]: 'Apply'
    };
    return labels[taskType] || 'Unknown';
};
