import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  type: 'coding' | 'mcq' | 'text' | 'system-design';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  sampleCode?: string;
  followUpQuestions?: string[];
  maxScore: number;
  timeLimit?: number; // in seconds
}

export interface IInterview extends Document {
  interviewId: string;
  password: string;
  title: string;
  description?: string;
  createdBy: string; // admin identifier
  topics: string[];
  languages: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionsPerTopic: number;
  customTopics?: string[];
  questions: IQuestion[];
  duration: number; // in minutes
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  dsaTopics?: { topic: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  settings: {
    enableProctoring: boolean;
    enableCodeExecution: boolean;
    enableCamera: boolean;
    enableScreenShare: boolean;
    adaptiveDifficulty: boolean;
    allowTabSwitch: boolean;
    maxTabSwitches: number;
  };
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['coding', 'mcq', 'text', 'system-design'],
    required: true,
  },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  language: String,
  testCases: [
    {
      input: String,
      expectedOutput: String,
      isHidden: { type: Boolean, default: false },
    },
  ],
  sampleCode: String,
  followUpQuestions: [String],
  maxScore: { type: Number, default: 10 },
  timeLimit: Number,
});


const InterviewSchema = new Schema<IInterview>(
  {
    interviewId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    createdBy: { type: String, required: true },
    topics: [{ type: String, required: true }],
    languages: [{ type: String, required: true }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      required: true,
    },
    questionsPerTopic: { type: Number, default: 3, min: 1, max: 20 },
    customTopics: [String],
    questions: [QuestionSchema],
    duration: { type: Number, required: true, min: 5, max: 300 },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    dsaTopics: [{
      topic: { type: String, required: true },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
    }],
    settings: {
      enableProctoring: { type: Boolean, default: true },
      enableCodeExecution: { type: Boolean, default: true },
      enableCamera: { type: Boolean, default: true },
      enableScreenShare: { type: Boolean, default: true },
      adaptiveDifficulty: { type: Boolean, default: true },
      allowTabSwitch: { type: Boolean, default: false },
      maxTabSwitches: { type: Number, default: 3 },
    },
    scheduledAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
InterviewSchema.index({ status: 1, createdAt: -1 });
InterviewSchema.index({ createdBy: 1, status: 1 });

export default mongoose.model<IInterview>('Interview', InterviewSchema);
