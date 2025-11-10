import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Register(){
  const { register } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await register(username, email, password, confirmPassword)
      nav('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold">Create account</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input className="w-full p-2 border rounded-md bg-transparent" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full p-2 border rounded-md bg-transparent" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 border rounded-md bg-transparent" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input type="password" className="w-full p-2 border rounded-md bg-transparent" placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        <button className="btn btn-primary w-full h-10">Register</button>
      </form>
    </div>
  )
}
