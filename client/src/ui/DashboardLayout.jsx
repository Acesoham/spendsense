import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ChatbotModal from './ChatbotModal'
import { useAuth } from '../state/AuthContext'

export default function DashboardLayout(){
  const [openChat, setOpenChat] = useState(false)
  const [open, setOpen] = useState(true)
  const { logout } = useAuth()
  const nav = useNavigate()
  const linkCls = ({ isActive }) => `block rounded-md text-base md:text-lg px-4 py-3 ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`

  const doLogout = () => { logout(); nav('/') }

  return (
    <div className="w-full">
      {/* Sidebar toggle button */}
      <button
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        onClick={() => setOpen(o=>!o)}
        className="hidden md:flex items-center justify-center fixed top-3 left-1 z-20 h-10 w-10 rounded-md border bg-white/70 dark:bg-gray-900/70 backdrop-blur"
        title={open ? 'Collapse' : 'Expand'}
      >{open ? '«' : '☰'}</button>

      {/* Fixed full-height explorer-like sidebar */}
      <aside className={`hidden md:block fixed left-0 top-16 bottom-0 w-80 lg:w-96 z-10 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full overflow-auto card rounded-none lg:rounded-tr-xl lg:rounded-br-xl p-4 md:p-5">
          <div className="mb-4 text-xl font-semibold"></div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={linkCls}>🏠 Dashboard</NavLink>
            <div className="text-[10px] uppercase tracking-wide opacity-60 mt-3 mb-1">Expenses</div>
            <NavLink to="/expenses" className={linkCls}>➕ Add Expense</NavLink>
            <NavLink to="/expenses" className={linkCls}>📒 Expense Logs</NavLink>
            <div className="text-[10px] uppercase tracking-wide opacity-60 mt-4 mb-1">Account</div>
            <NavLink to="/profile" className={linkCls}>👤 Profile</NavLink>
            <button className="w-full text-left rounded-md text-base md:text-lg px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={()=>setOpenChat(true)}>💬 AI Chatbot</button>
            <button className="w-full text-left rounded-md text-base md:text-lg px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={doLogout}>🚪 Logout</button>
          </nav>
        </div>
      </aside>

      {/* Content shifted to the right of the fixed sidebar */}
      <section className={`px-4 md:px-8 py-6 md:py-8 transition-all duration-200 ${open ? 'ml-0 md:ml-80 lg:ml-96' : 'ml-0 md:ml-0'}`}>
        <Outlet />
      </section>

      <ChatbotModal open={openChat} onClose={()=>setOpenChat(false)} />
    </div>
  )
}
