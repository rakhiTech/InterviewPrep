// ═══════════════════════════════════════
// Interview Types
// ═══════════════════════════════════════

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'coding' | 'mcq' | 'text' | 'system-design';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: string;
  testCases?: TestCase[];
  sampleCode?: string;
  followUpQuestions?: string[];
  maxScore: number;
  timeLimit?: number;
}

export interface InterviewSettings {
  enableProctoring: boolean;
  enableCodeExecution: boolean;
  enableCamera: boolean;
  enableScreenShare: boolean;
  adaptiveDifficulty: boolean;
  allowTabSwitch: boolean;
  maxTabSwitches: number;
}

export interface Interview {
  interviewId: string;
  title: string;
  description?: string;
  topics: string[];
  languages: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionsPerTopic: number;
  questions: Question[];
  duration: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  dsaTopics?: { topic: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  settings: InterviewSettings;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
}

// ═══════════════════════════════════════
// Session Types
// ═══════════════════════════════════════

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: string;
  time: string;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  input?: string;
  expectedOutput?: string;
  testCaseResults?: TestCaseResult[];
}


export interface AIEvaluation {
  score: number;
  codeQuality: number;
  correctness: number;
  explanationQuality: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface Answer {
  questionId: string;
  code?: string;
  textAnswer?: string;
  language?: string;
  executionResult?: ExecutionResult;
  aiEvaluation?: AIEvaluation;
  submittedAt: string;
  timeTaken: number;
}

export interface ProctoringFlag {
  type: 'tab_switch' | 'no_face' | 'multiple_faces' | 'suspicious_activity' | 'copy_paste';
  timestamp: string;
  details?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface Feedback {
  overallFeedback: string;
  topicWiseScores: TopicScore[];
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
}

export interface CandidateSession {
  _id: string;
  interviewId: string;
  candidateName: string;
  candidateEmail?: string;
  answers: Answer[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  status: 'joined' | 'in_progress' | 'submitted' | 'evaluated' | 'expired';
  proctoringFlags: ProctoringFlag[];
  proctoringScore: number;
  startedAt?: string;
  submittedAt?: string;
  duration?: number;
  currentQuestionIndex: number;
  feedback?: Feedback;
}

// ═══════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════

export interface CreateInterviewRequest {
  title: string;
  description?: string;
  topics: string[];
  languages: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionsPerTopic: number;
  customTopics?: string[];
  dsaTopics?: { topic: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  duration: number;
  settings?: Partial<InterviewSettings>;
}

export interface JoinInterviewRequest {
  interviewId: string;
  password: string;
  candidateName: string;
  candidateEmail?: string;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  code?: string;
  textAnswer?: string;
  language?: string;
  timeTaken: number;
}

export interface ExecuteCodeRequest {
  sourceCode: string;
  languageId: number;
  sessionId?: string;
  questionId?: string;
  stdin?: string;
  expectedOutput?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field: string; message: string }[];
}
