import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Profile from './pages/Profile'
import About from './pages/About'
import Features from './pages/Features'
import ThemeToggle from './ui/ThemeToggle'
import DashboardLayout from './ui/DashboardLayout'

function Protected({ children }) {
  const { token } = useAuth()
  const loc = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />
  return children
}

function Shell() {
  const { token, logout } = useAuth()

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur bg-white/60 dark:bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-semibold text-lg md:text-2xl">Expensiooo</Link>
            <nav className="hidden md:flex items-center gap-6 text-base md:text-lg opacity-80">
              <Link to="/about">About</Link>
              <Link to="/features">Features</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {token ? (
              <>
                <button onClick={logout} className="h-10 md:h-11 px-4 md:px-5 border rounded-md text-base md:text-lg">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="h-10 md:h-11 px-4 md:px-5 border rounded-md text-base md:text-lg">Login</Link>
                <Link to="/register" className="btn btn-primary h-10 md:h-11 text-base md:text-lg">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected><DashboardLayout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>

      <footer className="py-8 text-center text-sm opacity-70">© {new Date().getFullYear()} Expensiooo</footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
