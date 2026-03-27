import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  questionId: string;
  code?: string;
  textAnswer?: string;
  language?: string;
  executionResult?: {
    stdout: string;
    stderr: string;
    status: string;
    time: string;
    memory: number;
    testCasesPassed: number;
    totalTestCases: number;
  };
  aiEvaluation?: {
    score: number;
    codeQuality: number;
    correctness: number;
    explanationQuality: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  submittedAt: Date;
  timeTaken: number; // in seconds
}

export interface IProctoringFlag {
  type: 'tab_switch' | 'no_face' | 'multiple_faces' | 'suspicious_activity' | 'copy_paste';
  timestamp: Date;
  details?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ICandidateSession extends Document {
  interviewId: string;
  candidateName: string;
  candidateEmail?: string;
  answers: IAnswer[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  status: 'joined' | 'in_progress' | 'submitted' | 'evaluated' | 'expired';
  proctoringFlags: IProctoringFlag[];
  proctoringScore: number; // 0-100, higher is better
  startedAt?: Date;
  submittedAt?: Date;
  duration?: number; // actual time taken in seconds
  currentQuestionIndex: number;
  feedback?: {
    overallFeedback: string;
    topicWiseScores: {
      topic: string;
      score: number;
      maxScore: number;
      feedback: string;
    }[];
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
  };
  metadata: {
    browser: string;
    os: string;
    screenResolution: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: String, required: true },
  code: String,
  textAnswer: String,
  language: String,
  executionResult: {
    stdout: String,
    stderr: String,
    status: String,
    time: String,
    memory: Number,
    testCasesPassed: Number,
    totalTestCases: Number,
  },
  aiEvaluation: {
    score: Number,
    codeQuality: Number,
    correctness: Number,
    explanationQuality: Number,
    feedback: String,
    strengths: [String],
    improvements: [String],
  },
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number, default: 0 },
});

const ProctoringFlagSchema = new Schema<IProctoringFlag>({
  type: {
    type: String,
    enum: ['tab_switch', 'no_face', 'multiple_faces', 'suspicious_activity', 'copy_paste'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  details: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
});

const CandidateSessionSchema = new Schema<ICandidateSession>(
  {
    interviewId: {
      type: String,
      required: true,
      index: true,
    },
    candidateName: { type: String, required: true },
    candidateEmail: String,
    answers: [AnswerSchema],
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    percentageScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['joined', 'in_progress', 'submitted', 'evaluated', 'expired'],
      default: 'joined',
    },
    proctoringFlags: [ProctoringFlagSchema],
    proctoringScore: { type: Number, default: 100 },
    startedAt: Date,
    submittedAt: Date,
    duration: Number,
    currentQuestionIndex: { type: Number, default: 0 },
    feedback: {
      overallFeedback: String,
      topicWiseScores: [
        {
          topic: String,
          score: Number,
          maxScore: Number,
          feedback: String,
        },
      ],
      strengths: [String],
      weaknesses: [String],
      recommendedTopics: [String],
    },
    metadata: {
      browser: String,
      os: String,
      screenResolution: String,
      ipAddress: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CandidateSessionSchema.index({ interviewId: 1, status: 1 });
CandidateSessionSchema.index({ candidateEmail: 1 });

// Virtual for percentage calculation
CandidateSessionSchema.pre('save', function (next) {
  if (this.maxPossibleScore > 0) {
    this.percentageScore = Math.round(
      (this.totalScore / this.maxPossibleScore) * 100
    );
  }
  next();
});

export default mongoose.model<ICandidateSession>(
  'CandidateSession',
  CandidateSessionSchema
);
