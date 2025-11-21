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
  // Recurring fields (monthly only for now)
  isRecurring: z.boolean().optional(),
  recurringStart: z.coerce.date().optional(),
  recurringEnd: z.coerce.date().optional(),
  recurringRule: z.enum(['monthly', 'weekly', 'yearly']).optional(),
});

const sameMonth = (a, b) => a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const startOfMonthUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const startOfWeekUTC = (d) => { const day = d.getUTCDay(); const diff = (day + 6) % 7; const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); dt.setUTCDate(dt.getUTCDate() - diff); return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())); };
const sameWeek = (a, b) => startOfWeekUTC(a).getTime() === startOfWeekUTC(b).getTime();
const weekKey = (d) => { const s = startOfWeekUTC(d); return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(s.getUTCDate()).padStart(2, '0')}` };
const sameYear = (a, b) => a.getUTCFullYear() === b.getUTCFullYear();
const yearKey = (d) => `${d.getUTCFullYear()}`;

router.use(authRequired);

router.post('/', async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);

    // If not recurring, behave as usual
    if (!data.isRecurring) {
      const exp = await Expense.create({ ...data, user: req.userId });
      return res.status(201).json({ expense: exp });
    }

    // Recurring template creation
    const recurringStart = data.recurringStart ? new Date(data.recurringStart) : new Date(data.date);
    const recurringEnd = data.recurringEnd ? new Date(data.recurringEnd) : undefined;
    const rule = data.recurringRule || 'monthly';

    const template = await Expense.create({
      user: req.userId,
      category: data.category,
      amount: data.amount,
      // Store date as the start date for reference
      date: recurringStart,
      notes: data.notes,
      source: data.source ?? 'manual',
      isRecurring: true,
      isTemplate: true,
      recurringRule: rule,
      recurringStart,
      recurringEnd,
      lastRunAt: undefined,
    });

    // Create first occurrence immediately if start period is current period
    const now = new Date();
    let firstOccurrence = null;
    if (rule === 'monthly') {
      const currentMonthStart = startOfMonthUTC(now);
      const startMonthStart = startOfMonthUTC(recurringStart);
      if (sameMonth(currentMonthStart, startMonthStart)) {
        const key = monthKey(currentMonthStart);
        const extId = `rec:${template._id.toString()}:${key}`;
        firstOccurrence = await Expense.findOneAndUpdate(
          { externalId: extId },
          {
            user: req.userId,
            category: data.category,
            amount: data.amount,
            date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), recurringStart.getUTCDate() || 1)),
            notes: data.notes,
            source: data.source ?? 'manual',
            isRecurring: true,
            isTemplate: false,
            parentId: template._id,
            externalId: extId,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        await Expense.updateOne({ _id: template._id }, { $set: { lastRunAt: now } });
      }
    } else if (rule === 'weekly') {
      if (sameWeek(now, recurringStart)) {
        const key = weekKey(now);
        const extId = `rec:${template._id.toString()}:${key}`;
        const occDate = new Date(Date.UTC(startOfWeekUTC(now).getUTCFullYear(), startOfWeekUTC(now).getUTCMonth(), startOfWeekUTC(now).getUTCDate() + (recurringStart.getUTCDay() || 0)));
        firstOccurrence = await Expense.findOneAndUpdate(
          { externalId: extId },
          {
            user: req.userId,
            category: data.category,
            amount: data.amount,
            date: occDate,
            notes: data.notes,
            source: data.source ?? 'manual',
            isRecurring: true,
            isTemplate: false,
            parentId: template._id,
            externalId: extId,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        await Expense.updateOne({ _id: template._id }, { $set: { lastRunAt: now } });
      }
    } else if (rule === 'yearly') {
      if (sameYear(now, recurringStart) && now.getUTCMonth() === recurringStart.getUTCMonth()) {
        const key = yearKey(now);
        const extId = `rec:${template._id.toString()}:${key}`;
        const occDate = new Date(Date.UTC(now.getUTCFullYear(), recurringStart.getUTCMonth(), recurringStart.getUTCDate() || 1));
        firstOccurrence = await Expense.findOneAndUpdate(
          { externalId: extId },
          {
            user: req.userId,
            category: data.category,
            amount: data.amount,
            date: occDate,
            notes: data.notes,
            source: data.source ?? 'manual',
            isRecurring: true,
            isTemplate: false,
            parentId: template._id,
            externalId: extId,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        await Expense.updateOne({ _id: template._id }, { $set: { lastRunAt: now } });
      }
    }

    return res.status(201).json({ template, firstOccurrence });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Create failed' });
  }
});

router.get('/', async (req, res) => {
  const { category, q, start, end, page = 1, limit = 20 } = req.query;
  const where = { user: req.userId, isTemplate: { $ne: true } };
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

router.get('/recurring', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { user: req.userId, isTemplate: true };
  const [items, total] = await Promise.all([
    Expense.find(where).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
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
    { $match: { user: new (await import('mongoose')).default.Types.ObjectId(user), isTemplate: { $ne: true } } },
    { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  res.json({ data: agg });
});

export default router;
