# ApplyVortex: Advanced AI Job Application Automation Suite

ApplyVortex is an end-to-end autonomous job application ecosystem designed to automate the bridge between candidates and job portals. It leverages high-precision AI for resume parsing, intelligent job matching, and enterprise-grade browser automation with stealth capabilities for scraping and applications.

---

## 1. System Architecture

The project follows a **Distributed Agent-Server Architecture** with three main components communicating over REST APIs.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ApplyVortex Ecosystem                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐      REST API        ┌──────────────────────────┐    │
│   │   Web Dashboard │◄───────────────────►│    Central API Server    │    │
│   │   (React/Vite)  │                      │       (FastAPI)          │    │
│   │   Port: 3000    │                      │       Port: 8000         │    │
│   └─────────────────┘                      └────────────┬─────────────┘    │
│                                                         │                   │
│                                                         │ PostgreSQL        │
│   ┌─────────────────┐      REST API                     │ (Neon)            │
│   │  Desktop Agent  │◄──────────────────────────────────┤                   │
│   │  (Python/PyWeb) │                                   │ Redis             │
│   │   + Playwright  │                                   │ (Cache/Queue)     │
│   └─────────────────┘                                   │                   │
│          │                                              │ Cloudflare R2     │
│          │ Browser Automation                           │ (Storage)         │
│          ▼                                              │                   │
│   ┌─────────────────┐                      ┌────────────┴─────────────┐    │
│   │  Job Portals    │                      │     Celery Workers       │    │
│   │  - LinkedIn     │                      │   (Background Tasks)     │    │
│   │  - Naukri       │                      └──────────────────────────┘    │
│   │  - Indeed       │                                                       │
│   │  - Glassdoor    │                                                       │
│   └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### A. Component Breakdown

1.  **Central API Server (Backend)**
    *   **Tech Stack**: FastAPI, SQLAlchemy 2.0 (Async), PostgreSQL (Neon Tech), Redis, Celery
    *   **Role**: Orchestrates tasks, manages user profiles, persists job data, handles authentication, and provides the interface for both the Frontend and the Desktop Agent.
    *   **AI Integration**: Uses LangChain with Google Gemini (langchain-google-genai) for resume parsing, job scoring, and content generation.
    *   **Key Features**:
        - JWT-based authentication with multi-session management
        - Rate limiting and caching via Redis
        - Background task processing via Celery workers
        - Comprehensive system logging middleware

2.  **Web Dashboard (Frontend)**
    *   **Tech Stack**: React 19, Vite 7, Tailwind CSS 3.4, Radix UI, Framer Motion, TanStack Query, Zustand
    *   **Role**: User interface for uploading resumes, configuring "Blueprints" (search criteria), monitoring agent status, managing job matches, and tracking applications.
    *   **Key Pages**:
        - Dashboard & Analytics
        - Jobs Discovery & Analysis
        - Apply Page (Blueprint management)
        - Applications Tracking
        - Profile Setup (Multi-step wizard)
        - Agent Management
        - Settings & Notifications

3.  **Desktop Automation Agent**
    *   **Tech Stack**: Python 3.10+, Playwright (with stealth patches), PyWebView (GUI), LangChain (Local AI), Asyncio
    *   **Role**: Runs on the user's local machine. Polls the server for tasks, drives a real Chromium browser with enterprise-grade anti-detection to execute scraping and application scripts.
    *   **GUI**: React-based UI embedded via PyWebView with a Python-to-JavaScript bridge
    *   **Key Features**:
        - Session pooling with sticky fingerprints
        - Human behavior simulation (Bezier mouse movements, natural typing)
        - Circuit breaker pattern for failure protection
        - Real-time metrics and observability

4.  **Database & Infrastructure**
    *   **PostgreSQL (Neon)**: Primary storage for users, resumes, jobs, tasks, skills, and profile data
    *   **Redis**: Rate limiting, session management, and Celery task queue
    *   **Cloudflare R2**: Object storage for resume PDFs and generated documents
    *   **Docker Compose**: Container orchestration for local development

