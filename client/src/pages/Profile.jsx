import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { api } from '../lib/api'

export default function Profile(){
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [info, setInfo] = useState('')

  const update = async () => {
    const r = await api.patch('/auth/me', { username })
    setInfo('Updated!')
  }
  const del = async () => {
    if (!confirm('Delete your account?')) return
    await api.del('/auth/me')
    location.href = '/'
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-3">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <div className="text-sm opacity-80">Email: {user?.email}</div>
      <input className="w-full p-2 border rounded-md bg-transparent" value={username} onChange={e=>setUsername(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={update}>Update</button>
        <button className="h-10 px-3 border rounded-md" onClick={del}>Delete Account</button>
      </div>
      {info && <div className="text-green-600 text-sm">{info}</div>}
    </div>
  )
}
