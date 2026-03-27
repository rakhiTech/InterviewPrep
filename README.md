# InterviewPrepAI - AI-Powered Interview Preparation Platform

A production-ready, full-stack AI-powered interview preparation platform for developers with two roles: **Interviewer (Admin)** and **Candidate**.

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js App    │────▶│  Express Backend  │────▶│   MongoDB        │
│   (Frontend)     │     │  (API Server)     │     │   (Database)     │
│   Port: 3000     │     │  Port: 5000       │     │   Port: 27017    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│   Socket.io      │     │  FastAPI Service  │
│   (Realtime)     │     │  (AI Processing)  │
│                  │     │  Port: 8000       │
└──────────────────┘     └──────────────────┘
                                 │
                                 ▼
                         ┌──────────────────┐
                         │  Ollama (LLM)    │
                         │  Port: 11434     │
                         └──────────────────┘
```

## 🚀 Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | Next.js 14 (App Router), TypeScript |
| Backend          | Node.js, Express, Socket.io         |
| Database         | MongoDB, Mongoose                   |
| AI Service       | Python, FastAPI, Ollama (local LLM) |
| Code Editor      | Monaco Editor                       |
| Code Exec        | Judge0 (self-hosted)                |
| Proctoring       | WebRTC APIs                         |
| Containerization | Docker, Docker Compose              |
| CI/CD            | GitHub Actions                      |

## 📁 Project Structure

```
InterviewPrepAI/
├── frontend/          # Next.js application
├── backend/           # Express API server
├── ai-service/        # FastAPI AI microservice
├── docker-compose.yml # Local development orchestration
├── .github/           # CI/CD workflows
└── docs/              # Documentation
```

## 🛠️ Prerequisites

- Node.js >= 18
- Python >= 3.10
- Docker & Docker Compose
- MongoDB (or use Docker)
- Ollama (for local LLM)

## 🏃 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-repo/InterviewPrepAI.git
cd InterviewPrepAI

# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env

# Start all services
docker-compose up --build
```

### Option 2: Manual Setup

#### 1. Install Ollama (Free Local LLM)

```bash
# macOS
brew install ollama

# Start Ollama
ollama serve

# Pull a model (in another terminal)
ollama pull llama3.2
```

#### 2. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or install locally
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### 3. Start Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### 4. Start AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

#### 5. Start Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

#### 6. Start Judge0 (Code Execution - Self-hosted)

```bash
cd judge0
docker-compose up -d
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **API Docs (AI)**: http://localhost:8000/docs
- **Judge0**: http://localhost:2358

## 🔑 Features

### Interviewer (Admin)

- ✅ Create interview sessions with customizable settings
- ✅ Select programming languages, topics, and difficulty
- ✅ AI-generated questions from custom topics
- ✅ Generate shareable interview links (ID + password)
- ✅ View candidate performance analytics
- ✅ Proctoring flags and cheating detection

### Candidate

- ✅ Join interviews using ID + password (no signup required)
- ✅ Camera and screen sharing enabled
- ✅ Timer-based interview sessions
- ✅ Monaco code editor with syntax highlighting
- ✅ Run code with test cases (via Judge0)
- ✅ AI follow-up questions based on responses

### AI Capabilities

- ✅ Dynamic question generation (topic + difficulty)
- ✅ Adaptive difficulty adjustment
- ✅ Code correctness evaluation
- ✅ Explanation quality assessment
- ✅ Strengths/weaknesses feedback
- ✅ Tab switching detection
- ✅ Face detection proctoring

### Accessibility (WCAG AAA)

- ✅ Full keyboard navigation
- ✅ ARIA roles and labels
- ✅ High contrast UI
- ✅ Screen reader compatible
- ✅ Focus management

## 📄 License

MIT License