---

## 2. Technology Stack

### Backend (Server)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | FastAPI | 0.122.0 |
| ORM | SQLAlchemy (Async) | 2.0.35 |
| Database | PostgreSQL (Neon) | 16 |
| Cache/Queue | Redis | 7 |
| Task Queue | Celery | 5.3.6 |
| AI/NLP | LangChain + Google Gemini | 0.3.13 |
| NLP (Local) | spaCy + scikit-learn | 3.8.3 |
| PDF Generation | ReportLab + WeasyPrint | 4.2.5 |
| Storage | Boto3 (S3/R2) | 1.35.76 |

### Frontend (Client)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 3.4.17 |
| Components | Radix UI | Latest |
| Animation | Framer Motion | 12.23.26 |
| State | Zustand | 5.0.8 |
| Data Fetching | TanStack Query | 5.90.11 |
| HTTP Client | Axios | 1.13.2 |
| Forms | React Hook Form + Zod | 7.66.1 |
| Icons | Lucide React | 0.555.0 |

### Agent (Desktop)
| Category | Technology | Version |
|----------|------------|---------|
| Language | Python | 3.10+ |
| Browser Automation | Playwright | 1.49.0 |
| Stealth | playwright-stealth + undetected-playwright | Latest |
| GUI | PyWebView | Latest |
| AI (Local) | LangChain + Google Gemini | 0.3.13 |
| PDF Parsing | PyPDF | Latest |
| HTTP Client | Requests + HTTPX | 2.32.3 |

---

## 3. Implementation Details

### B. Backend Implementation (FastAPI)
The backend is structured into modular layers following clean architecture patterns:

```
server/app/
├── api/
│   └── v1/
│       └── endpoints/          # RESTful API endpoints
│           ├── agent_forge.py  # Agent task management (50KB+)
│           ├── auth.py         # Authentication & sessions
│           ├── users.py        # User management
│           ├── jobs.py         # Job CRUD operations
│           ├── resumes.py      # Resume management
│           ├── blueprint.py    # Search configuration
│           ├── applications.py # Application tracking
│           └── ...
├── models/                     # SQLAlchemy ORM models
│   ├── user/                   # User, Education, Experience, etc.
│   ├── job/                    # Job, JobMatchAnalysis, etc.
│   ├── skill/                  # Skill taxonomy
│   └── system/                 # SystemLog, Agent, etc.
├── repositories/               # Data access layer with async operations
├── services/
│   ├── ai/                     # AI-powered services (unused on server)
│   ├── automation/             # Scraper integrations
│   ├── job/                    # Job processing & matching
│   ├── profile/                # Profile completion & aggregation
│   ├── storage/                # R2/S3 file storage
│   └── auth/                   # Authentication services
├── schemas/                    # Pydantic request/response models
├── tasks/                      # Celery background tasks
└── core/
    ├── config.py               # Pydantic settings management
    ├── database.py             # Async database connection
    ├── security.py             # JWT & password hashing
    └── exceptions.py           # Custom exception classes
```

### C. Agent Implementation (Playwright + PyWebView)

The agent operates via a **Pull-based Lifecycle** with stealth capabilities:

```
agent/
├── main.py                     # Entry point & task orchestrator (667 lines)
├── client.py                   # API communication with auto-reauthentication
├── webview_gui.py              # PyWebView GUI wrapper
├── webview_api.py              # Python-to-JavaScript bridge API
├── core/
│   ├── browser_service.py      # Stealth browser management (532 lines)
│   ├── human_simulator.py      # Anti-detection behavior simulation
│   ├── metrics.py              # Observability & circuit breaker
│   ├── state_manager.py        # Local state persistence
│   ├── heartbeat.py            # Server heartbeat
│   └── identity.py             # Agent identification
├── scrapers/
│   ├── linkedin.py             # LinkedIn scraper (shallow)
│   ├── linkedin_deep_scraper.py # LinkedIn deep enrichment
│   ├── naukri.py               # Naukri.com scraper
│   └── executor.py             # Scraper execution engine
├── handlers/
│   ├── auto_apply_handler.py   # Autonomous application handler
│   └── ats/                    # ATS-specific form handlers
├── strategies/                 # Portal-specific apply strategies
│   ├── linkedin.py             # LinkedIn Easy Apply
│   ├── indeed.py               # Indeed Apply
│   └── default.py              # Generic ATS handler
├── services/ai/
│   ├── base.py                 # Local AI base service
│   ├── resume_parser.py        # LLM-based resume parsing
│   └── resume_scorer.py        # Job-resume matching
└── ui/                         # React UI (built from separate source)
```

