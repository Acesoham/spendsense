import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      api.setToken(token)
      api.get('/auth/me').then(r => setUser(r.user)).catch(() => {})
    } else {
      localStorage.removeItem('token')
      api.setToken(null)
      setUser(null)
    }
  }, [token])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    setToken(r.token)
    setUser(r.user)
  }
  const register = async (username, email, password, confirmPassword) => {
    const r = await api.post('/auth/register', { username, email, password, confirmPassword })
    setToken(r.token)
    setUser(r.user)
  }
  const logout = () => setToken(null)

  return (
    <Ctx.Provider value={{ token, user, login, register, logout }}>
      {children}
    </Ctx.Provider>
  )
}
