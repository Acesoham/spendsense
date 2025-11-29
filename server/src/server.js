import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import aiRoutes from './routes/ai.js';
import upiRoutes from './routes/upi.js';
import Expense from './models/Expense.js';

dotenv.config();

// Debug: Log environment variables (hiding sensitive data)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '*** Key exists ***' : 'No key found',
  MONGODB_URI: process.env.MONGODB_URI ? '*** MongoDB URI configured ***' : 'No MongoDB URI',
  JWT_SECRET: process.env.JWT_SECRET ? '*** JWT secret configured ***' : 'No JWT secret'
});

const app = express();
app.use(cors({
  origin: ["https://spendsense.vercel.app"],  // your Vercel domain
  credentials: true}
));
app.use(express.json());
app.use(morgan('dev'));



app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upi', upiRoutes);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/expensiooo');
  (`${process.env.REACT_APP_API_URL}/api/users/login`, data);
  app.listen(PORT, () => console.log(`🚀 Server running on https://spendsense-mxqw.onrender.com:${PORT}`));

  // Simple daily scheduler for recurring expenses
  const startOfMonthUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const addMonthsUTC = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()))
  const startOfWeekUTC = (d) => { const day = d.getUTCDay(); const diff = (day + 6) % 7; const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); dt.setUTCDate(dt.getUTCDate() - diff); return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())); };
  const weekKey = (d) => { const s = startOfWeekUTC(d); return `${s.getUTCFullYear()}-${String(s.getUTCMonth()+1).padStart(2,'0')}-${String(s.getUTCDate()).padStart(2,'0')}` };
  const addWeeksUTC = (d, n) => { const s = startOfWeekUTC(d); const nd = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + 7*n)); return nd; };
  const startOfYearUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const yearKey = (d) => `${d.getUTCFullYear()}`;
  const addYearsUTC = (d, n) => new Date(Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()));

  const runRecurringMaterializer = async () => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonthUTC(now);
      const currentWeekStart = startOfWeekUTC(now);
      const currentYearStart = startOfYearUTC(now);

      // Find all recurring templates
      const templates = await Expense.find({
        isRecurring: true,
        isTemplate: true,
      });

      for (const t of templates) {
        const rule = t.recurringRule || 'monthly';
        const startRaw = new Date(t.recurringStart || t.date);
        const endRaw = t.recurringEnd ? new Date(t.recurringEnd) : null;

        if (rule === 'monthly') {
          const start = startOfMonthUTC(startRaw);
          const end = endRaw ? startOfMonthUTC(endRaw) : null;
          let genFrom = t.lastRunAt ? startOfMonthUTC(new Date(t.lastRunAt)) : start;
          while (genFrom <= currentMonthStart) {
            if (end && genFrom > end) break;
            const key = monthKey(genFrom);
            const extId = `rec:${t._id.toString()}:${key}`;
            await Expense.findOneAndUpdate(
              { externalId: extId },
              {
                user: t.user,
                category: t.category,
                amount: t.amount,
                date: new Date(Date.UTC(genFrom.getUTCFullYear(), genFrom.getUTCMonth(), startRaw.getUTCDate() || 1)),
                notes: t.notes,
                source: t.source || 'manual',
                isRecurring: true,
                isTemplate: false,
                parentId: t._id,
                externalId: extId,
              },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            genFrom = addMonthsUTC(genFrom, 1);
          }
        } else if (rule === 'weekly') {
          const start = startOfWeekUTC(startRaw);
          const end = endRaw ? startOfWeekUTC(endRaw) : null;
          let genFrom = t.lastRunAt ? startOfWeekUTC(new Date(t.lastRunAt)) : start;
          while (genFrom <= currentWeekStart) {
            if (end && genFrom > end) break;
            const key = weekKey(genFrom);
            const extId = `rec:${t._id.toString()}:${key}`;
            const dayOffset = (startRaw.getUTCDay() || 0);
            const occDate = new Date(Date.UTC(genFrom.getUTCFullYear(), genFrom.getUTCMonth(), genFrom.getUTCDate() + dayOffset));
            await Expense.findOneAndUpdate(
              { externalId: extId },
              {
                user: t.user,
                category: t.category,
                amount: t.amount,
                date: occDate,
                notes: t.notes,
                source: t.source || 'manual',
                isRecurring: true,
                isTemplate: false,
                parentId: t._id,
                externalId: extId,
              },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            genFrom = addWeeksUTC(genFrom, 1);
          }
        } else if (rule === 'yearly') {
          const start = startOfYearUTC(startRaw);
          const end = endRaw ? startOfYearUTC(endRaw) : null;
          let genFrom = t.lastRunAt ? startOfYearUTC(new Date(t.lastRunAt)) : start;
          while (genFrom <= currentYearStart) {
            if (end && genFrom > end) break;
            const key = yearKey(genFrom);
            const extId = `rec:${t._id.toString()}:${key}`;
            const occDate = new Date(Date.UTC(genFrom.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate() || 1));
            await Expense.findOneAndUpdate(
              { externalId: extId },
              {
                user: t.user,
                category: t.category,
                amount: t.amount,
                date: occDate,
                notes: t.notes,
                source: t.source || 'manual',
                isRecurring: true,
                isTemplate: false,
                parentId: t._id,
                externalId: extId,
              },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            genFrom = addYearsUTC(genFrom, 1);
          }
        }

        // mark processed
        await Expense.updateOne({ _id: t._id }, { $set: { lastRunAt: now } });
      }
    } catch (err) {
      console.error('Recurring materializer error:', err.message);
    }
  };

  // Run immediately at startup and then every 24 hours
  runRecurringMaterializer();
  setInterval(runRecurringMaterializer, 24 * 60 * 60 * 1000);
})();
