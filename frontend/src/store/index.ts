import { create } from 'zustand';
import type { Interview, Question, CandidateSession, Answer } from '@/types';

// ═══════════════════════════════
// Auth Store
// ═══════════════════════════════
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  admin: { id: string; username: string; role: string } | null;
  login: (token: string, admin: { id: string; username: string; role: string }) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  admin: null,
  login: (token, admin) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
    set({ isAuthenticated: true, token, admin });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    set({ isAuthenticated: false, token: null, admin: null });
  },
  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        set({ isAuthenticated: true, token });
      }
    }
  },
}));

// ═══════════════════════════════
// Interview Store (Candidate)
// ═══════════════════════════════
interface InterviewState {
  sessionId: string | null;
  interview: {
    title: string;
    description?: string;
    duration: number;
    topics: string[];
    languages: string[];
    settings: Interview['settings'];
  } | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, { code?: string; textAnswer?: string; language?: string }>;
  timeRemaining: number;
  isStarted: boolean;
  isCompleted: boolean;

  setSession: (sessionId: string, interview: InterviewState['interview'], questions: Question[]) => void;
  startInterview: (duration: number) => void;
  setCurrentQuestion: (index: number) => void;
  updateAnswer: (questionId: string, data: { code?: string; textAnswer?: string; language?: string }) => void;
  decrementTime: () => void;
  completeInterview: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  interview: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  timeRemaining: 0,
  isStarted: false,
  isCompleted: false,

  setSession: (sessionId, interview, questions) =>
    set({ sessionId, interview, questions }),

  startInterview: (duration) =>
    set({ isStarted: true, timeRemaining: duration * 60 }),

  setCurrentQuestion: (index) =>
    set({ currentQuestionIndex: index }),

  updateAnswer: (questionId, data) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, { ...newAnswers.get(questionId), ...data });
      return { answers: newAnswers };
    }),

  decrementTime: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    })),

  completeInterview: () =>
    set({ isCompleted: true }),

  reset: () =>
    set({
      sessionId: null,
      interview: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      timeRemaining: 0,
      isStarted: false,
      isCompleted: false,
    }),
}));

// ═══════════════════════════════
// Theme Store
// ═══════════════════════════════
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true,
  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      }
      return { isDark: newIsDark };
    }),
  setTheme: (isDark) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    set({ isDark });
  },
}));
