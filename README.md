# Expensiooo – AI-powered Expense Tracker (MERN)

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Zod
- Frontend: React (Vite), Tailwind CSS, Recharts
- AI: OpenAI API (optional; mocked if no key)
- UPI: Mock routes to simulate import & auto-categorization

## Setup
1) Server
```
cd server
copy .env.example .env   # set MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm run dev
```
API: http://localhost:5000/api

2) Client
```
cd client
copy .env.example .env   # set VITE_API_URL (default provided)
npm install
npm run dev
```
App: http://localhost:5173

## Features Ready
- Auth: `POST /api/auth/register`, `/login`, `/me` (get/patch/delete)
- Expenses CRUD: `/api/expenses` list/create, `/:id` patch/delete, summary `/summary/monthly`
- AI: `/api/ai/chat`, `/ai/insights` (mock if no key)
- UPI: `/api/upi/link`, `/api/upi/fetch` (mock adds sample expenses)
- Frontend pages: Home, About, Features, Register, Login, Dashboard (chart), Expenses (form+table+filters), Profile
- Dark/light mode toggle

## Notes
- Currency formatting uses Indian numbering system.
- Replace OpenAI with Gemini/HF by adjusting `server/src/routes/ai.js`.
- For production, use MongoDB Atlas and set proper CORS, HTTPS, and secrets.
