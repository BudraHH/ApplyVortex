export const BlueprintStatus = {
    IDLE: 0,
    AUTO_SCRAPE: 1,
    AUTO_APPLY: 2
};

export const AccomplishmentCategory = {
    ACHIEVEMENT: 1,
    AWARD: 2,
    LEADERSHIP: 3,
    VOLUNTEERING: 4,
    PATENT: 5,
    PUBLICATION: 6,
    OTHER: 99
};

export const AccountStatus = {
    PENDING: 0,
    ACTIVE: 1,
    INACTIVE: 2,
    SUSPENDED: 3,
    DELETED: 4
};

export const ApplicationStatus = {
    NOT_APPLIED: 0,   // Job discovered but not yet applied
    APPLIED: 1,       // Application successfully submitted  
    IN_PROGRESS: 2,   // Application currently being processed by agent
    FAILED: 3         // Application submission failed (can retry)
};

export const CoverLetterTone = {
    PROFESSIONAL: 1,
    ENTHUSIASTIC: 2,
    CONFIDENT: 3,
    FORMAL: 4
};

export const Availability = {
    IMMEDIATE: 1,
    WITHIN_2_WEEKS: 2,
    WITHIN_1_MONTH: 3,
    WITHIN_2_MONTHS: 4,
    SERVING_NOTICE: 5
};

export const CompanySize = {
    SIZE_1_10: 1,
    SIZE_11_50: 2,
    SIZE_51_200: 3,
    SIZE_201_500: 4,
    SIZE_501_1000: 5,
    SIZE_1001_5000: 6,
    SIZE_5001_10000: 7,
    SIZE_10000_PLUS: 8
};

export const EducationLevel = {
    PRIMARY: 1,
    SECONDARY: 2,
    HIGH_SCHOOL: 3,
    DIPLOMA: 4,
    UNDERGRADUATE: 5,
    GRADUATE: 6,
    DOCTORAL: 7,
    PROFESSIONAL: 8,
    CERTIFICATION: 9,
    BOOTCAMP: 10,
    ASSOCIATE: 11
};

export const EducationStatus = {
    COMPLETED: 1,
    IN_PROGRESS: 2,
    ON_HOLD: 3,
    DROPPED_OUT: 4
};

export const ExperienceLevel = {
    INTERN: 0,
    ENTRY_LEVEL: 1,
    JUNIOR: 2,
    MID_LEVEL: 3,
    SENIOR: 4,
    LEAD: 5,
    ARCHITECT: 6,
    EXECUTIVE: 7
};

export const Gender = {
    MALE: 1,
    FEMALE: 2,
    OTHER: 3,
    PREFER_NOT_TO_SAY: 4,
    UNKNOWN: 5
};

export const GradeType = {
    PERCENTAGE: 1,
    CGPA: 2,
    GPA: 3,
    GRADE: 4,
    NOT_APPLICABLE: 9
};

export const JobSearchStatus = {
    ACTIVELY_LOOKING: 1,
    OPEN_TO_OFFERS: 2,
    NOT_LOOKING: 3,
    CASUALLY_EXPLORING: 4
};

export const JobType = {
    FULL_TIME: 1,
    PART_TIME: 2,
    CONTRACT: 3,
    INTERNSHIP: 4,
    FREELANCE: 5
};

export const LanguageAbility = {
    READ_WRITE: 1,
    SPOKEN: 2,
    BOTH: 3
};

export const LanguageProficiency = {
    NATIVE: 1,
    FLUENT: 2,
    PROFESSIONAL: 3,
    INTERMEDIATE: 4,
    BASIC: 5
};

export const MaritalStatus = {
    SINGLE: 1,
    IN_RELATIONSHIP: 2,
    ENGAGED: 3,
    MARRIED: 4,
    SEPARATED: 5,
    DIVORCED: 6,
    WIDOWED: 7,
    CIVIL_PARTNERSHIP: 8,
    UNKNOWN: 9
};

export const NotificationType = {
    APPLICATION: 1,
    JOB_ALERT: 2,
    REMINDER: 3,
    SYSTEM: 4,
    ANNOUNCEMENT: 5
};

export const OAuthProvider = {
    GOOGLE: 1,
    GITHUB: 2,
    LINKEDIN: 3,
    MICROSOFT: 4
};

export const ParsingStatus = {
    PENDING: 1,
    PROCESSING: 2,
    SUCCESS: 3,
    FAILED: 4,
    SKIPPED: 5
};

export const PortalAuthType = {
    OAUTH: 1,
    API_KEY: 2,
    SCRAPING: 3,
    MANUAL: 4,
    EMAIL: 5
};

