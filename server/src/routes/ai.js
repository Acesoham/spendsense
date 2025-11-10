import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

const router = Router();
router.use(authRequired);

// POST /api/ai/insights -> returns suggestions using user's expenses (mock if no key)
router.post('/insights', async (req, res) => {
  try {
    const hasKey = Boolean(process.env.OPENAI_API_KEY);
    // In a real implementation, fetch user expenses here and analyze
    if (!hasKey) {
      return res.json({
        provider: 'mock',
        suggestions: [
          "You're spending 30% more on food than average users.",
          'Cutting down 10% on subscriptions could save ₹1200 monthly.',
        ],
      });
    }
    // Lazy import to avoid dependency issues if key absent
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = 'Analyze expenses and give 3 concise suggestions for saving in Indian Rupees.';
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    const text = resp.choices?.[0]?.message?.content || '';
    res.json({ provider: 'openai', suggestions: text.split('\n').filter(Boolean) });
  } catch (e) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/chat -> chat with context (mock by default)
router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  // If Grok (xAI) key is provided, use it first (has free-tier options sometimes)
  if (process.env.XAI_API_KEY) {
    try {
      const last30 = new Date(); last30.setDate(last30.getDate() - 30);
      const byCat = await Expense.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), date: { $gte: last30 } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]).catch(()=>[]);

      const system = 'You are a concise Indian personal finance assistant. Use ₹ and Indian numbering (₹1,23,456). Give actionable, specific suggestions.'
      const context = byCat.length ? `My last 30-day spend by category: ${byCat.map(c=>`${c._id}:${c.total}`).join(', ')}` : ''

      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.XAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.XAI_MODEL || 'grok-2-mini',
          messages: [
            { role: 'system', content: system },
            context ? { role: 'system', content: context } : undefined,
            { role: 'user', content: message }
          ].filter(Boolean),
          temperature: 0.3
        })
      });
      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content || 'No reply';
      return res.json({ provider: 'xai', reply });
    } catch (e) {
      // fall through to other providers
    }
  }

  // If OpenAI key is provided, use it
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Optionally include brief user spend summary as context
      const last30 = new Date(); last30.setDate(last30.getDate() - 30);
      // Optional aggregation included for future context use
      const byCat = await Expense.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), date: { $gte: last30 } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]).catch(()=>[]);

      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a concise Indian personal finance assistant. Use ₹ and Indian numbering (e.g., ₹1,23,456). Be actionable.'},
          { role: 'user', content: message }
        ],
        temperature: 0.4,
      });
      return res.json({ provider: 'openai', reply: resp.choices?.[0]?.message?.content || '' });
    } catch (e) {
      // Fall back to dynamic mock instead of failing the request
      // console.error('OpenAI chat error:', e?.response?.data || e.message)
    }
  }

  // Dynamic mock that uses user's expenses + question so the answer is not fixed
  try {
    const last30 = new Date(); last30.setDate(last30.getDate() - 30);
    const totals = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), date: { $gte: last30 } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]).catch(() => []);

    const overall = totals.reduce((a, b) => a + (b.total || 0), 0);
    const top = totals[0];
    const top2 = totals[1];
    const q = (message || '').toLowerCase();
    const tips = [];
    const inr = (n)=> new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n);

    // 1) Always reflect the question for variety
    tips.push(`Question understood: "${message}"`);

    // 2) Tailor based on categories actually present
    if (top) tips.push(`Your highest spend this month is in ${top._id} at ${inr(top.total)} (${Math.round((top.total/Math.max(overall,1))*100)}%). Set a monthly cap and track weekly.`);
    if (top2) tips.push(`Second highest is ${top2._id} at ${inr(top2.total)}. Target a 10–15% reduction using category-specific limits.`);

    // 3) Keyword-based guidance + capture matched keywords for debugging
    const matched = [];
    if (q.includes('food')) { tips.push('Food: batch cook on weekends, buy staples in bulk, and keep dining-out to a fixed weekly budget.'); matched.push('food'); }
    if (q.includes('travel') || q.includes('uber') || q.includes('ola')) { tips.push('Travel: prefer passes/metro, carpool, and cluster errands to reduce surge fares.'); matched.push('travel'); }
    if (q.includes('subscription')) { tips.push('Subscriptions: audit monthly, cancel rarely-used ones, and disable auto-renew where possible.'); matched.push('subscription'); }
    if (q.includes('rent')) { tips.push('Rent: negotiate at renewal, consider longer leases for concessions, and split utilities fairly.'); matched.push('rent'); }
    if (q.includes('utilities') || q.includes('electric') || q.includes('wifi')) { tips.push('Utilities: AC at 24–26°C, use timers, efficient plans, and LED lighting.'); matched.push('utilities'); }
    if (q.includes('debt') || q.includes('loan') || q.includes('emi')) { tips.push('Debt: list EMIs by rate; snowball high-interest first. Avoid new debt until utilisation <30%.'); matched.push('debt'); }
    if (q.includes('invest')) { tips.push('Investing: start/raise a monthly SIP into broad-market index funds; align with goals and maintain an emergency fund of 3–6 months expenses.'); matched.push('invest'); }
    if (q.includes('save') || q.includes('saving')) { tips.push('Savings: automate a transfer right after salary credit (pay-yourself-first). Start with 20% and adjust.'); matched.push('save'); }
    if (q.includes('goal') || q.includes('target') || q.includes('budget')) { tips.push('Budgets: create category-wise monthly limits and enable alerts at 80% utilisation.'); matched.push('budget'); }

    // 4) Add small variety using a pool of general suggestions and shuffle
    const misc = [
      'Use UPI cashback/credit-card offers only when aligned with planned purchases.',
      'Schedule a 10-minute weekly review to track category caps and upcoming bills.',
      'Export expenses monthly and spot recurring small leaks (snacks, rides, micro-subscriptions).',
      'Move surplus from low-use categories to a savings goal mid-month.'
    ]
    // Fisher–Yates shuffle
    for (let i = misc.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [misc[i], misc[j]] = [misc[j], misc[i]] }
    tips.push(...misc.slice(0,2))

    let reply;
    if (overall === 0) {
      reply = `I don't see expenses in the last 30 days yet. Add a few transactions, then ask again for personalised tips. Meanwhile: set a starter monthly budget and allocate 20% to savings.`;
    } else if (tips.length) {
      reply = tips.join('\n');
    } else {
      reply = `In the last 30 days you spent ${inr(overall)}. Reduce the top categories by 10% and set category-wise monthly limits.`;
    }

    // attach lightweight debug info to prove variation
    const debug = { matched, seed: Math.random().toString(36).slice(2,8), version: 'dm-2.3' }
    return res.json({ provider: 'dynamic-mock', reply, debug });
  } catch (e) {
    return res.json({ provider: 'mock', reply: 'Try cutting 10% from your top spend category and set weekly limits. Enable an AI API key for tailored responses.' });
  }
});

export default router;
