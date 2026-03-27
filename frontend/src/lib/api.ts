import axios from 'axios';
import type {
  ApiResponse,
  CreateInterviewRequest,
  JoinInterviewRequest,
  SubmitAnswerRequest,
  ExecuteCodeRequest,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ═══════════════════════════════
// Auth APIs
// ═══════════════════════════════
export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse>('/auth/admin/login', { username, password }),

  verify: () => api.get<ApiResponse>('/auth/verify'),
};

// ═══════════════════════════════
// Interview APIs
// ═══════════════════════════════
export const interviewApi = {
  create: (data: CreateInterviewRequest) =>
    api.post<ApiResponse>('/interview/create', data),

  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse>('/interview/list', { params }),

  get: (id: string) => api.get<ApiResponse>(`/interview/${id}`),

  getSessionAnalytics: (interviewId: string, sessionId: string) =>
    api.get<ApiResponse>(`/interview/${interviewId}/session/${sessionId}`),

  getTopicSuggestions: (q: string) =>
    api.get<ApiResponse>('/topics/suggestions', { params: { q } }),
};

// ═══════════════════════════════
// Candidate APIs
// ═══════════════════════════════
export const candidateApi = {
  join: (data: JoinInterviewRequest) =>
    api.post<ApiResponse>('/interview/join', data),

  start: (sessionId: string) =>
    api.post<ApiResponse>(`/interview/start/${sessionId}`),

  submitAnswer: (data: SubmitAnswerRequest) =>
    api.post<ApiResponse>('/interview/submit-answer', data),

  submitInterview: (sessionId: string) =>
    api.post<ApiResponse>('/interview/submit', { sessionId }),
};

// ═══════════════════════════════
// Code Execution APIs
// ═══════════════════════════════
export const codeApi = {
  execute: (data: ExecuteCodeRequest) =>
    api.post<ApiResponse>('/code/execute', data),
};

// ═══════════════════════════════
// Proctoring APIs
// ═══════════════════════════════
export const proctoringApi = {
  logFlag: (data: {
    sessionId: string;
    type: string;
    details?: string;
    severity: string;
  }) => api.post<ApiResponse>('/proctoring/flag', data),
};

export default api;
