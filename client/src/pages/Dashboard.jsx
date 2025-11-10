import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../state/AuthContext'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard({ onOpenChat }){
  const { user } = useAuth()
  const [summary, setSummary] = useState([])

  useEffect(() => {
    api.get('/expenses/summary/monthly').then(r => {
      const data = r.data.map(d => ({
        name: `${d._id.month}/${d._id.year}`,
        total: d.total
      }))
      setSummary(data)
    })
  }, [])

  const totalExpense = useMemo(() => summary.reduce((a,b)=>a+b.total,0), [summary])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-sm opacity-70">Total Income</div><div className="text-2xl font-semibold">₹0</div></div>
        <div className="card p-4"><div className="text-sm opacity-70">Total Expense</div><div className="text-2xl font-semibold">₹{totalExpense.toLocaleString('en-IN')}</div></div>
        <div className="card p-4"><div className="text-sm opacity-70">Remaining Balance</div><div className="text-2xl font-semibold">₹{-totalExpense.toLocaleString('en-IN')}</div></div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Monthly Expense</h3>
          <button className="h-9 px-3 border rounded-md" onClick={onOpenChat}>AI Chatbot</button>
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-sm opacity-80">Welcome, {user?.username}. Go to <Link className="underline" to="/expenses">Expense Logs</Link>.</div>
    </div>
  )
}
