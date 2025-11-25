import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to safely get user ID
const getUserId = (req) => {
  try {
    return req.userId ? new mongoose.Types.ObjectId(req.userId) : null;
  } catch (e) {
    return null;
  }
};

const router = Router();
// Only protect specific routes that need authentication
router.use('/insights', authRequired);

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

// POST /api/ai/chat -> chat with Gemini AI
router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  // Check if we have a valid API key
  const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('Gemini API Key check:', {
    hasKey: !!geminiApiKey,
    keyLength: geminiApiKey.length,
    keyStartsWith: geminiApiKey ? geminiApiKey.substring(0, 5) + '...' : 'N/A'
  });
  
  if (geminiApiKey && geminiApiKey !== 'your_actual_gemini_api_key_here') {
    try {
      console.log('Initializing Gemini client...');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 1,
          topK: 40,
          maxOutputTokens: 1000,
        },
      });
      
      let expenseContext = '';
      const userId = getUserId(req);

      if (userId) {
        try {
          // Try to get user's recent expenses for context if user is logged in
          const last30 = new Date(); 
          last30.setDate(last30.getDate() - 30);
          
          const expenses = await Expense.find({
            user: userId,
            date: { $gte: last30 }
          }).sort({ date: -1 }).limit(50);

          if (expenses.length > 0) {
            expenseContext = `User's recent expenses (${expenses.length} transactions, last 30 days):\n` +
              expenses.map(e => `- ${e.amount} INR for ${e.description} (${e.category}) on ${e.date.toISOString().split('T')[0]}`).join('\n');
          } else {
            expenseContext = 'No recent expense data available. ';
          }
        } catch (error) {
          console.error('Error fetching expenses:', error);
          expenseContext = 'Unable to fetch expense data. ';
        }
      } else {
        expenseContext = 'User is not logged in. ';
      }

      let prompt = `You are a helpful financial assistant for SpendSense. `;
      
      if (userId) {
        if (expenseContext.includes('No recent expense data') || expenseContext.includes('Unable to fetch')) {
          prompt += "The user is logged in but doesn't have any expense data recorded yet. ";
        } else if (expenseContext) {
          prompt += `Here's the user's spending context:\n${expenseContext}\n\n`;
        }
      } else {
        prompt += 'The user is not logged in, so I cannot access their expense data. ';
      }
      
      prompt += `User's question: ${message}
      
      Please provide a helpful, concise response in a friendly tone. `;
      
      if (userId) {
        prompt += 'If the question is about spending patterns or financial advice and you have expense data, use it. ';
      }
      
      prompt += 'Otherwise, provide general financial advice. ';
      prompt += 'If the user asks about features that require login (like viewing their expenses), gently suggest they create an account or log in.';

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return res.json({
        provider: 'gemini-pro',
        reply: text
      });
    } catch (error) {
      console.error('Gemini API error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? Object.keys(error.config.headers) : 'No headers'
        },
        stack: error.stack
      });
      // Fall through to mock response
    }
  }

  // Fallback to mock response if no valid Gemini key or if there's an error
  console.log('Using mock response - no valid Gemini API key found');
  
  // Simple mock response based on common questions
  const mockResponses = {
    'how can i save money': "Start by tracking all your expenses to see where your money is going. Then, create a budget and look for areas where you can cut back, like dining out or subscriptions you don't use.",
    'what is spendsense': "SpendSense is a personal finance app that helps you track your expenses, set budgets, and get insights into your spending habits to help you save more money.",
    'how to track expenses': "You can track expenses by adding them manually in the app. Try to log every expense, no matter how small, to get a complete picture of your spending."
  };
  
  // Find a matching mock response or use a default one
  const lowerMessage = message.toLowerCase();
  let reply = "I'm here to help with financial advice. You can ask me about saving money, budgeting, or how to use SpendSense.";
  
  for (const [key, response] of Object.entries(mockResponses)) {
    if (lowerMessage.includes(key)) {
      reply = response;
      break;
    }
  }
  
  return res.json({
    provider: 'mock',
    reply: reply
  });
  
  // Keep the old fallback code in case we need it
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
