import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
}

/**
 * Admin authentication middleware (JWT-based)
 */
export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
    req.admin = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Generate admin token (for demo purposes - in production, use proper auth)
 */
export const generateAdminToken = (adminId: string): string => {
  return jwt.sign(
    { id: adminId, role: 'admin' },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};
