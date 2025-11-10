import { useState } from 'react'
import { api } from '../lib/api'

export default function ChatbotModal({ open, onClose }) {
  const [input, setInput] = useState('How can I save more this month?')
  const [reply, setReply] = useState('')
  const [provider, setProvider] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (!open) return null

  const ask = async () => {
    setLoading(true)
    try {
      setError('')
      const r = await api.post('/ai/chat', { message: input })
      setReply(r.reply)
      setProvider(r.provider || '')
    } catch (e) {
      setError(e?.response?.data?.error || 'AI request failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">AI Assistant</h3>
          <button onClick={onClose}>✖</button>
        </div>
        <textarea className="w-full h-24 p-2 rounded-md bg-transparent border" value={input} onChange={e=>setInput(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary" onClick={ask} disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</button>
          <button className="h-10 px-3 border rounded-md" onClick={()=>setReply('')}>Clear</button>
        </div>
        {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        {reply && (
          <div className="mt-4 whitespace-pre-wrap text-sm opacity-90">
            {provider && <div className="mb-2 text-xs opacity-60">Provider: {provider}</div>}
            {reply}
          </div>
        )}
      </div>
    </div>
  )
}
