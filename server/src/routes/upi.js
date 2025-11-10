import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

const router = Router();
router.use(authRequired);

// Mock link UPI
// In-memory OTP store for demo (clears on server restart)
const pendingLinks = new Map(); // key: `${userId}:${upiId}` -> otp

// Start linking: send mock OTP
router.post('/link/start', async (req, res) => {
  const { upiId } = req.body || {};
  if (!upiId) return res.status(400).json({ error: 'upiId required' });
  const otp = '123456'; // fixed OTP for demo
  pendingLinks.set(`${req.userId}:${upiId}`, otp);
  return res.json({ sent: true, upiId });
});

// Verify OTP and persist linkage to user.upiIds
router.post('/link/verify', async (req, res) => {
  const { upiId, otp } = req.body || {};
  if (!upiId || !otp) return res.status(400).json({ error: 'upiId and otp required' });
  const key = `${req.userId}:${upiId}`;
  const expected = pendingLinks.get(key);
  if (!expected || otp !== expected) return res.status(400).json({ error: 'Invalid or expired OTP' });
  pendingLinks.delete(key);
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $addToSet: { upiIds: upiId } },
    { new: true }
  );
  return res.json({ linked: true, upiIds: user.upiIds });
});

// Get linked UPI IDs for current user
router.get('/linked', async (req, res) => {
  const user = await User.findById(req.userId).select('upiIds');
  if (!user) return res.status(401).json({ error: 'auth' });
  return res.json({ upiIds: user.upiIds || [] });
});

// Mock fetch transactions and auto-create categorized expenses
router.post('/fetch', async (req, res) => {
  // Accept either query params or body
  const count = Number(req.query.count || req.body?.count || 6);
  const startStr = req.query.start || req.body?.start;
  const endStr = req.query.end || req.body?.end;
  const upiId = req.query.upiId || req.body?.upiId;

  const now = new Date();
  const end = endStr ? new Date(endStr) : now;
  const start = startStr ? new Date(startStr) : new Date(end.getTime() - 1000*60*60*24*30); // last 30 days

  // If upiId provided, ensure it's linked to the user; if none provided, ensure user has at least one linked id
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'auth' });
  const linked = user.upiIds || [];
  if (upiId) {
    if (!linked.includes(upiId)) return res.status(400).json({ error: 'UPI not linked' });
  }
  const effectiveUpi = upiId || linked[0];
  if (!effectiveUpi) return res.status(400).json({ error: 'No linked UPI. Link first.' });

  // Merchant → category mapping with realistic ranges
  const catalog = [
    { merchant: 'Zomato', category: 'Food', min: 150, max: 1200 },
    { merchant: 'Swiggy', category: 'Food', min: 150, max: 1200 },
    { merchant: 'Uber', category: 'Travel', min: 120, max: 800 },
    { merchant: 'Ola', category: 'Travel', min: 120, max: 800 },
    { merchant: 'JioFiber', category: 'Utilities', min: 399, max: 1499 },
    { merchant: 'Airtel', category: 'Utilities', min: 199, max: 999 },
    { merchant: 'Amazon', category: 'Shopping', min: 199, max: 4999 },
    { merchant: 'Flipkart', category: 'Shopping', min: 199, max: 4999 },
    { merchant: 'Netflix', category: 'Subscriptions', min: 149, max: 899 },
    { merchant: 'Spotify', category: 'Subscriptions', min: 59, max: 199 },
    { merchant: 'Croma', category: 'Electronics', min: 999, max: 14999 },
  ];

  const rand = (min, max) => Math.round(min + Math.random() * (max - min));
  const randDate = () => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

  const picks = Array.from({ length: Math.max(1, Math.min(count, 50)) }, () => catalog[rand(0, catalog.length-1)])
  const ops = picks.map((p, idx) => {
    const amount = rand(p.min, p.max);
    const date = randDate();
    const externalId = `${req.userId}:${effectiveUpi}:${p.merchant}:${amount}:${date.getTime()}`; // idempotent key
    return {
      updateOne: {
        filter: { externalId },
        update: {
          $setOnInsert: {
            user: req.userId,
            category: p.category,
            amount,
            date,
            notes: `${p.merchant} • ${effectiveUpi}`,
            source: 'upi',
            externalId,
          }
        },
        upsert: true,
      }
    }
  })

  const result = await Expense.bulkWrite(ops, { ordered: false }).catch(err => ({ error: err }));
  if (result?.error) return res.status(500).json({ error: 'Mock import failed' });

  // Fetch the latest created/updated items for the user in the range
  const items = await Expense.find({ user: req.userId, source: 'upi', date: { $gte: start, $lte: end }, notes: { $regex: effectiveUpi } }).sort({ date: -1 }).limit(100)
  const upserts = (result?.upsertedCount) ?? (result?.result?.upserted?.length || 0)
  res.json({ created: upserts, items, upiId: effectiveUpi })
});

export default router;
