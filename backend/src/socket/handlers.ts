import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import CandidateSession from '../models/CandidateSession';

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join interview room
    socket.on('join-interview', async (data: { interviewId: string; sessionId: string }) => {
      const { interviewId, sessionId } = data;
      socket.join(`interview:${interviewId}`);
      socket.join(`session:${sessionId}`);

      // Notify admin
      io.to(`interview:${interviewId}`).emit('candidate-joined', {
        sessionId,
        timestamp: new Date(),
      });

      logger.info(`Socket ${socket.id} joined interview ${interviewId}`);
    });

    // Admin joins interview monitoring room
    socket.on('admin-join', (data: { interviewId: string }) => {
      socket.join(`interview:${data.interviewId}`);
      socket.join(`admin:${data.interviewId}`);
      logger.info(`Admin joined interview monitoring: ${data.interviewId}`);
    });

    // Real-time code updates (for admin monitoring)
    socket.on('code-update', (data: {
      interviewId: string;
      sessionId: string;
      questionId: string;
      code: string;
      language: string;
    }) => {
      io.to(`admin:${data.interviewId}`).emit('candidate-code-update', {
        sessionId: data.sessionId,
        questionId: data.questionId,
        code: data.code,
        language: data.language,
        timestamp: new Date(),
      });
    });

    // Proctoring events
    socket.on('proctoring-event', async (data: {
      sessionId: string;
      interviewId: string;
      type: string;
      details?: string;
      severity: string;
    }) => {
      try {
        const session = await CandidateSession.findById(data.sessionId);
        if (session) {
          session.proctoringFlags.push({
            type: data.type as any,
            timestamp: new Date(),
            details: data.details,
            severity: data.severity as any,
          });

          const deduction = data.severity === 'high' ? 10 : data.severity === 'medium' ? 5 : 2;
          session.proctoringScore = Math.max(0, session.proctoringScore - deduction);
          await session.save();

          // Notify admin in real-time
          io.to(`admin:${data.interviewId}`).emit('proctoring-alert', {
            sessionId: data.sessionId,
            type: data.type,
            details: data.details,
            severity: data.severity,
            proctoringScore: session.proctoringScore,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        logger.error('Proctoring event error:', error);
      }
    });

    // Interview timer sync
    socket.on('timer-sync', (data: {
      interviewId: string;
      timeRemaining: number;
    }) => {
      io.to(`interview:${data.interviewId}`).emit('timer-update', {
        timeRemaining: data.timeRemaining,
      });
    });

    // Question navigation
    socket.on('question-change', (data: {
      interviewId: string;
      sessionId: string;
      questionIndex: number;
    }) => {
      io.to(`admin:${data.interviewId}`).emit('candidate-question-change', {
        sessionId: data.sessionId,
        questionIndex: data.questionIndex,
        timestamp: new Date(),
      });
    });

    // Answer submitted notification
    socket.on('answer-submitted', (data: {
      interviewId: string;
      sessionId: string;
      questionId: string;
      score: number;
    }) => {
      io.to(`admin:${data.interviewId}`).emit('candidate-answer-submitted', {
        sessionId: data.sessionId,
        questionId: data.questionId,
        score: data.score,
        timestamp: new Date(),
      });
    });

    // Interview completed
    socket.on('interview-completed', (data: {
      interviewId: string;
      sessionId: string;
    }) => {
      io.to(`admin:${data.interviewId}`).emit('candidate-completed', {
        sessionId: data.sessionId,
        timestamp: new Date(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
