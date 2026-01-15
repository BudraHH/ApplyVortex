<div align="center">
  <br />
  <h1>🌪️ ApplyVortex</h1>
  <p>
    <strong>The Autonomous AI Agent for High-Velocity Job Applications</strong>
  </p>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-roadmap">Roadmap</a>
  </p>
  <br />
  
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
  ![React](https://img.shields.io/badge/frontend-React_%7C_Tailwind-61DAFB.svg)
  ![Python](https://img.shields.io/badge/backend-Python_%7C_FastAPI-3776AB.svg)
  ![Postgres](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
</div>

---

## 🚀 Overview

**ApplyVortex** is an advanced, AI-driven automation suite designed to revolutionize the job search process. By leveraging stealth browser automation, large language models (LLMs), and algorithmic matching, ApplyVortex autonomously finds, tailors, and submits job applications on your behalf.

Stop spending hours filling out forms. Let the Vortex handle the drift while you focus on the interview.

## ✨ Features

- **🤖 Autonomous Agent**: Full-cycle automation including login, search, form filling, and submission.
- **🧠 Intelligent Resume Tailoring**: Uses fine-tuned LLMs (Qwen/Llama) to dynamically rewrite resumes for every specific job description.
- **🕵️‍♂️ Stealth Browser Tech**: Advanced anti-detection barriers ensuring high success rates on major job boards.
- **📊 Analytics Dashboard**: Real-time tracking of applications sent, success rates, and interview pipelines.
- **🔐 Secure & Local**: Your credentials and personal data stay encrypted. The agent runs locally or in your private cloud container.

## 🏗️ Architecture

ApplyVortex is built as a modern monorepo using Docker for orchestration:

| Service | Tech Stack | Description |
| :--- | :--- | :--- |
| **Client** | React, Vite, Tailwind, Framer Motion | Premium, responsive dashboard for managing your profile and viewing stats. |
| **Server** | Python, FastAPI, SQLAlchemy | REST API handling business logic, database transactions, and user management. |
| **Agent** | Python, Playwright, PyWebView | The desktop-class engine that performs the actual browser automation and interactions. |
| **Database** | PostgreSQL (Neon Tech) | Robust relational data storage for jobs, profiles, and application history. |

## 📂 Project Structure

```bash
applyvortex/
├── applyvortex-docker/       # Core containerized services
│   ├── client/               # React Frontend
│   ├── server/               # Python Backend API
│   └── docker-compose.yml    # Orchestration config
├── agent/                    # Desktop Automation Agent
├── documentation/            # Project documentation & guides
└── .gitignore                # Git configuration
```

## 🛠️ Getting Started

### Prerequisites

- **Docker** & **Docker Compose**
- **Node.js** v18+ (for local frontend dev)
- **Python** 3.10+ (for local backend/agent dev)

### ⚡ Quick Start (Docker)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/BudraHH/ApplyVortex.git
    cd ApplyVortex
    ```

2.  **Configure Environment**
    Create a `.env` file in the `applyvortex-docker` directory:
    ```bash
    cp applyvortex-docker/.env.example applyvortex-docker/.env
    # Edit .env with your database credentials and API keys
    ```

3.  **Launch the System**
    ```bash
    cd applyvortex-docker
    docker compose up --build
    ```

    - **Frontend**: http://localhost:5173
    - **Backend API**: http://localhost:8000/docs

## 🖥️ Development

### Frontend
```bash
cd applyvortex-docker/client
npm install
npm run dev
```

### Backend
```bash
cd applyvortex-docker/server
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ by the ApplyVortex Team
</div>
