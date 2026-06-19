import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== config.admin.email || password !== config.admin.password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { email, name: 'SeaRock Admin' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { email, name: 'SeaRock Admin' },
  });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
