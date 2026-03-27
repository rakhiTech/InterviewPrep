# InterviewPrepAI — User Guide 👤

> A step-by-step guide for **Admins (Interviewers)** and **Candidates**  
> **Version:** 1.0.0 | **Last Updated:** March 27, 2026

---

## Table of Contents

1. [What is InterviewPrepAI?](#1-what-is-interviewprepai)
2. [Roles Overview](#2-roles-overview)
3. [For Admins / Interviewers](#3-for-admins--interviewers)
   - [3.1 — Log In](#31--log-in)
   - [3.2 — Create an Interview](#32--create-an-interview)
   - [3.3 — Share Interview with Candidates](#33--share-interview-with-candidates)
   - [3.4 — Monitor from Dashboard](#34--monitor-from-dashboard)
   - [3.5 — View Candidate Results](#35--view-candidate-results)
4. [For Candidates](#4-for-candidates)
   - [4.1 — Join an Interview](#41--join-an-interview)
   - [4.2 — Start the Interview](#42--start-the-interview)
   - [4.3 — Answer Questions](#43--answer-questions)
   - [4.4 — Run Your Code](#44--run-your-code)
   - [4.5 — Submit Individual Answers](#45--submit-individual-answers)
   - [4.6 — Submit the Interview](#46--submit-the-interview)
   - [4.7 — View Your Results](#47--view-your-results)
5. [Features in Detail](#5-features-in-detail)
   - [AI Question Generation](#51-ai-question-generation)
   - [Code Editor (Monaco)](#52-code-editor-monaco)
   - [Real-time Code Execution](#53-real-time-code-execution)
   - [AI Evaluation & Feedback](#54-ai-evaluation--feedback)
   - [Proctoring](#55-proctoring)
   - [Adaptive Difficulty](#56-adaptive-difficulty)
6. [Supported Languages](#6-supported-languages)
7. [Tips for Best Results](#7-tips-for-best-results)
8. [FAQ](#8-faq)

---

## 1. What is InterviewPrepAI?

**InterviewPrepAI** is an AI-powered technical interview platform that helps:

- **Interviewers** create coding interviews in minutes with AI-generated questions
- **Candidates** practice and take interviews with a full code editor, real-time code execution, and instant AI feedback

The entire system runs on **open-source technologies** — no subscription fees, no external API costs. The AI runs locally on your machine via [Ollama](https://ollama.com).

### Key Highlights

| Feature         | How It Works                                                             |
| --------------- | ------------------------------------------------------------------------ |
| 🤖 AI Questions | AI dynamically generates interview questions based on topics you choose  |
| 💻 Code Editor  | A VS Code-grade editor (Monaco) right in your browser                    |
| ⚡ Run Code     | Execute code in 10+ languages instantly and see the output               |
| 🧠 AI Scoring   | Each answer is scored by AI on correctness, code quality, and efficiency |
| 🛡️ Proctoring   | Tab switches and suspicious activity are logged automatically            |
| 📊 Analytics    | Detailed per-candidate reports with strengths, weaknesses, and scores    |

---

## 2. Roles Overview

| Role                    | What They Do                                                             | Access                                           |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| **Admin / Interviewer** | Creates interviews, selects topics, monitors candidates, reviews results | Login required (username + password)             |
| **Candidate**           | Joins an interview with a code, answers questions, writes code           | No account needed — just Interview ID + Password |

---

## 3. For Admins / Interviewers

### 3.1 — Log In

1. Navigate to the platform homepage (e.g., `http://localhost:3000`)
2. Click **"Admin Login"** in the top-right corner
3. Enter your credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
     > ⚠️ These are demo credentials. Your admin may have set custom credentials.
4. Click **"Sign In"**
5. You'll be redirected to the **Admin Dashboard**

---

### 3.2 — Create an Interview

1. On the Dashboard, click the **"+ New Interview"** button (top right)
2. Fill in the interview form:

| Field                      | What to Enter                                  | Example                                     |
| -------------------------- | ---------------------------------------------- | ------------------------------------------- |
| **Title** _(required)_     | A descriptive name for the interview           | "Senior React Developer — Round 1"          |
| **Description**            | Brief description or instructions              | "Focus on React hooks and state management" |
| **Topics** _(required)_    | Click topic chips to select them               | JavaScript, React, System Design            |
| **Custom Topics**          | Type comma-separated additional topics         | "GraphQL, Docker, CI/CD"                    |
| **Languages** _(required)_ | Which programming languages candidates can use | JavaScript, Python, TypeScript              |
| **Difficulty**             | Overall difficulty level                       | Easy / Medium / Hard / Mixed                |
| **Questions per Topic**    | Number of AI-generated questions per topic     | 3 (generates 3 × number of topics)          |
| **Duration**               | Time limit in minutes                          | 60                                          |
| **Max Candidates**         | Maximum allowed participants                   | 10                                          |

3. Configure **Settings:**

| Setting                  | What It Does                                                  |
| ------------------------ | ------------------------------------------------------------- |
| ✅ Enable Proctoring     | Tracks tab switches, suspicious activity                      |
| ✅ Enable Code Execution | Allows candidates to run their code                           |
| ✅ Adaptive Difficulty   | AI adjusts follow-up question difficulty based on performance |

4. Click **"Create Interview"**
5. The system will:
   - Send your configuration to the AI service
   - AI generates questions using the Ollama LLM
   - Save everything to the database
   - Display the **Interview Credentials:**

```
┌──────────────────────────────────┐
│  🎉 Interview Created!           │
│                                   │
│  Interview ID: ABC12345           │
│  Password:     x7kP9m2L           │
│  Join Link:    http://...         │
│                                   │
│  [📋 Copy]  [📋 Copy]  [📋 Copy] │
└──────────────────────────────────┘
```

6. **Copy** these details and share them with your candidates

---

### 3.3 — Share Interview with Candidates

Send candidates the following information (via email, Slack, etc.):

```
📋 Interview Details
═════════════════════
Interview: Senior React Developer — Round 1
Interview ID: ABC12345
Password: x7kP9m2L
Join Link: http://localhost:3000/interview/join?id=ABC12345

Instructions:
1. Open the Join Link above
2. Enter the Interview ID and Password
3. Enter your name (and optionally email)
4. Click "Join Interview"
5. Read the instructions, then click "Begin Interview"
6. You have 60 minutes to complete all questions
```

---

### 3.4 — Monitor from Dashboard

Your **Admin Dashboard** shows:

```
┌──────────────────────────────────────────────────┐
│  Dashboard                                        │
│                                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────────┐  │
│  │  5   │ │  2   │ │  3   │ │       12       │  │
│  │Total │ │Active│ │Done  │ │Total Candidates│  │
│  └──────┘ └──────┘ └──────┘ └────────────────┘  │
│                                                    │
│  Interviews                                        │
│  ┌────────────────────────────────────────────┐   │
│  │ Senior React Developer — Round 1           │   │
│  │ Topics: JavaScript, React  | Medium | 60m  │   │
│  │ Status: ● Active | 3 candidates            │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │ Python Backend Assessment                   │   │
│  │ Topics: Python, SQL  | Hard | 90m          │   │
│  │ Status: ● Completed | 5 candidates         │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

- Click on any interview card to see **detailed analytics**

---

### 3.5 — View Candidate Results

Clicking on an interview opens the **Interview Detail** page:

**Analytics Summary:**
| Metric | Value |
|--------|-------|
| Total Candidates | 5 |
| Completed | 4 |
| In Progress | 1 |
| Average Score | 68% |

**Candidate Table:**

| Name          | Status         | Score           | Proctoring     | Flags      | Duration |
| ------------- | -------------- | --------------- | -------------- | ---------- | -------- |
| Alice Johnson | ✅ Evaluated   | **82%** (41/50) | ████████░░ 80% | 🟢 Clean   | 48 min   |
| Bob Smith     | ✅ Evaluated   | **65%** (32/50) | ██████░░░░ 60% | 🔴 2 flags | 55 min   |
| Carol Davis   | 🟡 In Progress | —               | —              | —          | —        |

**Click on any candidate** to see:

- **Overall Score** (large percentage display)
- **AI-generated Feedback** (strengths, weaknesses, recommendations)
- **Topic-wise Score Breakdown** (progress bars per topic)
- **Proctoring Flags** (tab switch timestamps, severity levels)

---

## 4. For Candidates

### 4.1 — Join an Interview

1. Open the **Join Link** provided by your interviewer
   - OR navigate to the platform and click **"Join Interview"**
2. Enter the following:

| Field                         | What to Enter                                          |
| ----------------------------- | ------------------------------------------------------ |
| **Interview ID** _(required)_ | The code shared by your interviewer (e.g., `ABC12345`) |
| **Password** _(required)_     | The password shared by your interviewer                |
| **Your Name** _(required)_    | Your full name                                         |
| **Email** _(optional)_        | Your email address                                     |

3. Click **"Join Interview"**
4. You'll be taken to the **Pre-Start Screen**

---

### 4.2 — Start the Interview

On the **Pre-Start Screen**, you'll see:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│  Senior React Developer — Round 1                 │
│  Focus on React hooks and state management         │
│                                                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ 60 min  │  │ 9 Qs     │  │ JS, React, Design│ │
│  │Duration │  │Questions │  │Topics            │ │
│  └─────────┘  └──────────┘  └──────────────────┘ │
│                                                    │
│  📋 Before You Begin:                              │
│  ✅ Ensure stable internet connection              │
│  ✅ Camera and microphone may be monitored         │
│  ⚠️ Tab switching will be recorded                 │
│  ⏱️ Timer will start once you click Begin          │
│  📝 You can navigate between questions             │
│                                                    │
│  [ 🚀 Begin Interview ]                           │
│                                                    │
└──────────────────────────────────────────────────┘
```

> ⚠️ **Important:** The timer starts immediately when you click **"Begin Interview"** — make sure you're ready!

---

### 4.3 — Answer Questions

Once the interview starts, your screen is split into three areas:

```
┌───────────────────────────────────────────────────────────────────┐
│ Interview Title       Q3/9          ⏱️ 45:20           [Submit] │
├───────────────────┬───────────────────────────────────────────────┤
│  QUESTION PANEL   │  EDITOR PANEL                                │
│                   │                                               │
│  [1][2][3][4]...  │  [ 💻 Code ]  [ 📝 Text ]    [Language ▼]  │
│                   │                                               │
│  🟡 Medium        │  ┌─────────────────────────────────────────┐ │
│  📌 React         │  │                                         │ │
│  💻 coding        │  │    Your code goes here...               │ │
│                   │  │    (Monaco Editor with IntelliSense)     │ │
│  "Implement a     │  │                                         │ │
│   custom React    │  │                                         │ │
│   hook that..."   │  └─────────────────────────────────────────┘ │
│                   │                                               │
│  Test Cases:      │  OUTPUT PANEL                                │
│  Input: [1,2,3]   │  ┌─────────────────────────────────────────┐ │
│  Expected: 6      │  │  Run your code to see output here       │ │
│                   │  │                          [▶ Run] [✓ Sub] │ │
│  [← Prev] [Next→] │  └─────────────────────────────────────────┘ │
├───────────────────┴───────────────────────────────────────────────┤
│  Progress: ████████████░░░░░░░░░░  33%                           │
└───────────────────────────────────────────────────────────────────┘
```

#### Left Panel — Question

- **Question Number Buttons** — Click to navigate between questions (answered ones turn green)
- **Difficulty Badge** — Easy (green) / Medium (yellow) / Hard (red)
- **Topic Badge** — The topic area of the question
- **Type Badge** — coding / conceptual / debugging
- **Question Text** — The actual question to answer
- **Test Cases** — Sample inputs and expected outputs

#### Right Panel — Editor

Two tabs available:

| Tab                | When to Use                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **💻 Code**        | Write your code solution. Full Monaco Editor with IntelliSense, syntax highlighting, and auto-complete |
| **📝 Text Answer** | Write a text explanation (for conceptual questions or to explain your approach)                        |

**Language Selector** — Choose your preferred programming language from the dropdown (JavaScript, Python, TypeScript, Java, C++, Go, Rust)

---

### 4.4 — Run Your Code

1. Write your code in the editor
2. Click **"▶ Run Code"** in the output panel
3. The code is sent to a secure sandbox (Judge0) and executed
4. Results appear in the output panel:

```
┌─────────────────────────────────────────────────┐
│  ✅ Accepted                                     │
│                                                   │
│  stdout:                                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ 6                                           │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Time: 0.012s    Memory: 3.2 KB                  │
└─────────────────────────────────────────────────┘
```

If there's an error:

```
┌─────────────────────────────────────────────────┐
│  ❌ Compilation Error                            │
│                                                   │
│  stderr:                                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ SyntaxError: Unexpected token '}'           │ │
│  │   at line 5                                 │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

> 💡 **Tip:** You can run your code as many times as you want before submitting!

---

### 4.5 — Submit Individual Answers

When you're satisfied with your answer for a question:

1. Click **"✓ Submit Answer"**
2. The AI evaluates your answer and displays:

```
┌─────────────────────────────────────────────────┐
│  🧠 AI Evaluation                                │
│                                                   │
│  Score: 8/10                                      │
│  Code Quality: 7/10                               │
│  Correctness: 9/10                                │
│                                                   │
│  "Good implementation! Your approach correctly    │
│   handles edge cases. Consider using memoization  │
│   for better performance."                        │
│                                                   │
│  🧠 AI Follow-up Questions:                      │
│  • How would you handle infinite re-renders?      │
│  • What's the time complexity of your solution?   │
└─────────────────────────────────────────────────┘
```

3. Navigate to the next question using **"Next →"** or the number buttons

---

### 4.6 — Submit the Interview

When you've answered all questions (or when time runs out):

1. Click **"Submit Interview"** (red button in the top-right)
2. Confirm: "Are you sure? You cannot go back."
3. The system generates your final AI evaluation report

> ⚠️ If time runs out (timer reaches 0), the interview is **automatically submitted**.

---

### 4.7 — View Your Results

After submission, you'll see your **Results Screen:**

```
┌──────────────────────────────────────────────┐
│                                                │
│              🎉  (or 👍 or 📚)                │
│                                                │
│          Interview Complete                    │
│                                                │
│              ╭───────╮                         │
│              │  72%  │                         │
│              │ 36/50 │                         │
│              ╰───────╯                         │
│                                                │
│  🧠 AI Feedback                                │
│  "Strong performance on coding problems.       │
│   Good understanding of React fundamentals.    │
│   Room for improvement in system design."      │
│                                                │
│  ✅ Strengths:                                 │
│  • Excellent algorithmic thinking              │
│  • Clean, readable code style                  │
│  • Good use of ES6+ features                   │
│                                                │
│  📌 Areas to Improve:                          │
│  • Edge case handling                          │
│  • Time complexity optimization                │
│  • System design patterns                      │
│                                                │
│  [ 🏠 Return Home ]                           │
│                                                │
└──────────────────────────────────────────────┘
```

| Score Emoji | Score Range   |
| ----------- | ------------- |
| 🎉          | 70% and above |
| 👍          | 40% — 69%     |
| 📚          | Below 40%     |

---

## 5. Features in Detail

### 5.1 AI Question Generation

When an admin creates an interview, the AI generates questions automatically:

- **Coding Questions** — Write a working solution (e.g., "Implement a debounce function")
- **Conceptual Questions** — Explain a concept (e.g., "Explain the event loop in JavaScript")
- **Debugging Questions** — Find and fix bugs in given code

The AI considers:

- Selected **topics** (React, Node.js, SQL, etc.)
- Chosen **difficulty** level
- Preferred **programming languages**
- Number of questions per topic

### 5.2 Code Editor (Monaco)

The editor is the same engine used in **Visual Studio Code**:

| Feature             | Description                          |
| ------------------- | ------------------------------------ |
| Syntax Highlighting | Full language-aware coloring         |
| IntelliSense        | Auto-complete suggestions            |
| Error Detection     | Real-time syntax error markers       |
| Multiple Languages  | Switch languages from the dropdown   |
| Dark Theme          | Comfortable for long coding sessions |
| Word Wrap           | No horizontal scrolling              |

### 5.3 Real-time Code Execution

Code runs in a **secure, sandboxed environment** (Judge0):

- ✅ No access to the filesystem
- ✅ No network access from within the code
- ✅ Memory and time limits enforced
- ✅ Supports 10+ programming languages

### 5.4 AI Evaluation & Feedback

Each submitted answer is evaluated on:

| Criteria         | Weight | What It Measures                                  |
| ---------------- | ------ | ------------------------------------------------- |
| **Correctness**  | High   | Does the code produce the right output?           |
| **Code Quality** | Medium | Is the code clean, readable, and well-structured? |
| **Efficiency**   | Medium | Time and space complexity of the solution         |
| **Explanation**  | Low    | Quality of the text explanation (if provided)     |

Final interview report includes:

- Overall percentage score
- Topic-wise breakdown
- Strengths and weaknesses
- Specific improvement suggestions

### 5.5 Proctoring

If enabled by the admin:

| Event Tracked   | How It's Detected                                  |
| --------------- | -------------------------------------------------- |
| **Tab Switch**  | Browser `visibilitychange` event                   |
| **Window Blur** | When candidate clicks outside the interview window |

When detected:

- ⚠️ A warning toast appears for the candidate
- 📊 The event is logged with a timestamp and severity
- 🔴 Admin can see flag count and details in the dashboard

> Default max allowed tab switches: **3** (configurable by admin)

### 5.6 Adaptive Difficulty

When enabled:

- AI analyzes candidate performance on submitted answers
- If the candidate scores well → follow-up questions are harder
- If the candidate struggles → follow-up questions are easier
- This provides a more accurate assessment of the candidate's skill ceiling

---

## 6. Supported Languages

| Language   | Code Execution | Editor Support |
| ---------- | :------------: | :------------: |
| JavaScript |       ✅       |       ✅       |
| TypeScript |       ✅       |       ✅       |
| Python     |       ✅       |       ✅       |
| Java       |       ✅       |       ✅       |
| C++        |       ✅       |       ✅       |
| C          |       ✅       |       ✅       |
| Go         |       ✅       |       ✅       |
| Rust       |       ✅       |       ✅       |
| Ruby       |       ✅       |       ✅       |
| PHP        |       ✅       |       ✅       |

---

## 7. Tips for Best Results

### For Admins

- ✅ Be specific with topic selection — "React Hooks" is better than just "React"
- ✅ Use **Mixed** difficulty to get a range of easy to hard questions
- ✅ Set a realistic duration — 60 min for 6-9 questions is a good baseline
- ✅ Enable **Adaptive Difficulty** for better candidate assessment
- ✅ Review proctoring flags alongside scores for a complete picture

### For Candidates

- ✅ Read each question **completely** before coding
- ✅ Run your code **before** submitting — verify it works
- ✅ Use the **Text Answer** tab to explain your approach (even for coding questions)
- ✅ Don't switch tabs — it's being monitored!
- ✅ Navigate between questions — you don't have to answer them in order
- ✅ If stuck, move on and come back — manage your time wisely
- ✅ Use proper variable names and write clean code — AI evaluates code quality

---

## 8. FAQ

### General

**Q: Is this free?**  
A: Yes. InterviewPrepAI is fully open-source. The AI runs locally via Ollama — no API keys or subscription needed.

**Q: Does it work offline?**  
A: You need a network connection to connect to the backend, but all AI processing runs locally on the server.

**Q: What AI model does it use?**  
A: By default, **llama3.2** via Ollama. The admin can configure a different model if preferred.

### For Admins

**Q: Can I customize questions manually?**  
A: Currently, questions are AI-generated based on your topic/difficulty selection. You can add custom topics for more specific question generation.

**Q: How many candidates can take an interview simultaneously?**  
A: You can set the `maxCandidates` per interview (default: 10). The system can handle more with proper infrastructure scaling.

**Q: Can I see candidate answers in real-time?**  
A: The dashboard shows real-time events (joined, submitted, proctoring flags) via Socket.io. Full answers are visible after submission.

### For Candidates

**Q: Can I go back to a previous question?**  
A: Yes! Click the numbered buttons at the top of the question panel to navigate between questions freely.

**Q: What happens if I lose internet?**  
A: Your answers are stored locally in your browser. When the connection restores, you can continue. However, the timer continues server-side.

**Q: Can I use my own IDE?**  
A: No. You must use the built-in Monaco editor. This ensures fair evaluation and proctoring integrity.

**Q: What if the code doesn't run?**  
A: Check for syntax errors. Try running simpler code first. If Judge0 is unavailable, you can still submit your code and text answer for AI evaluation.

---

> **Need Help?**  
> Open an issue on GitHub or contact the admin who shared your interview link.

---

_Built with ❤️ using Next.js, Express, FastAPI, Ollama, and Judge0_
