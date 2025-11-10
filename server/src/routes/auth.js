import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({ username: data.username, email: data.email, passwordHash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ user });
});

router.patch('/me', authRequired, async (req, res) => {
  const { username } = req.body;
  const user = await User.findByIdAndUpdate(req.userId, { username }, { new: true });
  res.json({ user });
});

router.delete('/me', authRequired, async (req, res) => {
  await User.findByIdAndDelete(req.userId);
  res.json({ ok: true });
});

export default router;
