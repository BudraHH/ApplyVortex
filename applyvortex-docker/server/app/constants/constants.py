from enum import IntEnum

class BlueprintStatus(IntEnum):
    IDLE = 0
    AUTO_SCRAPE = 1
    AUTO_APPLY = 2




class AccomplishmentCategory(IntEnum):
    ACHIEVEMENT = 1
    AWARD = 2
    LEADERSHIP = 3
    VOLUNTEERING = 4
    PATENT = 5
    PUBLICATION = 6
    OTHER = 99



class AgentStatus(IntEnum):
    IDLE = 1
    BUSY = 2
    OFFLINE = 3
    ERROR = 4


class AlertSeverity(IntEnum):
    INFO = 1
    WARNING = 2
    CRITICAL = 3
    FATAL = 4


class AlertStatus(IntEnum):
    ACTIVE = 1
    ACKNOWLEDGED = 2
    RESOLVED = 3
    IGNORED = 4


class AccountStatus(IntEnum):
    PENDING = 0
    ACTIVE = 1
    INACTIVE = 2
    SUSPENDED = 3
    DELETED = 4


class ApplicationStatus(IntEnum):
    """
    Application lifecycle status for ApplyVortex.
    Tracks only the application submission process, not post-application outcomes.
    """
    NOT_APPLIED = 0   # Job discovered but not yet applied
    APPLIED = 1       # Application successfully submitted
    IN_PROGRESS = 2   # Application currently being processed by agent
    FAILED = 3        # Application submission failed (can retry)




class CoverLetterTone(IntEnum):
    PROFESSIONAL = 1
    ENTHUSIASTIC = 2
    CONFIDENT = 3
    FORMAL = 4


class Availability(IntEnum):
    IMMEDIATE = 1
    WITHIN_2_WEEKS = 2
    WITHIN_1_MONTH = 3
    WITHIN_2_MONTHS = 4
    SERVING_NOTICE = 5


class CompanySize(IntEnum):
    SIZE_1_10 = 1
    SIZE_11_50 = 2
    SIZE_51_200 = 3
    SIZE_201_500 = 4
    SIZE_501_1000 = 5
    SIZE_1001_5000 = 6
    SIZE_5001_10000 = 7
    SIZE_10000_PLUS = 8


class EducationLevel(IntEnum):
    PRIMARY = 1
    SECONDARY = 2
    HIGH_SCHOOL = 3
    DIPLOMA = 4
    UNDERGRADUATE = 5
    GRADUATE = 6
    DOCTORAL = 7
    PROFESSIONAL = 8
    CERTIFICATION = 9
    BOOTCAMP = 10
    ASSOCIATE = 11


class EducationStatus(IntEnum):
    COMPLETED = 1
    IN_PROGRESS = 2
    ON_HOLD = 3
    DROPPED_OUT = 4


class ExperienceLevel(IntEnum):
    INTERN = 0
    ENTRY_LEVEL = 1
    JUNIOR = 2
    MID_LEVEL = 3
    SENIOR = 4
    LEAD = 5
    ARCHITECT = 6
    EXECUTIVE = 7


class Gender(IntEnum):
    MALE = 1
    FEMALE = 2
    OTHER = 3
    PREFER_NOT_TO_SAY = 4
    UNKNOWN = 5




class GradeType(IntEnum):
    PERCENTAGE = 1
    CGPA = 2
    GPA = 3
    GRADE = 4
    NOT_APPLICABLE = 9


class JobSearchStatus(IntEnum):
    ACTIVELY_LOOKING = 1
    OPEN_TO_OFFERS = 2
    NOT_LOOKING = 3
    CASUALLY_EXPLORING = 4


class JobType(IntEnum):
    FULL_TIME = 1
    PART_TIME = 2
    CONTRACT = 3
    INTERNSHIP = 4
    FREELANCE = 5




class LanguageAbility(IntEnum):
    READ_WRITE = 1
    SPOKEN = 2
    BOTH = 3


class LanguageProficiency(IntEnum):
    NATIVE = 1
    FLUENT = 2
    PROFESSIONAL = 3
    INTERMEDIATE = 4
    BASIC = 5


class MaritalStatus(IntEnum):
    SINGLE = 1
    IN_RELATIONSHIP = 2
    ENGAGED = 3
    MARRIED = 4
    SEPARATED = 5
    DIVORCED = 6
    WIDOWED = 7
    CIVIL_PARTNERSHIP = 8
    UNKNOWN = 9


class NotificationType(IntEnum):
    APPLICATION = 1
    JOB_ALERT = 2
    REMINDER = 3
    SYSTEM = 4
    ANNOUNCEMENT = 5


class OAuthProvider(IntEnum):
    GOOGLE = 1
    GITHUB = 2
    LINKEDIN = 3
    MICROSOFT = 4


class ParsingStatus(IntEnum):
    PENDING = 1
    PROCESSING = 2
    SUCCESS = 3
    FAILED = 4
    SKIPPED = 5


class PortalAuthType(IntEnum):
    OAUTH = 1
    API_KEY = 2
    SCRAPING = 3
    MANUAL = 4
    EMAIL = 5


