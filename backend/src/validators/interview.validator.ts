import { z } from 'zod';

export const createInterviewSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    topics: z.array(z.string()).min(1).max(10),
    languages: z.array(z.string()).min(1).max(10),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
    questionsPerTopic: z.number().int().min(1).max(20).default(3),
    customTopics: z.array(z.string()).optional(),
    duration: z.number().int().min(5).max(300),
    dsaTopics: z.array(z.object({
      topic: z.string(),
      difficulty: z.enum(['easy', 'medium', 'hard'])
    })).optional(),
    settings: z
      .object({
        enableProctoring: z.boolean().default(true),
        enableCodeExecution: z.boolean().default(true),
        enableCamera: z.boolean().default(true),
        enableScreenShare: z.boolean().default(true),
        adaptiveDifficulty: z.boolean().default(true),
        allowTabSwitch: z.boolean().default(false),
        maxTabSwitches: z.number().int().min(0).max(50).default(3),
      })
      .optional(),
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const joinInterviewSchema = z.object({
  body: z.object({
    interviewId: z.string().min(1),
    password: z.string().min(1),
    candidateName: z.string().min(2).max(100),
    candidateEmail: z.string().email().optional(),
    metadata: z
      .object({
        browser: z.string().optional(),
        os: z.string().optional(),
        screenResolution: z.string().optional(),
      })
      .optional(),
  }),
});

export const submitAnswerSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1),
    questionId: z.string().min(1),
    code: z.string().optional(),
    textAnswer: z.string().optional(),
    language: z.string().optional(),
    timeTaken: z.number().int().min(0),
  }),
});

export const submitInterviewSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1),
  }),
});

export const proctoringFlagSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1),
    type: z.enum([
      'tab_switch',
      'no_face',
      'multiple_faces',
      'suspicious_activity',
      'copy_paste',
    ]),
    details: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
});

export const executeCodeSchema = z.object({
  body: z.object({
    sourceCode: z.string().min(1),
    languageId: z.number().int(),
    sessionId: z.string().optional(),
    questionId: z.string().optional(),
    stdin: z.string().optional(),
    expectedOutput: z.string().optional(),
    timeLimit: z.number().optional(),
    memoryLimit: z.number().optional(),
  }),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>['body'];
export type JoinInterviewInput = z.infer<typeof joinInterviewSchema>['body'];
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>['body'];
export type ExecuteCodeInput = z.infer<typeof executeCodeSchema>['body'];