#### Agent Workflow:
1.  **Initialization**: Agent registers with server, authenticates via API key
2.  **Polling**: Calls `GET /api/v1/agent-forge/tasks` every few seconds
3.  **Context Loading**: Downloads user's Blueprint and Resume context
4.  **Browser Execution**: Using Playwright with stealth patches:
    *   **Session Pooling**: Maintains 3 reusable browser contexts
    *   **Sticky Fingerprinting**: Consistent user agent, viewport, locale
    *   **Human Simulation**: Bezier curve mouse movements, natural typing with typos
5.  **Batch Syncing**: Results sent back in batches to ensure persistence

### D. Stealth System Architecture

The agent implements enterprise-grade anti-detection:

```python
# Key Components
├── StickyFingerprint      # Persistent browser fingerprint across sessions
├── SessionPool            # Pool of 3 reusable browser contexts
├── HumanSimulator         # Bezier curves, typing with errors, organic scrolling
├── CircuitBreaker         # Failure protection (5 failures → 5min cooldown)
└── StealthMetrics         # Detection rate, ban rate, reuse efficiency tracking
```

**Features:**
- **Bezier Curve Mouse Movement**: Natural, curved mouse paths with micro-jitter
- **Typing Simulation**: 50-150ms delays, 2% typo rate with corrections
- **Organic Scrolling**: Chunked scrolls with variable speeds and overscroll
- **Health Checks**: Automatic context validation before operations
- **Emergency Restart**: Automatic browser restart on detection

### E. AI Engine (Google Gemini via LangChain)

ApplyVortex uses a multi-tier AI pipeline:

1.  **Resume Parsing** (Agent-side):
    - Extracts structured JSON from raw resume text/PDFs
    - Uses Qwen 2.5 Instruct prompt style for consistent output
    - Handles personal details, education, experience, projects, skills, certifications

2.  **Job Matching** (Server-side):
    - Compares profile context against job descriptions
    - Generates match score (0-100) with detailed analysis
    - Identifies missing skills and improvement suggestions

3.  **Local NLP Fallback**:
    - spaCy + scikit-learn for keyword extraction
    - TF-IDF similarity when AI API is unavailable
    - Ensures functionality during API outages

---

## 4. Core Workflows

### F. The Discovery Workflow (Phase 1: Shallow Scrape + Match)
```
1. User Action     → Creates Blueprint (e.g., "Fullstack Developer, Remote, LinkedIn")
2. Task Creation   → Backend creates SCRAPE task in queue
3. Agent Pickup    → Local agent fetches task, launches stealth browser
4. Shallow Scrape  → Extracts job listings (title, company, location, URL)
5. Batch Sync      → Jobs sent to server in batches
6. Match Scoring   → AI generates match scores (0-100) for each job
7. Dashboard       → Results appear with AI-driven quality labels
```

### G. The Enrichment Workflow (Phase 2: Deep Scrape)
```
1. Trigger         → Jobs needing enrichment identified
2. Deep Scrape     → Agent visits each job page
3. Data Extraction → Full JD, requirements, responsibilities, apply URL
4. Sync            → Enriched data sent to server
5. Updates         → deep_scraped_at timestamp and is_easy_apply populated
```

