import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// Simple in-memory user store for demo (replace with database)
const users = [
  {
    id: '1',
    email: 'admin@mdoner.gov.in',
    password: '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', // 'admin123'
    role: 'admin',
    name: 'System Administrator'
  },
  {
    id: '2',
    email: 'officer@mdoner.gov.in',
    password: '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', // 'officer123'
    role: 'officer',
    name: 'DPR Officer'
  }
];

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, accept any password that matches the pattern
    // In production, use proper bcrypt comparison
    const validPassword = password === 'admin123' || password === 'officer123';
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', (req: Request, res: Response) => {
  // This would normally use the auth middleware
  res.json({
    user: {
      id: '1',
      email: 'admin@mdoner.gov.in',
      role: 'admin',
      name: 'System Administrator'
    }
  });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;