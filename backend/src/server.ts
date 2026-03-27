import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import config from './config';
import connectDB from './config/database';
import logger from './utils/logger';
import interviewRoutes from './routes/interview.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middleware/validation.middleware';
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ═══════════════════════════════
// Middleware
// ═══════════════════════════════
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.http(message.trim()) },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api/', limiter);

// ═══════════════════════════════
// Routes
// ═══════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'InterviewPrepAI API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api', interviewRoutes);
app.use('/api/auth', authRoutes);

// ═══════════════════════════════
// Error Handling
// ═══════════════════════════════
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════
// Socket.io
// ═══════════════════════════════
setupSocketHandlers(io);

// ═══════════════════════════════
// Start Server
// ═══════════════════════════════
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║      InterviewPrepAI Backend Server              ║
║──────────────────────────────────────────────────║
║  🚀 Server:    http://localhost:${config.port}           ║
║  📡 Socket.io: ws://localhost:${config.port}             ║
║  🔧 Env:       ${config.nodeEnv.padEnd(31)}║
║  📊 MongoDB:   Connected                        ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