export const PortalCategory = {
    JOB_BOARD: 1,
    PROFESSIONAL_NETWORK: 2,
    NICHE_TECH: 3,
    INDIAN_PORTAL: 4,
    COMPANY_CAREER_PAGE: 5,
    FREELANCE: 6,
    STARTUP: 7,
    REMOTE_FIRST: 8,
    OTHER: 99
};

export const Portal = {
    LINKEDIN: 1,
    NAUKRI: 2,
    INDEED: 3,
    GLASSDOOR: 4,
    OTHER: 99
};

export const ProjectStatus = {
    COMPLETED: 1,
    IN_PROGRESS: 2,
    ON_HOLD: 3,
    CANCELLED: 4
};

export const ProjectType = {
    PERSONAL: 1,
    ACADEMIC: 2,
    PROFESSIONAL: 3,
    OPEN_SOURCE: 4,
    FREELANCE: 5,
    HACKATHON: 6
};

export const ResearchType = {
    JOURNAL: 1,
    CONFERENCE: 2,
    THESIS: 3,
    PATENT: 4,
    PREPRINT: 5,
    BOOK_CHAPTER: 6
};

export const ResumeFileFormat = {
    PDF: 1,
    DOCX: 2,
    DOC: 3,
    TXT: 4,
    HTML: 5
};

export const ResumeType = {
    BASE: 1,
    TAILORED: 2,
    MANUAL: 3,
    PARSED: 4
};

export const SkillsCategory = {
    COMPUTER_DOMAIN: 1,
    ELECTRICAL_DOMAIN: 2,
    SOFT_SKILLS: 99,
    OTHER: 999
};

export const SkillSubCategory = {
    NONE: 0,
    PROGRAMMING_LANGUAGES: 1,
    FRONTEND: 2,
    BACKEND: 3,
    FULL_STACK: 4,
    MOBILE: 5,
    DATABASES: 6,
    SOFTWARE_DEV: 7,        // Desktop, Game, Embedded
    DATA_AND_ANALYTICS: 8,  // Data Eng, Analytics, Warehousing
    AI_ML: 9,               // AI, ML, Deep Learning, NLP, CV
    DEVOPS_CLOUD: 10,        // DevOps, Cloud, SRE, Containers, Network, SysAdmin
    SECURITY: 11,           // Cyber, App, Network Security, Compliance
    QA_TESTING: 12,         // QA, Automation, Performance
    DESIGN: 13,             // UI, UX, Graphic, Product
    ARCHITECTURE: 14,       // System, Software, API Design
    MANAGEMENT: 15,         // Product/Project Mgmt, Agile
    EMERGING_TECH: 16,      // Blockchain, Web3, IoT, AR/VR, Quantum
    CORE_CS: 17,            // OS, Algorithms, Data Structures
    BUSINESS_DOMAIN: 18,    // Finance, Healthcare, E-commerce, Marketing
    OTHER: 9999
};

export const UserRole = {
    USER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3
};

export const AlertSeverity = {
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
};

export const AlertStatus = {
    ACTIVE: 1,
    RESOLVED: 2,
    DISMISSED: 3
};

export const AgentStatus = {
    ONLINE: 1,
    OFFLINE: 2,
    BUSY: 3,
    IDLE: 4
};

export const AgentRole = {
    ASSISTANT: 1,
    SUPERVISOR: 2,
    ANALYST: 3
};

    export const TaskPriority = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4
    };

export const TaskStatus = {
    PENDING: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    FAILED: 4,
    CANCELLED: 5
};

export const WorkMode = {
    ONSITE: 1,
    REMOTE: 2,
    HYBRID: 3
};

export const AgentTaskType = {
    PARSE_RESUME: 0,
    SCRAPE: 1,
    DEEP_SCRAPE: 2,
    AUTO_APPLY: 3,
    APPLY: 4
};

export const TaskType = {
    PARSE_RESUME: 0,
    SCRAPE: 1,
    DEEP_SCRAPE: 2,
    AUTO_APPLY: 3,
    APPLY: 4
};

export const JobMatchQuality = {
    STRONG: 80,
    GOOD: 60,
    FAIR: 40,
    WEAK: 0
};

export const ApplicationSource = {
    MANUAL: 1,
    AUTO_APPLY: 2,
    ONE_CLICK: 3,
    BROWSER_EXTENSION: 4
};

export const ApplicationMethod = {
    EASY_APPLY: 1,
    DIRECT_APPLY: 2,
    AUTO: 3
};

export const JobApplyFrequency = {
    IMMEDIATE: 0,
    HOURLY_1: 1,
    HOURLY_2: 2,
    HOURLY_3: 3,
    HOURLY_6: 6,
    HOURLY_12: 12,
    DAILY: 24,
    WEEKLY: 168
};

export const JobAlertDelivery = {
    EMAIL: 1,
    PUSH: 2,
    BOTH: 3
};