### H. Automated Application Workflow
```
1. Trigger            → User selects job OR Auto-Apply enabled
2. Profile Loading    → Full user profile fetched from server
3. Resume Tailoring   → Local AI optimizes resume for job keywords
4. Apply Detection    → Detects type: Easy Apply (70%), External ATS (25%), Direct (5%)
5. Form Filling       → AI-powered field mapping and population
6. Submission         → Form submitted with validation
7. Result Reporting   → Success/failure reported to server with screenshot
```

### I. Resume Processing Workflow
```
1. Upload          → User uploads PDF via Dashboard
2. Storage         → PDF stored in Cloudflare R2
3. Task Creation   → PARSE_RESUME task created for agent
4. Agent Processing→ PDF text extracted, sent to LLM
5. Parsing         → Structured JSON extracted (500+ line prompt template)
6. Population      → Profile sections auto-populated in database
7. Notification    → User notified of completion
```

---

## 5. Database Schema Highlights

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Authentication, credentials, preferences |
| `resumes` | Parsed resume data as structured JSON, R2 links |
| `jobs` | Global job registry (deduplicated across users) |
| `job_match_analysis` | User-specific AI match scores, missing skills |
| `user_job_map` | Junction table: job ↔ user relationship, application status |
| `tasks` | Agent task queue (SCRAPE, APPLY, PARSE_RESUME) |
| `agents` | Registered agent instances |
| `agent_api_keys` | API keys for agent authentication |
| `blueprints` | Search configurations (keywords, location, portal) |

### Profile Tables
| Table | Purpose |
|-------|---------|
| `user_education` | Education history |
| `user_experience` | Work experience |
| `user_projects` | Project portfolio |
| `user_certifications` | Certifications |
| `user_skills` | Skill associations |
| `skills_library` | Master skill taxonomy |

### System Tables
| Table | Purpose |
|-------|---------|
| `system_logs` | API request/response logging |
| `notifications` | User notification queue |

---

## 6. API Structure

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - Session termination

### Agent Forge (Agent Communication)
- `GET /api/v1/agent-forge/tasks` - Fetch pending tasks
- `POST /api/v1/agent-forge/task/{id}/result` - Submit task result
- `POST /api/v1/agent-forge/jobs/sync` - Batch job sync
- `POST /api/v1/agent-forge/job/{id}/enrich` - Sync enriched job
- `POST /api/v1/agent-forge/heartbeat` - Agent heartbeat

### Jobs
- `GET /api/v1/jobs` - List jobs with filters
- `GET /api/v1/jobs/{id}` - Job details with match analysis
- `POST /api/v1/jobs/{id}/apply` - Mark job as applied

### Profile
- `GET /api/v1/users/me/profile/complete` - Full aggregated profile
- `PUT /api/v1/users/me/education` - Update education
- `PUT /api/v1/users/me/experience` - Update experience
- `PUT /api/v1/users/me/skills` - Update skills

### Blueprints
- `GET /api/v1/blueprints` - List user blueprints
- `POST /api/v1/blueprints` - Create blueprint
- `PUT /api/v1/blueprints/{id}` - Update blueprint
- `PUT /api/v1/blueprints/{id}/toggle` - Enable/disable

---

## 7. Technical Project Structure

```
applyvortex/
├── agent/                      # Desktop automation agent
│   ├── main.py                 # Entry point (667 lines)
│   ├── client.py               # API client (339 lines)
│   ├── webview_gui.py          # PyWebView integration
│   ├── core/                   # Browser & state management
│   ├── scrapers/               # Portal-specific scrapers
│   ├── handlers/               # Application handlers
│   ├── strategies/             # Apply strategies
│   ├── services/ai/            # Local AI services
│   └── ui/                     # React UI (built)
│
├── applyvortex-docker/
│   ├── server/                 # FastAPI backend
│   │   └── app/
│   │       ├── api/v1/         # REST endpoints
│   │       ├── models/         # SQLAlchemy models
│   │       ├── repositories/   # Data access layer
│   │       ├── services/       # Business logic
│   │       ├── schemas/        # Pydantic models
│   │       └── tasks/          # Celery tasks
│   │
│   ├── client/                 # React frontend
│   │   └── src/
│   │       ├── pages/          # Route components
│   │       ├── components/     # Reusable UI components
│   │       ├── services/       # API wrappers
│   │       ├── stores/         # Zustand state
│   │       └── hooks/          # Custom React hooks
│   │
│   └── docker-compose.yml      # Container orchestration
│
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── APPLYVORTEX_DOCUMENTATION.md # This file
```

