# InterviewPrepAI — Developer Guide 📘

> **Version:** 1.0.0 | **Last Updated:** March 27, 2026  
> **Author:** Rakhi Barnwal

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [How It All Works](#4-how-it-all-works)
5. [Setup & Installation](#5-setup--installation)
   - [Prerequisites](#51-prerequisites)
   - [Option A — Run Everything with Docker](#52-option-a--run-everything-with-docker-recommended)
   - [Option B — Run Services Individually](#53-option-b--run-services-individually-for-development)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [API Reference](#7-api-reference)
8. [Database Schema](#8-database-schema)
9. [Real-time Events (Socket.io)](#9-real-time-events-socketio)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Next.js 16 Frontend (:3000)                     │ │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐│ │
│  │  │ Landing  │ │  Admin   │ │ Candidate │ │ Interview Session││ │
│  │  │  Page    │ │Dashboard │ │ Join Page │ │ (Monaco Editor)  ││ │
│  │  └─────────┘ └──────────┘ └───────────┘ └──────────────────┘│ │
│  └───────────────────┬────────────────────────┬─────────────────┘ │
└──────────────────────┼────────────────────────┼───────────────────┘
                       │ REST API (Axios)        │ WebSocket (Socket.io)
                       ▼                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              Node.js / Express Backend (:5000)                    │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Auth    │ │ Interview │ │ Proctor  │ │  Code Execution  │   │
│  │  Routes  │ │Controller │ │ Service  │ │  Service (Judge0)│   │
│  └──────────┘ └─────┬─────┘ └──────────┘ └────────┬─────────┘   │
│                     │                              │              │
│         ┌───────────┼──────────────────────────────┘              │
│         ▼           ▼                                             │
│  ┌─────────────┐  ┌────────────────────────────────┐             │
│  │ MongoDB 7   │  │  Judge0 Code Engine (:2358)     │             │
│  │ (Mongoose)  │  │  (Self-hosted, secure sandbox)  │             │
│  └─────────────┘  └────────────────────────────────┘             │
└──────────────────────┬────────────────────────────────────────────┘
                       │ HTTP (httpx)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              Python / FastAPI AI Service (:8000)                   │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────┐     │
│  │  Question     │ │  Answer      │ │  Feedback            │     │
│  │  Generator    │ │  Evaluator   │ │  & Follow-up         │     │
│  └───────┬───────┘ └──────┬───────┘ └──────────┬──────────┘     │
│          └────────────────┼─────────────────────┘                │
│                           ▼                                       │
│                ┌───────────────────┐                              │
│                │   Ollama (LLM)    │                              │
│                │   llama3.2 model  │                              │
│                │   (:11434)        │                              │
│                └───────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

The platform uses a **microservices architecture** with 4 main services:

| Service        | Port | Technology                       | Purpose                       |
| -------------- | ---- | -------------------------------- | ----------------------------- |
| **Frontend**   | 3000 | Next.js 16, React 19, TypeScript | UI for Admins & Candidates    |
| **Backend**    | 5000 | Node.js, Express, Socket.io      | REST API, Auth, Proctoring    |
| **AI Service** | 8000 | Python, FastAPI, Ollama          | AI Question Gen & Evaluation  |
| **Judge0**     | 2358 | Docker (Self-hosted)             | Secure code execution sandbox |

**Supporting Infrastructure:**
| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary database |
| Redis | 6379 | Socket.io adapter, code execution queue |
| Ollama | 11434 | Local LLM inference engine |

---

## 2. Technology Stack

### Frontend

| Technology       | Version | Purpose                       |
| ---------------- | ------- | ----------------------------- |
| Next.js          | 16.2.1  | React framework (App Router)  |
| React            | 19.2.4  | UI library                    |
| TypeScript       | 5.x     | Type safety                   |
| Zustand          | 5.0.12  | Lightweight state management  |
| Monaco Editor    | 4.7.0   | VS Code-grade code editor     |
| Socket.io Client | 4.8.3   | Real-time proctoring events   |
| Axios            | 1.13.6  | HTTP client with interceptors |
| React Hot Toast  | 2.6.0   | Toast notifications           |

### Backend

| Technology      | Version | Purpose                    |
| --------------- | ------- | -------------------------- |
| Express         | 4.18.2  | HTTP framework             |
| Mongoose        | 8.0.3   | MongoDB ODM                |
| Socket.io       | 4.7.2   | Real-time WebSocket server |
| Zod             | 3.22.4  | Request validation         |
| JSON Web Tokens | 9.0.2   | Admin authentication       |
| Helmet          | 7.1.0   | Security HTTP headers      |
| Winston         | 3.11.0  | Structured logging         |

### AI Service

| Technology | Version | Purpose                        |
| ---------- | ------- | ------------------------------ |
| FastAPI    | 0.109.0 | High-performance Python API    |
| Pydantic   | 2.5.3   | Data validation/serialization  |
| httpx      | 0.26.0  | Async HTTP client (for Ollama) |
| Ollama     | Latest  | Local LLM (llama3.2)           |

### Infrastructure

| Technology     | Purpose                       |
| -------------- | ----------------------------- |
| Docker Compose | Multi-container orchestration |
| MongoDB 7      | Document database             |
| Redis 7        | Caching & message queue       |
| Judge0 1.13.1  | Code execution sandbox        |
| GitHub Actions | CI/CD pipeline                |

---

## 3. Project Structure

```
InterviewPrepAI/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # CI/CD pipeline
├── frontend/                        # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── layout.tsx           # Root layout (Toaster, Skip link)
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── globals.css          # Design system (600+ lines)
│   │   │   ├── page.module.css      # Landing page styles
│   │   │   ├── admin/
│   │   │   │   ├── login/page.tsx   # Admin login
│   │   │   │   ├── dashboard/page.tsx # Interview management
│   │   │   │   └── interview/[id]/page.tsx # Interview detail + analytics
│   │   │   └── interview/
│   │   │       ├── join/page.tsx     # Candidate join form
│   │   │       └── session/[sessionId]/page.tsx # Interview session
│   │   ├── components/
│   │   │   └── CreateInterviewModal.tsx # Create interview form
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios client + all API calls
│   │   │   ├── socket.ts            # Socket.io client singleton
│   │   │   └── constants.ts         # Topics, languages, difficulties
│   │   ├── store/
│   │   │   └── index.ts             # Zustand stores (Auth, Interview, Theme)
│   │   └── types/
│   │       └── index.ts             # 180+ lines of TypeScript interfaces
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── backend/                         # Express Backend API
│   ├── src/
│   │   ├── server.ts                # Express + Socket.io entrypoint
│   │   ├── config/
│   │   │   ├── index.ts             # Centralized env config
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── models/
│   │   │   ├── Interview.ts         # Interview schema (questions, settings)
│   │   │   └── CandidateSession.ts  # Session schema (answers, proctoring)
│   │   ├── controllers/
│   │   │   └── interview.controller.ts # 400+ lines of business logic
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # Admin login/verify
│   │   │   └── interview.routes.ts  # All interview endpoints
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT auth guard
│   │   │   └── validation.middleware.ts # Zod validation + error handler
│   │   ├── validators/
│   │   │   └── interview.validator.ts # Zod schemas for all requests
│   │   ├── services/
│   │   │   ├── ai.service.ts        # HTTP client to AI service
│   │   │   └── judge0.service.ts    # HTTP client to Judge0
│   │   ├── socket/
│   │   │   └── handlers.ts          # Socket.io event handlers
│   │   └── utils/
│   │       └── logger.ts            # Winston logger
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── ai-service/                      # FastAPI AI Microservice
│   ├── main.py                      # FastAPI app + endpoints
│   ├── ollama_service.py            # LLM integration (300+ lines)
│   ├── models.py                    # Pydantic request/response models
│   ├── config.py                    # Settings via pydantic-settings
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml               # Full stack orchestration
├── README.md                        # Project overview
└── .gitignore
```

---

## 4. How It All Works

### 4.1 Interview Lifecycle (End-to-End Flow)

```
  ADMIN                      BACKEND                AI SERVICE              CANDIDATE
    │                           │                        │                       │
    │──── Create Interview ────▶│                        │                       │
    │     (title, topics,       │────── Generate ───────▶│                       │
    │      languages, config)   │       Questions        │                       │
    │                           │◀────── AI Questions ───│                       │
    │◀── Interview ID + Pass ───│        (via Ollama)    │                       │
    │                           │                        │                       │
    │     (shares ID & Pass     │                        │                       │
    │      with candidate)      │                        │                       │
    │                           │                        │         Join Interview │
    │                           │◀──────────────────────────────── (ID + Pass) ──│
    │                           │────────────────────────────────▶ Session Data  │
    │                           │                        │         + Questions   │
    │                           │                        │                       │
    │                           │                        │    Start Interview    │
    │                           │◀─────────────────────────────── (Timer Start) ─│
    │                           │                        │                       │
    │                           │                        │  Submit Code Answer   │
    │                           │◀─────────────────────────────── (code, lang) ──│
    │                           │───── Run Code ────────▶│                       │
    │                           │   (via Judge0)         │                       │
    │                           │───── Evaluate ────────▶│                       │
    │                           │◀── Score + Feedback ───│                       │
    │                           │────────────────────────────────▶ Score + AI    │
    │                           │                        │         Feedback      │
    │                           │                        │                       │
    │                           │    [Repeat per question]                       │
    │                           │                        │                       │
    │                           │                        │   Submit Interview    │
    │                           │◀──────────────────────────────────────────────│
    │                           │───── Final Eval ──────▶│                       │
    │                           │◀── Full Feedback ─────│                       │
    │                           │────────────────────────────────▶ Final Report  │
    │◀── Analytics Dashboard ───│                        │                       │
```

### 4.2 Component Interactions

#### Frontend State Management (Zustand)

| Store               | Purpose                  | Key Data                                                        |
| ------------------- | ------------------------ | --------------------------------------------------------------- |
| `useAuthStore`      | Admin login state        | `token`, `admin`, `isAuthenticated`                             |
| `useInterviewStore` | Active interview session | `questions`, `answers`, `timeRemaining`, `currentQuestionIndex` |
| `useThemeStore`     | Dark/Light mode toggle   | `isDark`                                                        |

#### Backend Controller Logic

The `interview.controller.ts` handles the entire interview lifecycle:

1. **`createInterview`** — Calls AI service to generate questions → saves Interview + Questions in MongoDB → returns interview ID & auto-generated password
2. **`joinInterview`** — Validates credentials → creates CandidateSession → returns session data + questions
3. **`startInterview`** — Sets session status to `in_progress`, records start time
4. **`submitAnswer`** — Receives code/text → runs code via Judge0 → evaluates via AI → saves answer with score
5. **`submitInterview`** — Generates final feedback via AI → calculates total score → marks session `evaluated`
6. **`executeCode`** — Sends source code to Judge0 → returns stdout/stderr/status/time/memory

#### AI Service Flow

The `ollama_service.py` uses structured prompts to enforce JSON output:

```
User Request → Prompt Construction → Ollama API Call → JSON Parsing → Validated Response
                                          │
                                  Uses llama3.2 model
                                  with structured system prompts
                                  that enforce JSON output format
```

**Fallback Logic**: If Ollama is unavailable, the service returns pre-built fallback questions/evaluations so the platform remains functional.

#### Proctoring System

```
Browser Tab Switch → visibilitychange event → Socket.io emit → Backend logs flag
                  → Toast warning to candidate
                  → Admin sees flag count in real-time
```

---

## 5. Setup & Installation

### 5.1 Prerequisites

| Software                    | Version | Required For             |
| --------------------------- | ------- | ------------------------ |
| **Node.js**                 | 20+     | Frontend + Backend       |
| **npm**                     | 10+     | Package management       |
| **Python**                  | 3.11+   | AI Service               |
| **Docker & Docker Compose** | Latest  | Full stack deployment    |
| **Ollama**                  | Latest  | Local AI inference       |
| **MongoDB**                 | 7.x     | Database (or use Docker) |
| **Git**                     | Latest  | Version control          |

### 5.2 Option A — Run Everything with Docker (Recommended)

This is the **easiest way** to get the full stack running with a single command.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/InterviewPrepAI.git
cd InterviewPrepAI

# 2. Install and start Ollama (runs on host machine, NOT in Docker)
# macOS:
brew install ollama
ollama serve                          # Start Ollama server (keep this running)
ollama pull llama3.2                  # Download the AI model (~2GB)

# 3. Start all services
docker compose up -d

# 4. Verify all containers are running
docker compose ps

# Expected output:
# interviewprepai-mongodb       ✅ Running  0.0.0.0:27017→27017
# interviewprepai-redis         ✅ Running  0.0.0.0:6379→6379
# interviewprepai-backend       ✅ Running  0.0.0.0:5000→5000
# interviewprepai-ai-service    ✅ Running  0.0.0.0:8000→8000
# interviewprepai-frontend      ✅ Running  0.0.0.0:3000→3000
# interviewprepai-judge0        ✅ Running  0.0.0.0:2358→2358
# interviewprepai-judge0-workers ✅ Running

# 5. Access the application
# Frontend:    http://localhost:3000
# Backend API: http://localhost:5000/api/health
# AI Service:  http://localhost:8000/docs
# Judge0:      http://localhost:2358
```

**To stop everything:**

```bash
docker compose down          # Stop all containers
docker compose down -v       # Stop + delete database volumes
```

### 5.3 Option B — Run Services Individually (For Development)

Use this approach when you need hot-reloading and debugging capabilities.

#### Step 1: Start Infrastructure (MongoDB + Redis)

```bash
# Option 1: Via Docker (recommended)
docker run -d --name mongo -p 27017:27017 mongo:7
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Option 2: Install natively
# MongoDB: https://www.mongodb.com/docs/manual/installation/
# Redis:   https://redis.io/docs/getting-started/
```

#### Step 2: Start Ollama (AI Engine)

```bash
# Install Ollama
brew install ollama              # macOS
# OR visit https://ollama.com for other OS

# Start Ollama server
ollama serve

# Pull the AI model (run in a separate terminal)
ollama pull llama3.2
```

#### Step 3: Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# Start in development mode (hot-reload)
npm run dev

# Expected output:
# ╔══════════════════════════════════════════════════╗
# ║      InterviewPrepAI Backend Server              ║
# ║  🚀 Server:    http://localhost:5000             ║
# ║  📡 Socket.io: ws://localhost:5000               ║
# ║  📊 MongoDB:   Connected                        ║
# ╚══════════════════════════════════════════════════╝
```

#### Step 4: Start the AI Service

```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate         # macOS/Linux
# OR: venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Start the service
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# API docs available at: http://localhost:8000/docs
```

#### Step 5: Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start in development mode
npm run dev

# Open: http://localhost:3000
```

#### Step 6 (Optional): Start Judge0 for Code Execution

```bash
# Judge0 requires Docker even in individual setup
docker run -d \
  --name judge0 \
  -p 2358:2358 \
  --privileged \
  judge0/judge0:1.13.1

docker run -d \
  --name judge0-workers \
  --privileged \
  judge0/judge0:1.13.1 \
  ./scripts/workers
```

#### Quick Verification Checklist

| Service           | URL                              | Expected Response                           |
| ----------------- | -------------------------------- | ------------------------------------------- |
| Frontend          | http://localhost:3000            | Landing page UI                             |
| Backend Health    | http://localhost:5000/api/health | `{"success":true}`                          |
| AI Service Health | http://localhost:8000/health     | `{"status":"healthy","ollama":"connected"}` |
| AI Docs           | http://localhost:8000/docs       | Swagger documentation                       |
| Judge0            | http://localhost:2358/about      | System info JSON                            |
| MongoDB           | `mongosh`                        | Connected shell                             |

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

| Variable         | Default                                     | Description                  |
| ---------------- | ------------------------------------------- | ---------------------------- |
| `NODE_ENV`       | `development`                               | Environment mode             |
| `PORT`           | `5000`                                      | Server port                  |
| `MONGODB_URI`    | `mongodb://localhost:27017/interviewprepai` | MongoDB connection string    |
| `REDIS_URL`      | `redis://localhost:6379`                    | Redis connection string      |
| `JWT_SECRET`     | `your-super-secret-jwt-key...`              | **⚠️ Change in production!** |
| `AI_SERVICE_URL` | `http://localhost:8000`                     | AI microservice URL          |
| `JUDGE0_URL`     | `http://localhost:2358`                     | Judge0 code execution URL    |
| `CORS_ORIGIN`    | `http://localhost:3000`                     | Allowed CORS origin          |
| `ADMIN_USERNAME` | `admin`                                     | Demo admin username          |
| `ADMIN_PASSWORD` | `admin123`                                  | Demo admin password          |

### Frontend (`frontend/.env.local`)

| Variable                     | Default                     | Description             |
| ---------------------------- | --------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`        | `http://localhost:5000/api` | Backend API base URL    |
| `NEXT_PUBLIC_WS_URL`         | `http://localhost:5000`     | Socket.io WebSocket URL |
| `NEXT_PUBLIC_AI_SERVICE_URL` | `http://localhost:8000`     | AI service URL          |

### AI Service (`ai-service/.env`)

| Variable          | Default                                     | Description        |
| ----------------- | ------------------------------------------- | ------------------ |
| `OLLAMA_BASE_URL` | `http://localhost:11434`                    | Ollama API URL     |
| `OLLAMA_MODEL`    | `llama3.2`                                  | LLM model to use   |
| `MONGODB_URI`     | `mongodb://localhost:27017/interviewprepai` | MongoDB connection |
| `ENVIRONMENT`     | `development`                               | Environment mode   |

---

## 7. API Reference

### Authentication

| Method | Endpoint                | Auth      | Description                     |
| ------ | ----------------------- | --------- | ------------------------------- |
| `POST` | `/api/auth/admin/login` | ❌        | Admin login (username/password) |
| `GET`  | `/api/auth/verify`      | 🔒 Bearer | Verify JWT token                |

### Admin Routes (Require JWT)

| Method | Endpoint                                | Auth | Description                              |
| ------ | --------------------------------------- | ---- | ---------------------------------------- |
| `POST` | `/api/interview/create`                 | 🔒   | Create interview + generate AI questions |
| `GET`  | `/api/interview/list`                   | 🔒   | List all interviews with pagination      |
| `GET`  | `/api/interview/:id`                    | ❌   | Get interview details + sessions         |
| `GET`  | `/api/interview/:id/session/:sessionId` | ❌   | Session analytics                        |

### Candidate Routes (Public)

| Method | Endpoint                          | Auth | Description                    |
| ------ | --------------------------------- | ---- | ------------------------------ |
| `POST` | `/api/interview/join`             | ❌   | Join interview (ID + password) |
| `POST` | `/api/interview/start/:sessionId` | ❌   | Start the timer                |
| `POST` | `/api/interview/submit-answer`    | ❌   | Submit answer for one question |
| `POST` | `/api/interview/submit`           | ❌   | Submit entire interview        |

### Proctoring & Code

| Method | Endpoint               | Auth | Description             |
| ------ | ---------------------- | ---- | ----------------------- |
| `POST` | `/api/proctoring/flag` | ❌   | Log proctoring event    |
| `POST` | `/api/code/execute`    | ❌   | Execute code via Judge0 |

### AI Service Endpoints

| Method | Endpoint              | Description                  |
| ------ | --------------------- | ---------------------------- |
| `GET`  | `/health`             | Service + Ollama health      |
| `POST` | `/generate-questions` | Generate interview questions |
| `POST` | `/evaluate-answer`    | Evaluate candidate answer    |
| `POST` | `/generate-feedback`  | Generate overall feedback    |
| `POST` | `/generate-followup`  | Generate follow-up questions |

---

## 8. Database Schema

### Interview Collection

```javascript
{
  interviewId: "ABC12345",          // 8-char unique code
  password: "auto-generated-hash",
  title: "Senior Frontend Interview",
  description: "...",
  topics: ["JavaScript", "React"],
  languages: ["javascript", "python"],
  difficulty: "medium",             // easy | medium | hard | mixed
  questionsPerTopic: 3,
  duration: 60,                     // minutes
  maxCandidates: 10,
  status: "active",                 // draft | active | completed | cancelled
  settings: {
    enableProctoring: true,
    enableCodeExecution: true,
    adaptiveDifficulty: true,
    maxTabSwitches: 3,
    requireCamera: false,
  },
  questions: [
    {
      id: "q_abc123",
      text: "Implement a binary search...",
      topic: "Algorithms",
      type: "coding",              // coding | conceptual | debugging
      difficulty: "medium",
      sampleCode: "function search() {...}",
      testCases: [{ input: "[1,2,3]", expectedOutput: "2" }],
      hints: ["Think divide and conquer..."],
      maxScore: 10,
    }
  ],
  createdAt: ISODate("..."),
}
```

### CandidateSession Collection

```javascript
{
  interviewId: ObjectId("..."),
  candidateName: "John Doe",
  candidateEmail: "john@example.com",
  status: "evaluated",             // joined | in_progress | submitted | evaluated
  startedAt: ISODate("..."),
  submittedAt: ISODate("..."),
  duration: 3240,                  // seconds
  totalScore: 72,
  maxPossibleScore: 100,
  percentageScore: 72,
  proctoringScore: 90,
  answers: [
    {
      questionId: "q_abc123",
      code: "function search(arr, t) {...}",
      textAnswer: "Binary search works by...",
      language: "javascript",
      timeTaken: 420,              // seconds
      aiEvaluation: {
        score: 8,
        codeQuality: 7,
        correctness: 9,
        efficiency: 8,
        explanation: 7,
        feedback: "Good approach with...",
        suggestions: ["Consider edge cases..."],
      },
      executionResults: { stdout, stderr, status, time, memory },
    }
  ],
  proctoringFlags: [
    { type: "tab_switch", timestamp, details, severity: "medium" }
  ],
  feedback: {
    overallFeedback: "...",
    strengths: ["Strong algorithmic thinking"],
    weaknesses: ["Could improve error handling"],
    topicWiseScores: [{ topic, score, maxScore }],
    hireRecommendation: 75,
  },
}
```

---

## 9. Real-time Events (Socket.io)

| Event                 | Direction       | Payload                                  | Description                |
| --------------------- | --------------- | ---------------------------------------- | -------------------------- |
| `join-interview`      | Client → Server | `{ interviewId, sessionId }`             | Candidate joins room       |
| `proctoring-event`    | Client → Server | `{ sessionId, type, details, severity }` | Tab switch / violation     |
| `answer-submitted`    | Client → Server | `{ sessionId, questionId, score }`       | Notify admin of submission |
| `interview-completed` | Client → Server | `{ sessionId }`                          | Interview finished         |
| `candidate-joined`    | Server → Admin  | `{ sessionId, candidateName }`           | New candidate notification |
| `proctor-alert`       | Server → Admin  | `{ sessionId, type, severity }`          | Real-time proctor alert    |

---

## 10. CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) runs on every push to `main` or `develop`:

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌──────────┐
│  Lint   │──▶│  Build  │──▶│  Test   │──▶│ Docker Build │──▶│  Deploy  │
│ (TS/Py) │   │ (FE/BE) │   │ (BE)    │   │ (3 images)  │   │ Vercel + │
│         │   │         │   │         │   │             │   │ Railway  │
└─────────┘   └─────────┘   └─────────┘   └─────────────┘   └──────────┘
```

---

## 11. Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

Set environment variables in Vercel dashboard:

- `NEXT_PUBLIC_API_URL` → your backend URL
- `NEXT_PUBLIC_WS_URL` → your backend URL

### Backend → Railway / Render / AWS

```bash
# Using Railway
npm i -g @railway/cli
railway login
railway init
railway up
```

### AI Service → Any Docker host

```bash
docker build -t interviewprepai-ai ./ai-service
docker run -d -p 8000:8000 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  interviewprepai-ai
```

---

## 12. Troubleshooting

| Issue                             | Cause                        | Fix                                                       |
| --------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `ECONNREFUSED :27017`             | MongoDB not running          | Start MongoDB: `docker run -d -p 27017:27017 mongo:7`     |
| `Ollama unavailable` in AI health | Ollama not running           | Run `ollama serve` in a terminal                          |
| `Model not found`                 | llama3.2 not downloaded      | Run `ollama pull llama3.2`                                |
| `CORS error` in browser           | Backend CORS_ORIGIN mismatch | Set `CORS_ORIGIN=http://localhost:3000` in backend `.env` |
| `Judge0 timeout`                  | Judge0 workers not running   | Ensure both judge0 containers are running                 |
| Frontend build fails              | TypeScript errors            | Run `npx next build` to see specific errors               |
| `useSearchParams` SSR error       | Missing Suspense boundary    | Already wrapped in `Suspense` — clear `.next` cache       |
| `admin_token` not persisting      | localStorage not available   | This is SSR — works only client-side                      |

### Useful Debug Commands

```bash
# Check service health
curl http://localhost:5000/api/health
curl http://localhost:8000/health

# View backend logs
docker compose logs -f backend

# View AI service logs
docker compose logs -f ai-service

# Check MongoDB
docker exec -it interviewprepai-mongodb mongosh

# Clear and restart
docker compose down -v && docker compose up -d --build
```

---

> **Important Production Notes:**
>
> - ⚠️ Replace demo admin credentials (`admin/admin123`) with a proper auth provider (NextAuth.js, Clerk, etc.)
> - ⚠️ Change `JWT_SECRET` to a strong, unique secret
> - ⚠️ Set `NODE_ENV=production` in deployment
> - ⚠️ Enable HTTPS for all services
> - ⚠️ Restrict CORS to your actual frontend domain
