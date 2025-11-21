import { useEffect, useMemo, useState } from 'react'

const SYMBOLS = [
  'USD','EUR','INR','GBP','JPY','AUD','CAD','CHF','CNY','HKD','SGD','SEK','NZD','ZAR','AED','SAR','THB','MYR','KRW'
]

export default function Currency(){
  const [amount, setAmount] = useState(1)
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('INR')
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({ provider: '', updated: '' })

  const convert = useMemo(()=>{
    if (!rate) return ''
    const out = Number(amount||0) * rate
    return Number.isFinite(out) ? out.toFixed(4) : ''
  }, [amount, rate])

  const fetchRate = async () => {
    setLoading(true); setError('')
    try {
      if (from === to) { setRate(1); setMeta({ provider: 'local', updated: new Date().toISOString() }); return }

      // Provider 1: exchangerate.host
      const tryExchangerateHost = async () => {
        const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`
        const r = await fetch(url)
        if (!r.ok) throw new Error('exchangerate.host HTTP error')
        const data = await r.json()
        const next = data?.rates?.[to]
        if (!next) throw new Error('exchangerate.host: rate missing')
        setRate(next)
        setMeta({ provider: 'exchangerate.host', updated: data?.date || new Date().toISOString() })
      }

      // Provider 2: frankfurter.app
      const tryFrankfurter = async () => {
        const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        const r = await fetch(url)
        if (!r.ok) throw new Error('frankfurter.app HTTP error')
        const data = await r.json()
        const next = data?.rates?.[to]
        if (!next) throw new Error('frankfurter.app: rate missing')
        setRate(next)
        setMeta({ provider: 'frankfurter.app', updated: data?.date || new Date().toISOString() })
      }

      // Provider 3: open.er-api.com (returns all rates for base)
      const tryOpenER = async () => {
        const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`
        const r = await fetch(url)
        if (!r.ok) throw new Error('open.er-api.com HTTP error')
        const data = await r.json()
        const next = data?.rates?.[to]
        if (!next) throw new Error('open.er-api.com: rate missing')
        setRate(next)
        setMeta({ provider: 'open.er-api.com', updated: data?.time_last_update_utc || new Date().toISOString() })
      }

      // Try in order with fallbacks
      await tryExchangerateHost().catch(async ()=>{
        await tryFrankfurter().catch(async ()=>{
          await tryOpenER()
        })
      })
    } catch (e) {
      setError(e.message || 'Error fetching exchange rate')
      setRate(null)
      setMeta({ provider: '', updated: '' })
    } finally { setLoading(false) }
  }

  useEffect(()=>{ fetchRate() }, [from, to])

  return (
    <div className="max-w-2xl mx-auto card p-4">
      <h2 className="text-xl font-semibold mb-4">Currency Exchange</h2>
      {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm opacity-70 mb-1">Amount</label>
          <input className="p-2 border rounded-md bg-transparent w-full" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm opacity-70 mb-1">From</label>
          <select className="p-2 border rounded-md bg-transparent w-full" value={from} onChange={e=>setFrom(e.target.value)}>
            {SYMBOLS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm opacity-70 mb-1">To</label>
          <select className="p-2 border rounded-md bg-transparent w-full" value={to} onChange={e=>setTo(e.target.value)}>
            {SYMBOLS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm opacity-70 mb-1">&nbsp;</label>
          <button className="btn btn-primary w-full" onClick={fetchRate} disabled={loading}>{loading ? 'Fetching…' : 'Update Rate'}</button>
        </div>
      </div>

      <div className="mt-5 text-lg">
        {rate !== null && (
          <div>
            <div className="opacity-80 text-sm mb-1">Rate: 1 {from} = {rate} {to}{meta.provider && ` • via ${meta.provider}`}{meta.updated && ` • ${meta.updated}`}</div>
            <div><b>{amount || 0} {from}</b> = <b>{convert} {to}</b></div>
          </div>
        )}
      </div>
    </div>
  )
}
