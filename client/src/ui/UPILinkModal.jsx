import { useState } from 'react'
import { api } from '../lib/api'

export default function UPILinkModal({ open, onClose, onLinked }) {
  const [step, setStep] = useState(1)
  const [upiId, setUpiId] = useState('you@upi')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const start = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/upi/link/start', { upiId })
      setStep(2)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to start linking (login required)')
    } finally { setLoading(false) }
  }

  const verify = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/upi/link/verify', { upiId, otp })
      onLinked?.(upiId, r.upiIds)
      onClose?.()
    } catch (e) {
      setError(e?.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Link UPI</h3>
          <button onClick={onClose}>✖</button>
        </div>
        {step === 1 && (
          <div className="space-y-3">
            <input className="w-full p-2 border rounded-md bg-transparent" placeholder="yourname@upi" value={upiId} onChange={e=>setUpiId(e.target.value)} />
            <button className="btn btn-primary" onClick={start} disabled={loading || !upiId}>{loading ? 'Sending OTP…' : 'Send OTP'}</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-sm opacity-80">Enter OTP sent to your UPI app (demo OTP: 123456)</div>
            <input className="w-full p-2 border rounded-md bg-transparent" placeholder="123456" value={otp} onChange={e=>setOtp(e.target.value)} />
            <button className="btn btn-primary" onClick={verify} disabled={loading || !otp}>{loading ? 'Verifying…' : 'Verify & Link'}</button>
          </div>
        )}
        {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
      </div>
    </div>
  )
}
