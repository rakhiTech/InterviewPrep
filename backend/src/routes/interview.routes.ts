import { Router } from 'express';
import {
  createInterview,
  getInterview,
  listInterviews,
  joinInterview,
  startInterview,
  submitAnswer,
  submitInterview,
  logProctoringFlag,
  executeCode,
  getSessionAnalytics,
  getTopicSuggestions,
} from '../controllers/interview.controller';
import { validate } from '../middleware/validation.middleware';
import { adminAuth } from '../middleware/auth.middleware';
import {
  createInterviewSchema,
  joinInterviewSchema,
  submitAnswerSchema,
  submitInterviewSchema,
  proctoringFlagSchema,
  executeCodeSchema,
} from '../validators/interview.validator';

const router = Router();

// ═══════════════════════════════
// Admin Routes (require auth)
// ═══════════════════════════════
router.post(
  '/interview/create',
  adminAuth,
  validate(createInterviewSchema),
  createInterview
);

router.get('/interview/list', adminAuth, listInterviews);

router.get('/interview/:id', getInterview);

router.get('/interview/:id/session/:sessionId', getSessionAnalytics);

// Topic Suggestions (Admin)
router.get('/topics/suggestions', adminAuth, getTopicSuggestions);

// ═══════════════════════════════
// Candidate Routes (public)
// ═══════════════════════════════
router.post(
  '/interview/join',
  validate(joinInterviewSchema),
  joinInterview
);

router.post('/interview/start/:sessionId', startInterview);

router.post(
  '/interview/submit-answer',
  validate(submitAnswerSchema),
  submitAnswer
);

router.post(
  '/interview/submit',
  validate(submitInterviewSchema),
  submitInterview
);

// ═══════════════════════════════
// Proctoring
// ═══════════════════════════════
router.post(
  '/proctoring/flag',
  validate(proctoringFlagSchema),
  logProctoringFlag
);

// ═══════════════════════════════
// Code Execution
// ═══════════════════════════════
router.post(
  '/code/execute',
  validate(executeCodeSchema),
  executeCode
);

export default router;
