import { Router, Request, Response } from 'express';
import { generateAdminToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * Admin login (simplified for demo - in production, use proper auth)
 * POST /auth/admin/login
 */
router.post('/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Demo credentials - replace with proper authentication in production
  const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = generateAdminToken('admin-001');

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: 'admin-001',
          username,
          role: 'admin',
        },
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials',
  });
});

/**
 * Verify admin token
 * GET /auth/verify
 */
router.get('/verify', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config').default;
    const decoded = jwt.verify(token, config.jwtSecret);

    return res.json({
      success: true,
      data: decoded,
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

export default router;
