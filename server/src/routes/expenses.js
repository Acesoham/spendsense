import { Router } from 'express';
import { z } from 'zod';
import Expense from '../models/Expense.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.coerce.date(),
  notes: z.string().optional(),
  source: z.enum(['manual', 'upi']).optional(),
});

router.use(authRequired);

router.post('/', async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const exp = await Expense.create({ ...data, user: req.userId });
    res.status(201).json({ expense: exp });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Create failed' });
  }
});

router.get('/', async (req, res) => {
  const { category, q, start, end, page = 1, limit = 20 } = req.query;
  const where = { user: req.userId };
  if (category) where.category = category;
  if (start || end) where.date = { ...(start ? { $gte: new Date(start) } : {}), ...(end ? { $lte: new Date(end) } : {}) };
  if (q) where.$or = [{ notes: { $regex: q, $options: 'i' } }, { category: { $regex: q, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Expense.find(where).sort({ date: -1 }).skip(skip).limit(Number(limit)),
    Expense.countDocuments(where),
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

router.patch('/:id', async (req, res) => {
  try {
    const data = expenseSchema.partial().parse(req.body);
    const exp = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.userId }, data, { new: true });
    if (!exp) return res.status(404).json({ error: 'Not found' });
    res.json({ expense: exp });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  const exp = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!exp) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/summary/monthly', async (req, res) => {
  const user = req.userId;
  const agg = await Expense.aggregate([
    { $match: { user: new (await import('mongoose')).default.Types.ObjectId(user) } },
    { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  res.json({ data: agg });
});

export default router;
