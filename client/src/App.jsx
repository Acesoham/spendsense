import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Profile from './pages/Profile'
import Currency from './pages/Currency'
import About from './pages/About'
import Features from './pages/Features'
import ThemeToggle from './ui/ThemeToggle'
import DashboardLayout from './ui/DashboardLayout'
import logo from './assets/logo.svg'
import ChatbotModal from './ui/ChatbotModal'

function Protected({ children }) {
  const { token } = useAuth()
  const loc = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />
  return children
}

function ChatbotRoute() {
  const navigate = useNavigate()
  return (
    <ChatbotModal open={true} onClose={() => navigate(-1)} />
  )
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
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/" className="font-semibold text-lg md:text-2xl">
              <span className="inline-flex items-center gap-2">
                <img src={logo} alt="logo" className="h-7 w-7" />
                <span>SpendSense</span>
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex basis-2/5 lg:basis-1/2 items-center justify-center gap-10 text-base md:text-lg opacity-80">
            <Link to="/about">About</Link>
            <Link to="/features">Features</Link>
          </nav>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            {token ? (
              <>
                <button onClick={logout} className="h-10 md:h-11 px-4 md:px-5 rounded-md text-base md:text-lg bg-gray-200 hover:bg-gray-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_2px_0_rgba(0,0,0,0.35)] border border-gray-700">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="h-10 md:h-11 px-4 md:px-5 rounded-md text-base md:text-lg bg-gradient-to-b from-gray-400 to-gray-500 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_2px_0_rgba(0,0,0,0.35)] border border-gray-700">LogIn</Link>
                <Link to="/register" className="h-10 md:h-11 px-4 md:px-5 rounded-md text-base md:text-lg bg-gray-200 hover:bg-gray-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_2px_0_rgba(0,0,0,0.35)] border border-gray-700">Register</Link>
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
          <Route path="/ChatbotModal" element={<ChatbotRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected><DashboardLayout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/currency" element={<Currency />} />
          </Route>
        </Routes>
      </main>

      <footer className="py-8 text-center text-sm opacity-70">© {new Date().getFullYear()} SpendSense</footer>
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
