import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { Link } from 'react-router-dom'
import illus from '../assets/ET.jpg'

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
    <div className="min-h-[calc(100vh-6rem)]">
      <div className="bg-gradient-to-r from-[#0f766e] to-[#334155] text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-center">SignUp page</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="hidden md:flex items-center justify-center">
          <img src={illus} alt="Finance illustration" className="max-w-full h-auto rounded-md shadow-sm" />
        </div>

        <div className="max-w-md w-full mx-auto md:mx-0">
          <div className="card p-6 md:p-8">
            <div className="flex items-center justify-center gap-6 text-lg">
              <Link to="/login" className="opacity-60 hover:opacity-100">Login</Link>
              <span className="font-semibold border-b-2 border-slate-500">SignUp</span>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-6">
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <input
                className="w-full bg-transparent px-0 pb-1 border-0 border-b border-[#5a6f64] focus:border-[#2f4a3f] outline-none"
                placeholder="Username"
                value={username}
                onChange={e=>setUsername(e.target.value)}
              />
              <input
                className="w-full bg-transparent px-0 pb-1 border-0 border-b border-[#5a6f64] focus:border-[#2f4a3f] outline-none"
                placeholder="Email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
              />
              <input
                type="password"
                className="w-full bg-transparent px-0 pb-1 border-0 border-b border-[#5a6f64] focus:border-[#2f4a3f] outline-none"
                placeholder="Password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
              />
              <input
                type="password"
                className="w-full bg-transparent px-0 pb-1 border-0 border-b border-[#5a6f64] focus:border-[#2f4a3f] outline-none"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e=>setConfirmPassword(e.target.value)}
              />

              <button className="w-full h-10 rounded-md bg-gradient-to-r from-[#476977] to-[#2d3f48] text-white">Register</button>

              <div className="text-center text-sm opacity-70">Or</div>
              <div className="flex items-center justify-center gap-6">
                <button type="button" onClick={()=>alert('Google sign-in not configured')} className="h-10 w-10 rounded-full border flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.651 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.627 6.053 29.627 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.815C14.471 15.108 18.878 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.627 6.053 29.627 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.2-5.238C29.164 35.091 26.709 36 24 36c-5.201 0-9.613-3.32-11.289-7.946l-6.547 5.04C9.464 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.235-2.231 4.166-4.094 5.565l-.003-.002 6.2 5.238C39.014 36.255 44 30.667 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                  </svg>
                </button>
                <button type="button" onClick={()=>alert('Facebook sign-in not configured')} className="h-10 w-10 rounded-full border flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1877F2" className="h-5 w-5">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.093 10.125 24v-8.437H7.078V12.07h3.047V9.413c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.49 0-1.953.925-1.953 1.874v2.261h3.328l-.532 3.493h-2.796V24C19.612 23.093 24 18.1 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
