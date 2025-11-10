import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatINR } from '../utils/format'
import UPILinkModal from '../ui/UPILinkModal'

export default function Expenses(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ category: 'Food', amount: '', date: new Date().toISOString().slice(0,10), notes: '' })
  const [filters, setFilters] = useState({ q: '', category: '', start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [upiOnly, setUpiOnly] = useState(false)
  const [importCount, setImportCount] = useState(6)
  const [importStart, setImportStart] = useState('')
  const [importEnd, setImportEnd] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')
  const [openLink, setOpenLink] = useState(false)
  const [linked, setLinked] = useState([])
  const [selectedUpi, setSelectedUpi] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/expenses', filters)
      setItems(r.items)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])
  useEffect(()=>{
    (async()=>{
      try { const r = await api.get('/upi/linked'); setLinked(r.upiIds||[]); if ((r.upiIds||[]).length && !selectedUpi) setSelectedUpi(r.upiIds[0]) } catch {}
    })()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const amountNum = Number(form.amount)
      if (!form.category || !form.date || Number.isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please provide valid category, date, and a positive amount.')
      }
      const body = { ...form, amount: amountNum, date: new Date(form.date) }
      await api.post('/expenses', body)
      setForm({ ...form, amount: '', notes: '' })
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => { await api.del(`/expenses/${id}`); await load() }

  const displayed = useMemo(()=> upiOnly ? items.filter(it=>it.source==='upi') : items, [items, upiOnly])
  const total = useMemo(()=> displayed.reduce((a,b)=>a + b.amount, 0), [displayed])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid gap-6">
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Add Expense</h3>
        {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
        <form onSubmit={submit} className="grid md:grid-cols-5 gap-2">
          <input className="p-2 border rounded-md bg-transparent" placeholder="Category" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" type="date" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} />
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
        </form>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <input className="p-2 border rounded-md bg-transparent" placeholder="Search" value={filters.q} onChange={e=>setFilters(f=>({...f, q:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" placeholder="Category" value={filters.category} onChange={e=>setFilters(f=>({...f, category:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" type="date" value={filters.start} onChange={e=>setFilters(f=>({...f, start:e.target.value}))} />
          <input className="p-2 border rounded-md bg-transparent" type="date" value={filters.end} onChange={e=>setFilters(f=>({...f, end:e.target.value}))} />
          <button className="h-10 px-3 border rounded-md" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Filter'}</button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={upiOnly} onChange={e=>setUpiOnly(e.target.checked)} /> UPI only
          </label>
          <div className="text-sm opacity-80">Total: <b>{formatINR(total)}</b></div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr><th className="p-2">Date</th><th className="p-2">Category</th><th className="p-2">Amount</th><th className="p-2">Notes</th><th></th></tr>
            </thead>
            <tbody>
              {displayed.map(it => (
                <tr key={it._id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2">{new Date(it.date).toLocaleDateString()}</td>
                  <td className="p-2">{it.category}</td>
                  <td className="p-2">{formatINR(it.amount)}</td>
                  <td className="p-2">{it.notes}</td>
                  <td className="p-2 text-right">
                    <button className="h-8 px-3 border rounded-md" onClick={()=>remove(it._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-2">UPI Import (mock)</h3>
        <div className="flex flex-wrap items-end gap-2">
          <button className="h-10 px-3 border rounded-md" onClick={()=>setOpenLink(true)}>Link UPI</button>
          <select className="p-2 border rounded-md bg-transparent" value={selectedUpi} onChange={e=>setSelectedUpi(e.target.value)}>
            <option value="">Select linked UPI</option>
            {linked.map(id=> <option key={id} value={id}>{id}</option>)}
          </select>
          <input className="p-2 border rounded-md bg-transparent w-28" type="number" min="1" max="50" value={importCount} onChange={e=>setImportCount(e.target.value)} placeholder="Count" />
          <input className="p-2 border rounded-md bg-transparent" type="date" value={importStart} onChange={e=>setImportStart(e.target.value)} placeholder="Start" />
          <input className="p-2 border rounded-md bg-transparent" type="date" value={importEnd} onChange={e=>setImportEnd(e.target.value)} placeholder="End" />
          <button className="h-10 px-3 border rounded-md" onClick={async()=>{ await api.post('/upi/fetch', { count: Number(importCount)||6, start: importStart||undefined, end: importEnd||undefined, upiId: selectedUpi||undefined }); await load() }}>Fetch Transactions</button>
          {linkMsg && <div className="text-sm opacity-80">{linkMsg}</div>}
        </div>
      </div>
      <UPILinkModal open={openLink} onClose={()=>setOpenLink(false)} onLinked={(upiId, all)=>{ setLinked(all||[upiId]); setSelectedUpi(upiId); setLinkMsg(`Linked: ${upiId}`) }} />
    </div>
  )
}