class PortalCategory(IntEnum):
    JOB_BOARD = 1
    PROFESSIONAL_NETWORK = 2
    NICHE_TECH = 3
    INDIAN_PORTAL = 4
    COMPANY_CAREER_PAGE = 5
    FREELANCE = 6
    STARTUP = 7
    REMOTE_FIRST = 8
    OTHER = 99


class Portal(IntEnum):
    LINKEDIN = 1
    NAUKRI = 2
    INDEED = 3
    GLASSDOOR = 4
    OTHER = 99



class ProjectStatus(IntEnum):
    COMPLETED = 1
    IN_PROGRESS = 2
    ON_HOLD = 3
    CANCELLED = 4


class ProjectType(IntEnum):
    PERSONAL = 1
    ACADEMIC = 2
    PROFESSIONAL = 3
    OPEN_SOURCE = 4
    FREELANCE = 5
    HACKATHON = 6


class ResearchType(IntEnum):
    JOURNAL = 1
    CONFERENCE = 2
    THESIS = 3
    PATENT = 4
    PREPRINT = 5
    BOOK_CHAPTER = 6


class ResumeFileFormat(IntEnum):
    PDF = 1
    DOCX = 2
    DOC = 3
    TXT = 4
    HTML = 5


class ResumeType(IntEnum):
    BASE = 1
    TAILORED = 2
    MANUAL = 3
    PARSED = 4


class SkillsCategory(IntEnum):
    COMPUTER_DOMAIN = 1
    ELECTRICAL_DOMAIN = 2
    SOFT_SKILLS = 99
    OTHER = 999





class SkillSubCategory(IntEnum):
    NONE = 0
    PROGRAMMING_LANGUAGES = 1
    FRONTEND = 2
    BACKEND = 3
    FULL_STACK = 4
    MOBILE = 5
    DATABASES = 6
    SOFTWARE_DEV = 7        # Desktop, Game, Embedded
    DATA_AND_ANALYTICS = 8  # Data Eng, Analytics, Warehousing
    AI_ML = 9               # AI, ML, Deep Learning, NLP, CV
    DEVOPS_CLOUD = 10        # DevOps, Cloud, SRE, Containers, Network, SysAdmin
    SECURITY = 11           # Cyber, App, Network Security, Compliance
    QA_TESTING = 12         # QA, Automation, Performance
    DESIGN = 13             # UI, UX, Graphic, Product
    ARCHITECTURE = 14       # System, Software, API Design
    MANAGEMENT = 15         # Product/Project Mgmt, Agile
    EMERGING_TECH = 16      # Blockchain, Web3, IoT, AR/VR, Quantum
    CORE_CS = 17            # OS, Algorithms, Data Structures
    BUSINESS_DOMAIN = 18    # Finance, Healthcare, E-commerce, Marketing
    OTHER = 9999


class UserRole(IntEnum):
    USER = 1
    ADMIN = 2
    SUPER_ADMIN = 3


class AlertSeverity(IntEnum):
    INFO = 1
    WARNING = 2
    ERROR = 3
    CRITICAL = 4

class AlertStatus(IntEnum):
    ACTIVE = 1
    RESOLVED = 2
    DISMISSED = 3

class AgentStatus(IntEnum):
    ONLINE = 1
    OFFLINE = 2
    BUSY = 3
    IDLE = 4

class AgentRole(IntEnum):
    ASSISTANT = 1
    SUPERVISOR = 2
    ANALYST = 3

class TaskPriority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class TaskStatus(IntEnum):
    PENDING = 1
    IN_PROGRESS = 2
    COMPLETED = 3
    FAILED = 4
    CANCELLED = 5


class WorkMode(IntEnum):
    ONSITE = 1
    REMOTE = 2
    HYBRID = 3

class AgentTaskType(IntEnum):
    PARSE_RESUME = 0 # Parse raw resume text locally
    SCRAPE = 1       # Discovery Only (Find Jobs)
    DEEP_SCRAPE = 2  # Deep Scrape Only (More Details)
    AUTO_APPLY = 3   # Full Autonomous Cycle (Scrape & Apply)
    APPLY = 4        # Individual Multi-Step Application (Manual Apply)


class JobMatchQuality(IntEnum):
    WEAK = 1
    FAIR = 2
    GOOD = 3
    STRONG = 4


class ApplicationSource(IntEnum):
    MANUAL = 1
    AUTO_APPLY = 2
    ONE_CLICK = 3
    BROWSER_EXTENSION = 4


class ApplicationMethod(IntEnum):
    EASY_APPLY = 1
    DIRECT_APPLY = 2
    AUTO = 3


class JobApplyFrequency(IntEnum):
    IMMEDIATE = 0
    HOURLY_1 = 1
    HOURLY_2 = 2
    HOURLY_3 = 3
    HOURLY_6 = 6
    HOURLY_12 = 12
    DAILY = 24
    WEEKLY = 168


class JobAlertDelivery(IntEnum):
    EMAIL = 1
    PUSH = 2
    BOTH = 3
