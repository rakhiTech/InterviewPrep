import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewprepai',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  judge0Url: process.env.JUDGE0_URL || 'http://localhost:2358',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

export default config;