---

## 8. Supported Portals & Features

| Portal | Shallow Scrape | Deep Scrape | Auto-Apply | Special Features |
|--------|----------------|-------------|------------|------------------|
| **LinkedIn** | ✅ Full | ✅ Full | ✅ Easy Apply | Infinite scroll, modal handling |
| **Naukri** | ✅ Full | ✅ Full | 🏗️ In Progress | Profile-based extraction |
| **Indeed** | ✅ Full | 🏗️ Planned | 🏗️ Planned | Metadata enrichment |
| **Glassdoor** | ✅ Full | 🏗️ Planned | 🏗️ Planned | Company review extraction |

---

## 9. Security & Reliability

### Authentication
- **JWT Tokens**: Access (15min) + Refresh (7d) token pattern
- **Multi-Session**: OS/IP tracking with device management
- **API Keys**: Agent-specific authentication with user binding

### Anti-Detection (Agent)
- **Local Execution**: Bypasses cloud IP blacklists
- **Sticky Fingerprints**: Consistent browser identity across sessions
- **Human Simulation**: Realistic mouse, keyboard, and scroll patterns
- **Session Pooling**: Reduces fingerprint exposure
- **Circuit Breaker**: Automatic cooldown on detection

### Data Protection
- **Rate Limiting**: Redis-backed request throttling
- **Input Validation**: Pydantic schemas for all inputs
- **CORS**: Strict origin policies
- **Secure Headers**: TrustedHostMiddleware in production

### Reliability
- **Fail-to-Local**: NLP fallback when AI API fails
- **Atomic Transactions**: SQLAlchemy async transactions
- **Error Recovery**: Screenshot + HTML dump on failures
- **Health Checks**: Automatic browser context validation

---

## 10. Error Handling Philosophy

ApplyVortex implements a **"Fail-to-Local"** strategy:

1. **AI Failures (401/429)**: Falls back to spaCy + TF-IDF keyword matching
2. **Scraper Blockage**: Captures debug artifacts (screenshot, HTML) and continues to next task
3. **Browser Detection**: Circuit breaker triggers 5-minute cooldown
4. **Network Issues**: Automatic retry with exponential backoff
5. **Database Consistency**: Async transactions ensure atomic job syncs

---

## 11. Development Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.10+ (for agent)
- Node.js 18+ (for frontend development)

### Quick Start
```bash
# Clone and navigate
cd applyvortex/applyvortex-docker

# Start all services
docker-compose up -d

# Services available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Flower (Celery): http://localhost:5555
# - Adminer (DB): http://localhost:8080
```

### Agent Setup
```bash
cd agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Configure
cp .env.example .env
# Edit .env with API_KEY and API_URL

# Run
python main.py          # GUI mode
python main.py --no-gui # Headless mode
```

---

## 12. Metrics & Observability

The agent tracks comprehensive metrics:

| Metric | Description |
|--------|-------------|
| `sessions_created` | Total browser sessions launched |
| `context_reuses` | Successful session reuses |
| `total_operations` | Completed scrape/apply actions |
| `captcha_encounters` | CAPTCHA challenges detected |
| `ban_events` | IP/account blocks encountered |
| `emergency_restarts` | Browser restart events |
| `ban_rate` | Bans per 100 operations |
| `detection_rate` | Overall detection percentage |
| `reuse_efficiency` | Session reuse ratio |

---

*Last Updated: January 2026*
*Version: 2.0*
